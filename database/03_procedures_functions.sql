
USE `unidesk_db`;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1. STORED FUNCTION: fn_is_office_open_now
-- Evaluates real-time office availability based on engine clock and operating hours.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS `fn_is_office_open_now`$$
CREATE FUNCTION `fn_is_office_open_now`(p_office_id INT)
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_current_day TINYINT;
    DECLARE v_current_time TIME;
    DECLARE v_is_open TINYINT(1) DEFAULT 0;

    -- Current day of week (0=Sunday, 1=Monday... 6=Saturday)
    SET v_current_day = DAYOFWEEK(NOW()) - 1;
    SET v_current_time = CURTIME();

    SELECT CASE 
        WHEN `is_closed` = FALSE AND v_current_time >= `open_time` AND v_current_time <= `close_time` THEN 1
        ELSE 0
    END INTO v_is_open
    FROM `office_operating_hours`
    WHERE `office_id` = p_office_id AND `day_of_week` = v_current_day
    LIMIT 1;

    RETURN IFNULL(v_is_open, 0);
END$$

-- ----------------------------------------------------------------------------
-- 2. STORED PROCEDURE: sp_resolve_office_by_query
-- High-performance parameterized lookup engine matching problems/keywords
-- to administrative handling offices, physical locations, and fees.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_resolve_office_by_query`$$
CREATE PROCEDURE `sp_resolve_office_by_query`(
    IN p_search_term VARCHAR(150)
)
BEGIN
    DECLARE v_pattern VARCHAR(160);
    SET v_pattern = CONCAT('%', TRIM(p_search_term), '%');

    SELECT 
        o.`office_id`,
        o.`office_code`,
        o.`name` AS `office_name`,
        o.`email`,
        o.`phone`,
        o.`desk_directions`,
        o.`is_accepting_payments`,
        o.`is_accepting_reservations`,
        f.`room_number`,
        f.`floor_number`,
        b.`building_code`,
        b.`name` AS `building_name`,
        b.`latitude` AS `building_lat`,
        b.`longitude` AS `building_lng`,
        c.`name` AS `campus_name`,
        i.`issue_id`,
        i.`issue_code`,
        i.`issue_name`,
        i.`description` AS `issue_description`,
        i.`standard_fee`,
        i.`requires_in_person`,
        ic.`category_name` AS `issue_category`,
        m.`priority_level`,
        m.`resolution_guide`,
        m.`avg_resolution_minutes`,
        fn_is_office_open_now(o.`office_id`) AS `is_open_now`,
        -- Relevance scoring calculation
        (
            (CASE WHEN i.`issue_name` LIKE v_pattern THEN 40 ELSE 0 END) +
            (CASE WHEN o.`name` LIKE v_pattern THEN 30 ELSE 0 END) +
            (CASE WHEN EXISTS (
                SELECT 1 FROM `issue_search_keywords` k 
                WHERE k.`issue_id` = i.`issue_id` AND k.`keyword` LIKE v_pattern
            ) THEN 25 ELSE 0 END) +
            (CASE WHEN ic.`category_name` LIKE v_pattern THEN 15 ELSE 0 END) +
            (CASE WHEN i.`description` LIKE v_pattern THEN 10 ELSE 0 END)
        ) AS `relevance_score`
    FROM `issues` i
    INNER JOIN `issue_categories` ic ON i.`issue_category_id` = ic.`issue_category_id`
    INNER JOIN `issue_office_mappings` m ON i.`issue_id` = m.`issue_id`
    INNER JOIN `offices` o ON m.`office_id` = o.`office_id`
    INNER JOIN `facilities` f ON o.`facility_id` = f.`facility_id`
    INNER JOIN `buildings` b ON f.`building_id` = b.`building_id`
    INNER JOIN `campuses` c ON b.`campus_id` = c.`campus_id`
    WHERE 
        p_search_term IS NULL 
        OR TRIM(p_search_term) = ''
        OR i.`issue_name` LIKE v_pattern
        OR o.`name` LIKE v_pattern
        OR ic.`category_name` LIKE v_pattern
        OR i.`description` LIKE v_pattern
        OR EXISTS (
            SELECT 1 FROM `issue_search_keywords` k 
            WHERE k.`issue_id` = i.`issue_id` AND k.`keyword` LIKE v_pattern
        )
    ORDER BY `relevance_score` DESC, m.`priority_level` ASC, o.`name` ASC;
END$$

-- ----------------------------------------------------------------------------
-- 3. STORED PROCEDURE: sp_book_office_reservation
-- Parameterized transaction-safe booking routine with automated fee transaction generation.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_book_office_reservation`$$
CREATE PROCEDURE `sp_book_office_reservation`(
    IN p_user_id INT,
    IN p_office_id INT,
    IN p_issue_id INT,
    IN p_reservation_date DATE,
    IN p_slot_time TIME,
    IN p_notes TEXT,
    OUT p_reservation_id INT,
    OUT p_transaction_id INT,
    OUT p_fee_amount DECIMAL(10, 2),
    OUT p_status_code VARCHAR(20),
    OUT p_status_message VARCHAR(255)
)
proc_block: BEGIN
    DECLARE v_conflict_count INT DEFAULT 0;
    DECLARE v_issue_fee DECIMAL(10, 2) DEFAULT 0.00;
    DECLARE v_ref_no VARCHAR(80);

    -- Error exit handler for rollbacks
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_reservation_id = NULL;
        SET p_transaction_id = NULL;
        SET p_fee_amount = 0.00;
        SET p_status_code = 'ERROR';
        SET p_status_message = 'Transaction aborted: Database constraint or trigger violation.';
    END;

    START TRANSACTION;

    -- 1. Check for double booking conflicts on the same user and time slot
    SELECT COUNT(*) INTO v_conflict_count
    FROM `office_reservations`
    WHERE `user_id` = p_user_id 
      AND `reservation_date` = p_reservation_date
      AND `slot_time` = p_slot_time
      AND `status` IN ('PENDING', 'CONFIRMED');

    IF v_conflict_count > 0 THEN
        ROLLBACK;
        SET p_reservation_id = NULL;
        SET p_transaction_id = NULL;
        SET p_fee_amount = 0.00;
        SET p_status_code = 'CONFLICT';
        SET p_status_message = 'User already has a conflicting reservation at this date and time.';
        LEAVE proc_block;
    END IF;

    -- 2. Retrieve standard fee for the requested issue
    SELECT `standard_fee` INTO v_issue_fee
    FROM `issues`
    WHERE `issue_id` = p_issue_id;

    IF v_issue_fee IS NULL THEN
        SET v_issue_fee = 0.00;
    END IF;

    -- 3. Insert reservation (Database trigger trg_validate_reservation_schedule verifies hours)
    INSERT INTO `office_reservations` (
        `user_id`, `office_id`, `issue_id`, `reservation_date`, `slot_time`, `status`, `notes`
    ) VALUES (
        p_user_id, p_office_id, p_issue_id, p_reservation_date, p_slot_time, 'PENDING', p_notes
    );

    SET p_reservation_id = LAST_INSERT_ID();
    SET p_fee_amount = v_issue_fee;

    -- 4. If issue has an administrative fee, automatically generate pending transaction
    IF v_issue_fee > 0.00 THEN
        SET v_ref_no = CONCAT('TXN-', UNIX_TIMESTAMP(), '-', p_reservation_id);

        INSERT INTO `transactions` (
            `reservation_id`, `user_id`, `office_id`, `issue_id`, `amount`, `payment_method`, `payment_status`, `reference_no`
        ) VALUES (
            p_reservation_id, p_user_id, p_office_id, p_issue_id, v_issue_fee, 'CASH', 'PENDING', v_ref_no
        );

        SET p_transaction_id = LAST_INSERT_ID();
        SET p_status_code = 'PAYMENT_REQUIRED';
        SET p_status_message = 'Reservation created successfully. Pending fee payment required.';
    ELSE
        -- No fee required: automatically mark confirmed
        UPDATE `office_reservations`
        SET `status` = 'CONFIRMED'
        WHERE `reservation_id` = p_reservation_id;

        SET p_transaction_id = NULL;
        SET p_status_code = 'CONFIRMED';
        SET p_status_message = 'Reservation confirmed successfully (No fee required).';
    END IF;

    COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- 4. STORED PROCEDURE: sp_process_office_payment
-- Atomic settlement of office transaction and automatic reservation confirmation.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_process_office_payment`$$
CREATE PROCEDURE `sp_process_office_payment`(
    IN p_transaction_id INT,
    IN p_payment_method VARCHAR(30),
    IN p_amount_paid DECIMAL(10, 2),
    OUT p_result_code VARCHAR(20),
    OUT p_result_message VARCHAR(255)
)
proc_block: BEGIN
    DECLARE v_required_amount DECIMAL(10, 2);
    DECLARE v_current_status VARCHAR(20);
    DECLARE v_reservation_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = 'ERROR';
        SET p_result_message = 'Payment execution failed due to database engine exception.';
    END;

    START TRANSACTION;

    -- Fetch and lock transaction row
    SELECT `amount`, `payment_status`, `reservation_id`
    INTO v_required_amount, v_current_status, v_reservation_id
    FROM `transactions`
    WHERE `transaction_id` = p_transaction_id
    FOR UPDATE;

    IF v_required_amount IS NULL THEN
        ROLLBACK;
        SET p_result_code = 'NOT_FOUND';
        SET p_result_message = 'Transaction record does not exist.';
        LEAVE proc_block;
    END IF;

    IF v_current_status = 'PAID' THEN
        ROLLBACK;
        SET p_result_code = 'ALREADY_PAID';
        SET p_result_message = 'Transaction is already settled and verified.';
        LEAVE proc_block;
    END IF;

    IF p_amount_paid < v_required_amount THEN
        ROLLBACK;
        SET p_result_code = 'UNDERPAID';
        SET p_result_message = CONCAT('Insufficient payment amount. Required: ', v_required_amount);
        LEAVE proc_block;
    END IF;

    -- Settle transaction: Update status and paid timestamp
    -- Note: trg_on_transaction_payment_settled trigger automatically fires here!
    UPDATE `transactions`
    SET 
        `payment_status` = 'PAID',
        `payment_method` = p_payment_method,
        `paid_at` = NOW()
    WHERE `transaction_id` = p_transaction_id;

    COMMIT;

    SET p_result_code = 'SUCCESS';
    SET p_result_message = 'Payment processed and verified. Reservation confirmed automatically.';
END$$

-- ----------------------------------------------------------------------------
-- 5. STORED PROCEDURE: sp_get_office_analytics
-- Complex calculation routine aggregating performance metrics and revenue inside DB engine.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_get_office_analytics`$$
CREATE PROCEDURE `sp_get_office_analytics`(
    IN p_office_id INT
)
BEGIN
    -- Result Set 1: Operational Summary
    SELECT 
        COUNT(DISTINCT r.`reservation_id`) AS `total_reservations`,
        COUNT(DISTINCT CASE WHEN r.`status` = 'CONFIRMED' THEN r.`reservation_id` END) AS `confirmed_count`,
        COUNT(DISTINCT CASE WHEN r.`status` = 'PENDING' THEN r.`reservation_id` END) AS `pending_count`,
        COUNT(DISTINCT CASE WHEN r.`status` = 'COMPLETED' THEN r.`reservation_id` END) AS `completed_count`,
        COUNT(DISTINCT CASE WHEN r.`status` = 'CANCELLED' THEN r.`reservation_id` END) AS `cancelled_count`,
        IFNULL(SUM(CASE WHEN t.`payment_status` = 'PAID' THEN t.`amount` ELSE 0 END), 0.00) AS `total_collected_revenue`,
        IFNULL(SUM(CASE WHEN t.`payment_status` = 'PENDING' THEN t.`amount` ELSE 0 END), 0.00) AS `pending_receivables`,
        COUNT(DISTINCT t.`transaction_id`) AS `total_transactions`
    FROM `offices` o
    LEFT JOIN `office_reservations` r ON o.`office_id` = r.`office_id`
    LEFT JOIN `transactions` t ON o.`office_id` = t.`office_id`
    WHERE (p_office_id IS NULL OR o.`office_id` = p_office_id);

    -- Result Set 2: Top Issues Handled
    SELECT 
        i.`issue_code`,
        i.`issue_name`,
        ic.`category_name`,
        COUNT(r.`reservation_id`) AS `booking_volume`,
        IFNULL(SUM(CASE WHEN t.`payment_status` = 'PAID' THEN t.`amount` ELSE 0 END), 0.00) AS `revenue_generated`
    FROM `issues` i
    INNER JOIN `issue_categories` ic ON i.`issue_category_id` = ic.`issue_category_id`
    LEFT JOIN `office_reservations` r ON i.`issue_id` = r.`issue_id` 
        AND (p_office_id IS NULL OR r.`office_id` = p_office_id)
    LEFT JOIN `transactions` t ON r.`reservation_id` = t.`reservation_id`
    GROUP BY i.`issue_id`, i.`issue_code`, i.`issue_name`, ic.`category_name`
    ORDER BY `booking_volume` DESC, `revenue_generated` DESC
    LIMIT 5;

    -- Result Set 3: Hourly Traffic Distribution
    SELECT 
        HOUR(r.`slot_time`) AS `hour_of_day`,
        COUNT(r.`reservation_id`) AS `slots_booked`
    FROM `office_reservations` r
    WHERE (p_office_id IS NULL OR r.`office_id` = p_office_id)
    GROUP BY HOUR(r.`slot_time`)
    ORDER BY `hour_of_day` ASC;
END$$

DELIMITER ;
