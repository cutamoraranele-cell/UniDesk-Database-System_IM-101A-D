-- ============================================================================
-- UNIDESK DATABASE SYSTEM: DDL FOR DRAW.IO SQL IMPORT
-- ============================================================================
-- INSTRUCTIONS FOR DRAW.IO:
-- 1. Open https://app.diagrams.net/
-- 2. Click: Arrange > Insert > Advanced > SQL... (or + > Advanced > SQL...)
-- 3. Paste this entire file and click "Insert"
-- ============================================================================

CREATE TABLE campuses (
    campus_id INT PRIMARY KEY,
    campus_code VARCHAR(20) UNIQUE,
    name VARCHAR(150),
    address VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at DATETIME
);

CREATE TABLE buildings (
    building_id INT PRIMARY KEY,
    campus_id INT,
    building_code VARCHAR(20) UNIQUE,
    name VARCHAR(150),
    total_floors TINYINT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at DATETIME,
    FOREIGN KEY (campus_id) REFERENCES campuses(campus_id)
);

CREATE TABLE facility_categories (
    category_id INT PRIMARY KEY,
    category_code VARCHAR(30) UNIQUE,
    name VARCHAR(100),
    description VARCHAR(255),
    icon_name VARCHAR(50)
);

CREATE TABLE facilities (
    facility_id INT PRIMARY KEY,
    building_id INT,
    category_id INT,
    room_number VARCHAR(30),
    floor_number TINYINT,
    name VARCHAR(150),
    description TEXT,
    is_public BOOLEAN,
    created_at DATETIME,
    FOREIGN KEY (building_id) REFERENCES buildings(building_id),
    FOREIGN KEY (category_id) REFERENCES facility_categories(category_id)
);

CREATE TABLE offices (
    office_id INT PRIMARY KEY,
    facility_id INT,
    office_code VARCHAR(30) UNIQUE,
    name VARCHAR(150),
    email VARCHAR(120),
    phone VARCHAR(40),
    desk_directions TEXT,
    is_accepting_payments BOOLEAN,
    is_accepting_reservations BOOLEAN,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id)
);

CREATE TABLE office_operating_hours (
    hours_id INT PRIMARY KEY,
    office_id INT,
    day_of_week TINYINT,
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN,
    FOREIGN KEY (office_id) REFERENCES offices(office_id)
);

CREATE TABLE user_accounts (
    user_id INT PRIMARY KEY,
    email VARCHAR(120) UNIQUE,
    password_hash VARCHAR(255),
    user_role VARCHAR(20),
    is_active BOOLEAN,
    created_at DATETIME,
    updated_at DATETIME
);

CREATE TABLE user_profiles (
    profile_id INT PRIMARY KEY,
    user_id INT UNIQUE,
    student_or_visitor_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(120),
    phone_number VARCHAR(30),
    department_or_affiliation VARCHAR(120),
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user_accounts(user_id)
);

CREATE TABLE issue_categories (
    issue_category_id INT PRIMARY KEY,
    category_name VARCHAR(80) UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE issues (
    issue_id INT PRIMARY KEY,
    issue_category_id INT,
    issue_code VARCHAR(30) UNIQUE,
    issue_name VARCHAR(150),
    description TEXT,
    standard_fee DECIMAL(10,2),
    requires_in_person BOOLEAN,
    created_at DATETIME,
    FOREIGN KEY (issue_category_id) REFERENCES issue_categories(issue_category_id)
);

-- M:M Junction 1: Issues <-> Offices (with intersection attributes)
CREATE TABLE issue_office_mappings (
    mapping_id INT PRIMARY KEY,
    issue_id INT,
    office_id INT,
    priority_level VARCHAR(20),
    resolution_guide TEXT,
    avg_resolution_minutes INT,
    is_active BOOLEAN,
    mapped_at DATETIME,
    FOREIGN KEY (issue_id) REFERENCES issues(issue_id),
    FOREIGN KEY (office_id) REFERENCES offices(office_id)
);

-- M:M Junction 2: Staff User Accounts <-> Offices (with intersection attributes)
CREATE TABLE office_staff_assignments (
    assignment_id INT PRIMARY KEY,
    user_id INT,
    office_id INT,
    assigned_role VARCHAR(30),
    assignment_status VARCHAR(20),
    shift_schedule VARCHAR(30),
    can_process_payments BOOLEAN,
    daily_case_quota INT,
    assigned_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user_accounts(user_id),
    FOREIGN KEY (office_id) REFERENCES offices(office_id)
);

CREATE TABLE office_reservations (
    reservation_id INT PRIMARY KEY,
    user_id INT,
    office_id INT,
    issue_id INT,
    reservation_date DATE,
    slot_time TIME,
    status VARCHAR(20),
    notes TEXT,
    location_override VARCHAR(255),
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user_accounts(user_id),
    FOREIGN KEY (office_id) REFERENCES offices(office_id),
    FOREIGN KEY (issue_id) REFERENCES issues(issue_id)
);

CREATE TABLE transactions (
    transaction_id INT PRIMARY KEY,
    reservation_id INT,
    user_id INT,
    office_id INT,
    issue_id INT,
    amount DECIMAL(10,2),
    payment_method VARCHAR(30),
    payment_status VARCHAR(20),
    reference_no VARCHAR(80) UNIQUE,
    paid_at DATETIME,
    created_at DATETIME,
    FOREIGN KEY (reservation_id) REFERENCES office_reservations(reservation_id),
    FOREIGN KEY (user_id) REFERENCES user_accounts(user_id),
    FOREIGN KEY (office_id) REFERENCES offices(office_id),
    FOREIGN KEY (issue_id) REFERENCES issues(issue_id)
);

CREATE TABLE audit_logs (
    log_id BIGINT PRIMARY KEY,
    table_name VARCHAR(64),
    action_type VARCHAR(10),
    record_id VARCHAR(64),
    old_values TEXT,
    new_values TEXT,
    performed_by VARCHAR(100),
    performed_at DATETIME
);
