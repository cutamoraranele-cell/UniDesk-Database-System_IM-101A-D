
USE `unidesk_db`;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1. IMMUTABILITY ENFORCEMENT ON AUDIT LOGS
-- Guarantee that audit records cannot be tampered with or purged.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_audit_logs_immutable_update`$$
CREATE TRIGGER `trg_audit_logs_immutable_update`
BEFORE UPDATE ON `audit_logs`
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Security Violation: Audit logs are immutable and cannot be modified.';
END$$

DROP TRIGGER IF EXISTS `trg_audit_logs_immutable_delete`$$
CREATE TRIGGER `trg_audit_logs_immutable_delete`
BEFORE DELETE ON `audit_logs`
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Security Violation: Audit logs are immutable and cannot be deleted.';
END$$

-- ----------------------------------------------------------------------------
-- 2. OPERATIONAL VALIDATION TRIGGER: RESERVATION SCHEDULE INTEGRITY
-- Validates office availability, operating hours, and active status at engine level.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_validate_reservation_schedule`$$
CREATE TRIGGER `trg_validate_reservation_schedule`
BEFORE INSERT ON `office_reservations`
FOR EACH ROW
BEGIN
    DECLARE v_is_accepting BOOLEAN DEFAULT FALSE;
    DECLARE v_day_of_week TINYINT;
    DECLARE v_is_closed BOOLEAN DEFAULT TRUE;
    DECLARE v_open_time TIME;
    DECLARE v_close_time TIME;

    -- Verify office accepts reservations
    SELECT `is_accepting_reservations` INTO v_is_accepting
    FROM `offices`
    WHERE `office_id` = NEW.`office_id`;

    IF v_is_accepting IS NULL OR v_is_accepting = FALSE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Engine Rule Violation: Target office is currently not accepting reservations.';
    END IF;

    -- MySQL DAYOFWEEK returns 1=Sunday, 2=Monday... Convert to 0=Sunday..6=Saturday
    SET v_day_of_week = DAYOFWEEK(NEW.`reservation_date`) - 1;

    -- Check operating hours for that specific day
    SELECT `is_closed`, `open_time`, `close_time`
    INTO v_is_closed, v_open_time, v_close_time
    FROM `office_operating_hours`
    WHERE `office_id` = NEW.`office_id` AND `day_of_week` = v_day_of_week
    LIMIT 1;

    IF v_is_closed IS NULL OR v_is_closed = TRUE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Engine Rule Violation: Office is closed on the selected day of the week.';
    END IF;

    IF NEW.`slot_time` < v_open_time OR NEW.`slot_time` >= v_close_time THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Engine Rule Violation: Selected reservation slot falls outside office operating hours.';
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- 3. STATE SYNCHRONIZATION TRIGGER: TRANSACTION -> RESERVATION CONFIRMATION
-- Automatically marks linked reservation as CONFIRMED upon successful payment.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_on_transaction_payment_settled`$$
CREATE TRIGGER `trg_on_transaction_payment_settled`
AFTER UPDATE ON `transactions`
FOR EACH ROW
BEGIN
    IF NEW.`payment_status` = 'PAID' AND OLD.`payment_status` <> 'PAID' THEN
        IF NEW.`reservation_id` IS NOT NULL THEN
            UPDATE `office_reservations`
            SET `status` = 'CONFIRMED'
            WHERE `reservation_id` = NEW.`reservation_id`
              AND `status` = 'PENDING';
        END IF;
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- 4. AUTOMATED ENGINE AUDIT LOGGING: OFFICES TABLE
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_offices_audit_insert`$$
CREATE TRIGGER `trg_offices_audit_insert`
AFTER INSERT ON `offices`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`table_name`, `action_type`, `record_id`, `old_values`, `new_values`, `performed_by`)
    VALUES (
        'offices',
        'INSERT',
        CAST(NEW.`office_id` AS CHAR),
        NULL,
        JSON_OBJECT(
            'office_id', NEW.`office_id`,
            'office_code', NEW.`office_code`,
            'name', NEW.`name`,
            'email', NEW.`email`,
            'phone', NEW.`phone`,
            'is_accepting_payments', NEW.`is_accepting_payments`,
            'is_accepting_reservations', NEW.`is_accepting_reservations`
        ),
        CURRENT_USER()
    );
END$$

DROP TRIGGER IF EXISTS `trg_offices_audit_update`$$
CREATE TRIGGER `trg_offices_audit_update`
AFTER UPDATE ON `offices`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`table_name`, `action_type`, `record_id`, `old_values`, `new_values`, `performed_by`)
    VALUES (
        'offices',
        'UPDATE',
        CAST(NEW.`office_id` AS CHAR),
        JSON_OBJECT(
            'office_code', OLD.`office_code`,
            'name', OLD.`name`,
            'email', OLD.`email`,
            'phone', OLD.`phone`,
            'is_accepting_payments', OLD.`is_accepting_payments`,
            'is_accepting_reservations', OLD.`is_accepting_reservations`
        ),
        JSON_OBJECT(
            'office_code', NEW.`office_code`,
            'name', NEW.`name`,
            'email', NEW.`email`,
            'phone', NEW.`phone`,
            'is_accepting_payments', NEW.`is_accepting_payments`,
            'is_accepting_reservations', NEW.`is_accepting_reservations`
        ),
        CURRENT_USER()
    );
END$$

DROP TRIGGER IF EXISTS `trg_offices_audit_delete`$$
CREATE TRIGGER `trg_offices_audit_delete`
AFTER DELETE ON `offices`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`table_name`, `action_type`, `record_id`, `old_values`, `new_values`, `performed_by`)
    VALUES (
        'offices',
        'DELETE',
        CAST(OLD.`office_id` AS CHAR),
        JSON_OBJECT(
            'office_id', OLD.`office_id`,
            'office_code', OLD.`office_code`,
            'name', OLD.`name`,
            'email', OLD.`email`
        ),
        NULL,
        CURRENT_USER()
    );
END$$

-- ----------------------------------------------------------------------------
-- 5. AUTOMATED ENGINE AUDIT LOGGING: OFFICE RESERVATIONS TABLE
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_reservations_audit_insert`$$
CREATE TRIGGER `trg_reservations_audit_insert`
AFTER INSERT ON `office_reservations`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`table_name`, `action_type`, `record_id`, `old_values`, `new_values`, `performed_by`)
    VALUES (
        'office_reservations',
        'INSERT',
        CAST(NEW.`reservation_id` AS CHAR),
        NULL,
        JSON_OBJECT(
            'reservation_id', NEW.`reservation_id`,
            'user_id', NEW.`user_id`,
            'office_id', NEW.`office_id`,
            'issue_id', NEW.`issue_id`,
            'reservation_date', NEW.`reservation_date`,
            'slot_time', CAST(NEW.`slot_time` AS CHAR),
            'status', NEW.`status`
        ),
        CURRENT_USER()
    );
END$$

DROP TRIGGER IF EXISTS `trg_reservations_audit_update`$$
CREATE TRIGGER `trg_reservations_audit_update`
AFTER UPDATE ON `office_reservations`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`table_name`, `action_type`, `record_id`, `old_values`, `new_values`, `performed_by`)
    VALUES (
        'office_reservations',
        'UPDATE',
        CAST(NEW.`reservation_id` AS CHAR),
        JSON_OBJECT(
            'status', OLD.`status`,
            'reservation_date', OLD.`reservation_date`,
            'slot_time', CAST(OLD.`slot_time` AS CHAR),
            'location_override', OLD.`location_override`
        ),
        JSON_OBJECT(
            'status', NEW.`status`,
            'reservation_date', NEW.`reservation_date`,
            'slot_time', CAST(NEW.`slot_time` AS CHAR),
            'location_override', NEW.`location_override`
        ),
        CURRENT_USER()
    );
END$$

DROP TRIGGER IF EXISTS `trg_reservations_audit_delete`$$
CREATE TRIGGER `trg_reservations_audit_delete`
AFTER DELETE ON `office_reservations`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`table_name`, `action_type`, `record_id`, `old_values`, `new_values`, `performed_by`)
    VALUES (
        'office_reservations',
        'DELETE',
        CAST(OLD.`reservation_id` AS CHAR),
        JSON_OBJECT(
            'reservation_id', OLD.`reservation_id`,
            'user_id', OLD.`user_id`,
            'office_id', OLD.`office_id`,
            'issue_id', OLD.`issue_id`,
            'reservation_date', OLD.`reservation_date`,
            'slot_time', CAST(OLD.`slot_time` AS CHAR),
            'status', OLD.`status`
        ),
        NULL,
        CURRENT_USER()
    );
END$$

-- ----------------------------------------------------------------------------
-- 6. AUTOMATED ENGINE AUDIT LOGGING: TRANSACTIONS TABLE
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_transactions_audit_insert`$$
CREATE TRIGGER `trg_transactions_audit_insert`
AFTER INSERT ON `transactions`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`table_name`, `action_type`, `record_id`, `old_values`, `new_values`, `performed_by`)
    VALUES (
        'transactions',
        'INSERT',
        CAST(NEW.`transaction_id` AS CHAR),
        NULL,
        JSON_OBJECT(
            'transaction_id', NEW.`transaction_id`,
            'reservation_id', NEW.`reservation_id`,
            'user_id', NEW.`user_id`,
            'office_id', NEW.`office_id`,
            'issue_id', NEW.`issue_id`,
            'amount', NEW.`amount`,
            'payment_method', NEW.`payment_method`,
            'payment_status', NEW.`payment_status`,
            'reference_no', NEW.`reference_no`
        ),
        CURRENT_USER()
    );
END$$

DROP TRIGGER IF EXISTS `trg_transactions_audit_update`$$
CREATE TRIGGER `trg_transactions_audit_update`
AFTER UPDATE ON `transactions`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`table_name`, `action_type`, `record_id`, `old_values`, `new_values`, `performed_by`)
    VALUES (
        'transactions',
        'UPDATE',
        CAST(NEW.`transaction_id` AS CHAR),
        JSON_OBJECT(
            'payment_status', OLD.`payment_status`,
            'paid_at', OLD.`paid_at`
        ),
        JSON_OBJECT(
            'payment_status', NEW.`payment_status`,
            'paid_at', NEW.`paid_at`
        ),
        CURRENT_USER()
    );
END$$

-- ----------------------------------------------------------------------------
-- 7. AUTOMATED ENGINE AUDIT LOGGING: USER ACCOUNTS (SECURITY UPDATES)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_user_accounts_audit_insert`$$
CREATE TRIGGER `trg_user_accounts_audit_insert`
AFTER INSERT ON `user_accounts`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`table_name`, `action_type`, `record_id`, `old_values`, `new_values`, `performed_by`)
    VALUES (
        'user_accounts',
        'INSERT',
        CAST(NEW.`user_id` AS CHAR),
        NULL,
        JSON_OBJECT(
            'user_id', NEW.`user_id`,
            'email', NEW.`email`,
            'user_role', NEW.`user_role`,
            'is_active', NEW.`is_active`
        ),
        CURRENT_USER()
    );
END$$

DROP TRIGGER IF EXISTS `trg_user_accounts_audit_update`$$
CREATE TRIGGER `trg_user_accounts_audit_update`
AFTER UPDATE ON `user_accounts`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`table_name`, `action_type`, `record_id`, `old_values`, `new_values`, `performed_by`)
    VALUES (
        'user_accounts',
        'UPDATE',
        CAST(NEW.`user_id` AS CHAR),
        JSON_OBJECT(
            'user_role', OLD.`user_role`,
            'is_active', OLD.`is_active`
        ),
        JSON_OBJECT(
            'user_role', NEW.`user_role`,
            'is_active', NEW.`is_active`
        ),
        CURRENT_USER()
    );
END$$

DELIMITER ;
