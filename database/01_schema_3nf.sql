
CREATE DATABASE IF NOT EXISTS `unidesk_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `unidesk_db`;

-- Drop existing tables in reverse dependency order to ensure clean builds
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `ai_chat_logs`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `office_reservations`;
DROP TABLE IF EXISTS `office_staff_assignments`;
DROP TABLE IF EXISTS `issue_search_keywords`;
DROP TABLE IF EXISTS `issue_office_mappings`;
DROP TABLE IF EXISTS `issues`;
DROP TABLE IF EXISTS `issue_categories`;
DROP TABLE IF EXISTS `office_operating_hours`;
DROP TABLE IF EXISTS `offices`;
DROP TABLE IF EXISTS `facilities`;
DROP TABLE IF EXISTS `facility_categories`;
DROP TABLE IF EXISTS `buildings`;
DROP TABLE IF EXISTS `campuses`;
DROP TABLE IF EXISTS `user_profiles`;
DROP TABLE IF EXISTS `user_accounts`;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. CAMPUSES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `campuses` (
    `campus_id` INT AUTO_INCREMENT PRIMARY KEY,
    `campus_code` VARCHAR(20) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. BUILDINGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `buildings` (
    `building_id` INT AUTO_INCREMENT PRIMARY KEY,
    `campus_id` INT NOT NULL,
    `building_code` VARCHAR(20) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `total_floors` TINYINT NOT NULL DEFAULT 1,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_buildings_campus`
        FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`campus_id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. FACILITY CATEGORIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `facility_categories` (
    `category_id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_code` VARCHAR(30) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `icon_name` VARCHAR(50) NOT NULL DEFAULT 'building'
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. FACILITIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `facilities` (
    `facility_id` INT AUTO_INCREMENT PRIMARY KEY,
    `building_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    `room_number` VARCHAR(30) NOT NULL,
    `floor_number` TINYINT NOT NULL DEFAULT 1,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_facilities_building`
        FOREIGN KEY (`building_id`) REFERENCES `buildings` (`building_id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_facilities_category`
        FOREIGN KEY (`category_id`) REFERENCES `facility_categories` (`category_id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `uq_facility_room_building`
        UNIQUE (`building_id`, `room_number`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. OFFICES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `offices` (
    `office_id` INT AUTO_INCREMENT PRIMARY KEY,
    `facility_id` INT NOT NULL,
    `office_code` VARCHAR(30) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(40) NOT NULL,
    `desk_directions` TEXT NOT NULL,
    `is_accepting_payments` BOOLEAN NOT NULL DEFAULT TRUE,
    `is_accepting_reservations` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_offices_facility`
        FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. OFFICE OPERATING HOURS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `office_operating_hours` (
    `hours_id` INT AUTO_INCREMENT PRIMARY KEY,
    `office_id` INT NOT NULL,
    `day_of_week` TINYINT NOT NULL COMMENT '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday',
    `open_time` TIME NOT NULL DEFAULT '08:00:00',
    `close_time` TIME NOT NULL DEFAULT '17:00:00',
    `is_closed` BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT `fk_operating_hours_office`
        FOREIGN KEY (`office_id`) REFERENCES `offices` (`office_id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `chk_day_of_week`
        CHECK (`day_of_week` BETWEEN 0 AND 6),
    CONSTRAINT `uq_office_day`
        UNIQUE (`office_id`, `day_of_week`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. USER ACCOUNTS TABLE (CREDENTIALS - SEPARATED FOR 3NF COMPLIANCE)
-- ----------------------------------------------------------------------------
CREATE TABLE `user_accounts` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(120) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `user_role` ENUM('STUDENT', 'VISITOR', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. USER PROFILES TABLE (PROFILE DATA - 1:1 WITH USER ACCOUNTS)
-- ----------------------------------------------------------------------------
CREATE TABLE `user_profiles` (
    `profile_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `student_or_visitor_id` VARCHAR(50) NULL UNIQUE,
    `full_name` VARCHAR(120) NOT NULL,
    `phone_number` VARCHAR(30) NULL,
    `department_or_affiliation` VARCHAR(120) NULL,
    `office_id` INT NULL COMMENT 'Assigned administrative office for STAFF role; NULL for students, visitors, or admin',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_user_profiles_account`
        FOREIGN KEY (`user_id`) REFERENCES `user_accounts` (`user_id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_user_profiles_office`
        FOREIGN KEY (`office_id`) REFERENCES `offices` (`office_id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 9. ISSUE CATEGORIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `issue_categories` (
    `issue_category_id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_name` VARCHAR(80) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 10. ISSUES TABLE (PROBLEMS / ADMINISTRATIVE INQUIRIES)
-- ----------------------------------------------------------------------------
CREATE TABLE `issues` (
    `issue_id` INT AUTO_INCREMENT PRIMARY KEY,
    `issue_category_id` INT NOT NULL,
    `issue_code` VARCHAR(30) NOT NULL UNIQUE,
    `issue_name` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `standard_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `requires_in_person` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_issues_category`
        FOREIGN KEY (`issue_category_id`) REFERENCES `issue_categories` (`issue_category_id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `chk_issue_standard_fee`
        CHECK (`standard_fee` >= 0)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 11. ISSUE OFFICE MAPPINGS (JUNCTION TABLE - M:N RELATIONSHIP)
-- ----------------------------------------------------------------------------
CREATE TABLE `issue_office_mappings` (
    `mapping_id` INT AUTO_INCREMENT PRIMARY KEY,
    `issue_id` INT NOT NULL,
    `office_id` INT NOT NULL,
    `priority_level` ENUM('PRIMARY', 'SECONDARY', 'ESCALATION') NOT NULL DEFAULT 'PRIMARY',
    `resolution_guide` TEXT NOT NULL,
    `avg_resolution_minutes` INT NOT NULL DEFAULT 20,
    CONSTRAINT `fk_mapping_issue`
        FOREIGN KEY (`issue_id`) REFERENCES `issues` (`issue_id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_mapping_office`
        FOREIGN KEY (`office_id`) REFERENCES `offices` (`office_id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `uq_issue_office_pair`
        UNIQUE (`issue_id`, `office_id`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 12. OFFICE STAFF ASSIGNMENTS (JUNCTION TABLE - M:N WITH INTERSECTION ATTRIBUTES)
-- ----------------------------------------------------------------------------
CREATE TABLE `office_staff_assignments` (
    `assignment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `office_id` INT NOT NULL,
    `assigned_role` ENUM('OFFICE_HEAD', 'DUTY_OFFICER', 'CASE_HANDLER', 'CLERK', 'INTERN') NOT NULL DEFAULT 'CASE_HANDLER',
    `assignment_status` ENUM('ACTIVE', 'ON_LEAVE', 'TRANSFERRED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    `shift_schedule` ENUM('FULL_TIME', 'MORNING_SHIFT', 'AFTERNOON_SHIFT', 'ROTATING') NOT NULL DEFAULT 'FULL_TIME',
    `can_process_payments` BOOLEAN NOT NULL DEFAULT FALSE,
    `daily_case_quota` INT NOT NULL DEFAULT 25,
    `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_staff_assign_user`
        FOREIGN KEY (`user_id`) REFERENCES `user_accounts` (`user_id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_staff_assign_office`
        FOREIGN KEY (`office_id`) REFERENCES `offices` (`office_id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `uq_user_office_assignment`
        UNIQUE (`user_id`, `office_id`),
    CONSTRAINT `chk_daily_case_quota`
        CHECK (`daily_case_quota` >= 0)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 13. ISSUE SEARCH KEYWORDS TABLE (TAGGING JUNCTION TABLE FOR SEARCH ACCELERATION)
-- ----------------------------------------------------------------------------
CREATE TABLE `issue_search_keywords` (
    `keyword_id` INT AUTO_INCREMENT PRIMARY KEY,
    `issue_id` INT NOT NULL,
    `keyword` VARCHAR(80) NOT NULL,
    CONSTRAINT `fk_keywords_issue`
        FOREIGN KEY (`issue_id`) REFERENCES `issues` (`issue_id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `uq_issue_keyword`
        UNIQUE (`issue_id`, `keyword`),
    INDEX `idx_search_keyword` (`keyword`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 13. OFFICE RESERVATIONS TABLE (BOOKING / APPOINTMENTS)
-- ----------------------------------------------------------------------------
CREATE TABLE `office_reservations` (
    `reservation_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `office_id` INT NOT NULL,
    `issue_id` INT NOT NULL,
    `reservation_date` DATE NOT NULL,
    `slot_time` TIME NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `location_override` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_reservations_user`
        FOREIGN KEY (`user_id`) REFERENCES `user_accounts` (`user_id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_reservations_office`
        FOREIGN KEY (`office_id`) REFERENCES `offices` (`office_id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_reservations_issue`
        FOREIGN KEY (`issue_id`) REFERENCES `issues` (`issue_id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX `idx_reservation_office_date` (`office_id`, `reservation_date`, `slot_time`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 14. TRANSACTIONS TABLE (FINANCIAL SETTLEMENTS & SERVICE FEES)
-- ----------------------------------------------------------------------------
CREATE TABLE `transactions` (
    `transaction_id` INT AUTO_INCREMENT PRIMARY KEY,
    `reservation_id` INT NULL,
    `user_id` INT NOT NULL,
    `office_id` INT NOT NULL,
    `issue_id` INT NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `payment_method` ENUM('CASH', 'CARD', 'ONLINE_TRANSFER', 'CAMPUS_WALLET') NOT NULL DEFAULT 'CASH',
    `payment_status` ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `reference_no` VARCHAR(80) NOT NULL UNIQUE,
    `paid_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_transactions_reservation`
        FOREIGN KEY (`reservation_id`) REFERENCES `office_reservations` (`reservation_id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_transactions_user`
        FOREIGN KEY (`user_id`) REFERENCES `user_accounts` (`user_id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_transactions_office`
        FOREIGN KEY (`office_id`) REFERENCES `offices` (`office_id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_transactions_issue`
        FOREIGN KEY (`issue_id`) REFERENCES `issues` (`issue_id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `chk_transaction_amount`
        CHECK (`amount` >= 0)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 15. AUDIT LOGS TABLE (ENGINE-LEVEL AUTOMATED AUDIT TRAIL)
-- ----------------------------------------------------------------------------
CREATE TABLE `audit_logs` (
    `log_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `table_name` VARCHAR(64) NOT NULL,
    `action_type` ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    `record_id` VARCHAR(64) NOT NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `performed_by` VARCHAR(100) NOT NULL,
    `performed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_table_record` (`table_name`, `record_id`),
    INDEX `idx_audit_performed_at` (`performed_at`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 16. AI CHAT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `ai_chat_logs` (
    `chat_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `session_token` VARCHAR(80) NOT NULL,
    `user_query` TEXT NOT NULL,
    `detected_intent` VARCHAR(80) NOT NULL,
    `resolved_office_id` INT NULL,
    `ai_response` TEXT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_chat_user`
        FOREIGN KEY (`user_id`) REFERENCES `user_accounts` (`user_id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_chat_office`
        FOREIGN KEY (`resolved_office_id`) REFERENCES `offices` (`office_id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
