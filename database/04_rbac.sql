
USE `unidesk_db`;

-- 1. Create Application Role with Least Privilege
CREATE ROLE IF NOT EXISTS 'unidesk_app_role';

-- Grant DML privileges on specific domain tables (NO DROP/ALTER/TRUNCATE permissions)
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`campuses` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`buildings` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`facility_categories` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`facilities` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`offices` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`office_operating_hours` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`issue_categories` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`issues` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`issue_office_mappings` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`office_staff_assignments` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`issue_search_keywords` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`user_accounts` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`user_profiles` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE, DELETE ON `unidesk_db`.`office_reservations` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`transactions` TO 'unidesk_app_role';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.`ai_chat_logs` TO 'unidesk_app_role';

-- Audit logs are strictly read-only for application (Engine Triggers populate them!)
GRANT SELECT ON `unidesk_db`.`audit_logs` TO 'unidesk_app_role';

-- Grant trigger inspection capability
GRANT TRIGGER ON `unidesk_db`.* TO 'unidesk_app_role';

-- Grant execution privileges on all stored procedures and functions
GRANT EXECUTE ON PROCEDURE `unidesk_db`.`sp_resolve_office_by_query` TO 'unidesk_app_role';
GRANT EXECUTE ON PROCEDURE `unidesk_db`.`sp_book_office_reservation` TO 'unidesk_app_role';
GRANT EXECUTE ON PROCEDURE `unidesk_db`.`sp_process_office_payment` TO 'unidesk_app_role';
GRANT EXECUTE ON PROCEDURE `unidesk_db`.`sp_get_office_analytics` TO 'unidesk_app_role';
GRANT EXECUTE ON FUNCTION `unidesk_db`.`fn_is_office_open_now` TO 'unidesk_app_role';

-- 2. Create Application Service Account (Strictly Non-Root)
CREATE USER IF NOT EXISTS 'unidesk_app_user'@'localhost' IDENTIFIED BY 'UniDesk#SecureApp2026!';
CREATE USER IF NOT EXISTS 'unidesk_app_user'@'127.0.0.1' IDENTIFIED BY 'UniDesk#SecureApp2026!';
CREATE USER IF NOT EXISTS 'unidesk_app_user'@'%' IDENTIFIED BY 'UniDesk#SecureApp2026!';

-- Assign the hardened role
GRANT 'unidesk_app_role' TO 'unidesk_app_user'@'localhost';
GRANT 'unidesk_app_role' TO 'unidesk_app_user'@'127.0.0.1';
GRANT 'unidesk_app_role' TO 'unidesk_app_user'@'%';

-- Set default role active upon login
SET DEFAULT ROLE 'unidesk_app_role' FOR 'unidesk_app_user'@'localhost';
SET DEFAULT ROLE 'unidesk_app_role' FOR 'unidesk_app_user'@'127.0.0.1';
SET DEFAULT ROLE 'unidesk_app_role' FOR 'unidesk_app_user'@'%';

-- Also grant direct privileges in case client connection does not automatically activate role
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.* TO 'unidesk_app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.* TO 'unidesk_app_user'@'127.0.0.1';
GRANT SELECT, INSERT, UPDATE ON `unidesk_db`.* TO 'unidesk_app_user'@'%';
REVOKE DELETE, DROP, ALTER, CREATE, REFERENCES, INDEX ON `unidesk_db`.* FROM 'unidesk_app_user'@'localhost';
REVOKE DELETE, DROP, ALTER, CREATE, REFERENCES, INDEX ON `unidesk_db`.* FROM 'unidesk_app_user'@'127.0.0.1';
REVOKE DELETE, DROP, ALTER, CREATE, REFERENCES, INDEX ON `unidesk_db`.* FROM 'unidesk_app_user'@'%';
GRANT EXECUTE ON `unidesk_db`.* TO 'unidesk_app_user'@'localhost';
GRANT EXECUTE ON `unidesk_db`.* TO 'unidesk_app_user'@'127.0.0.1';
GRANT EXECUTE ON `unidesk_db`.* TO 'unidesk_app_user'@'%';

FLUSH PRIVILEGES;
