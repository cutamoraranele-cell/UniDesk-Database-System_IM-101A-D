-- ============================================================================
-- UNIDESK DATABASE SYSTEM (CAMPUS LOOKUP & ADMINISTRATIVE HUB)
-- MODULE 05: SEED DATA GENERATOR
-- ============================================================================

USE `unidesk_db`;

-- Disable FK checks during initial bulk insertion
SET FOREIGN_KEY_CHECKS = 0;

-- Clean existing data
TRUNCATE TABLE `ai_chat_logs`;
TRUNCATE TABLE `transactions`;
TRUNCATE TABLE `office_reservations`;
TRUNCATE TABLE `office_staff_assignments`;
TRUNCATE TABLE `issue_search_keywords`;
TRUNCATE TABLE `issue_office_mappings`;
TRUNCATE TABLE `issues`;
TRUNCATE TABLE `issue_categories`;
TRUNCATE TABLE `office_operating_hours`;
TRUNCATE TABLE `offices`;
TRUNCATE TABLE `facilities`;
TRUNCATE TABLE `facility_categories`;
TRUNCATE TABLE `buildings`;
TRUNCATE TABLE `campuses`;
TRUNCATE TABLE `user_profiles`;
TRUNCATE TABLE `user_accounts`;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. CAMPUSES
-- ----------------------------------------------------------------------------
INSERT INTO `campuses` (`campus_id`, `campus_code`, `name`, `address`, `latitude`, `longitude`) VALUES
(1, 'MAIN-CAMPUS', 'University Campus', 'Tagbilaran City, Bohol, Philippines', 9.650000, 123.868400);

-- ----------------------------------------------------------------------------
-- 2. BUILDINGS
-- ----------------------------------------------------------------------------
INSERT INTO `buildings` (`building_id`, `campus_id`, `building_code`, `name`, `total_floors`, `latitude`, `longitude`) VALUES
(1, 1, 'CAS-BLDG',    'CAS Building',             5, 9.650091, 123.868115),
(2, 1, 'BATES-BLDG',  'Bates Building',           3, 9.649228, 123.868618),
(3, 1, 'CLINIC-BLDG', 'Clinic House',             1, 9.649672, 123.868158),
(4, 1, 'ACT-BLDG',    'Activity Center Building', 3, 9.650162, 123.868730),
(5, 1, 'FRIENA-BLDG', 'Friena Building',          5, 9.650655, 123.868176);

-- ----------------------------------------------------------------------------
-- 3. FACILITY CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO `facility_categories` (`category_id`, `category_code`, `name`, `description`, `icon_name`) VALUES
(1, 'ADMIN', 'Administrative & Records', 'Core university executive and record administration', 'landmark'),
(2, 'FINANCE', 'Financial Services & Treasury', 'Fee payments, billing assessments, and scholarship grants', 'credit-card'),
(3, 'STUDENT_WELFARE', 'Student Affairs & Welfare', 'ID cards, student orgs, discipline, and student life', 'users'),
(4, 'HEALTH', 'Health & Medical Services', 'Campus clinic, emergency medical care, and wellness clearance', 'heart-pulse'),
(5, 'COUNSELING', 'Guidance & Psychological Services', 'Career counseling, peer support, and mental wellness', 'smile'),
(6, 'LIBRARY', 'Library & Learning Commons', 'Academic resources, study cubicles, and digital archives', 'book-open'),
(7, 'IT_SUPPORT', 'IT & Digital Infrastructure', 'Student portal, Wi-Fi credentials, and tech assistance', 'wifi');

-- ----------------------------------------------------------------------------
-- 4. FACILITIES (ROOMS / SUITES)
-- ----------------------------------------------------------------------------
INSERT INTO `facilities` (`facility_id`, `building_id`, `category_id`, `room_number`, `floor_number`, `name`, `description`, `is_public`) VALUES
(1, 2, 1, 'Room 101', 1, 'Office of the University Registrar Suite', 'Academic records, diplomas, transcripts, and enrollment verification', TRUE),
(2, 2, 2, 'Room 102', 1, 'Cashier & Student Accounts Office', 'Tuition assessments, fee settlements, refunds, and official receipts', TRUE),
(3, 4, 3, 'Room 201', 2, 'Student Affairs Office (OSA) Room', 'Student identification, student org accreditation, and student welfare', TRUE),
(4, 3, 4, 'Ground Floor', 1, 'University Health & Medical Clinic House', 'Campus physician triage, medical consultation, pharmacy, and emergency care', TRUE),
(5, 1, 5, 'Room 501', 5, 'Guidance & Counseling Room', 'Confidential student counseling, psychological support, and mental wellness', TRUE),
(6, 1, 6, 'Room 301', 3, 'University Library Room', 'Multi-floor learning commons, reference collections, thesis archives, and study areas', TRUE),
(7, 2, 7, 'Room 103', 1, 'Computer Laboratory', 'High-speed student terminal access, programming labs, and software workstations', TRUE),
(8, 5, 3, 'Room 501', 5, 'University Auditorium Hall', 'Main theater hall for convocations, symposiums, and cultural performances', TRUE);

-- ----------------------------------------------------------------------------
-- 5. OFFICES
-- ----------------------------------------------------------------------------
INSERT INTO `offices` (`office_id`, `facility_id`, `office_code`, `name`, `email`, `phone`, `desk_directions`, `is_accepting_payments`, `is_accepting_reservations`) VALUES
(1, 1, 'REG-01', 'Office of the University Registrar', 'registrar@unidesk.edu', '+63 (38) 411-2283 ext 101', 'Bates Building Ground Floor. Enter main lobby; Registrar counters 1-4 are to the right.', TRUE, TRUE),
(2, 2, 'CSH-01', 'Cashier Office', 'cashier@unidesk.edu', '+63 (38) 411-2283 ext 102', 'Bates Building Ground Floor. Turn left after entrance; Cashier payment windows 1-3.', TRUE, TRUE),
(3, 3, 'OSA-01', 'Student Affairs Office (OSA)', 'studentaffairs@unidesk.edu', '+63 (38) 411-2283 ext 201', 'Activity Center Building 2nd Floor. Take main stairway to Room 204.', TRUE, TRUE),
(4, 4, 'HLT-01', 'University Health Clinic', 'healthclinic@unidesk.edu', '+63 (38) 411-2283 ext 103', 'Clinic House Ground Floor. Enter through main porch; triage counter is directly inside.', TRUE, TRUE),
(5, 5, 'GDC-01', 'Guidance & Counseling Center', 'guidance@unidesk.edu', '+63 (38) 411-2283 ext 501', 'CAS Building 5th Floor. Take central elevator to 5th floor, Room 502.', FALSE, TRUE),
(6, 6, 'LIB-01', 'University Library Desk', 'librarydesk@unidesk.edu', '+63 (38) 411-2283 ext 301', 'CAS Building 3rd Floor. Enter library turnstiles; Circulation Desk is directly ahead.', TRUE, TRUE),
(7, 7, 'LAB-01', 'Computer Laboratory Operations', 'commlab@unidesk.edu', '+63 (38) 411-2283 ext 105', 'Bates Building Ground Floor. West corridor, Computer Lab Room 108.', FALSE, TRUE),
(8, 8, 'AUD-01', 'University Auditorium Events Desk', 'auditorium@unidesk.edu', '+63 (38) 411-2283 ext 505', 'Friena Building 5th Floor. Take elevators to the 5th floor auditorium lobby.', TRUE, TRUE);

-- ----------------------------------------------------------------------------
-- 6. OFFICE OPERATING HOURS (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
-- ----------------------------------------------------------------------------
INSERT INTO `office_operating_hours` (`office_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`) VALUES
-- Registrar (Mon-Fri 08:00-17:00, Sat 08:00-12:00, Sun Closed)
(1, 0, '00:00:00', '00:00:00', TRUE),
(1, 1, '08:00:00', '17:00:00', FALSE),
(1, 2, '08:00:00', '17:00:00', FALSE),
(1, 3, '08:00:00', '17:00:00', FALSE),
(1, 4, '08:00:00', '17:00:00', FALSE),
(1, 5, '08:00:00', '17:00:00', FALSE),
(1, 6, '08:00:00', '12:00:00', FALSE),

-- Cashier (Mon-Fri 08:00-16:30, Sat-Sun Closed)
(2, 0, '00:00:00', '00:00:00', TRUE),
(2, 1, '08:00:00', '16:30:00', FALSE),
(2, 2, '08:00:00', '16:30:00', FALSE),
(2, 3, '08:00:00', '16:30:00', FALSE),
(2, 4, '08:00:00', '16:30:00', FALSE),
(2, 5, '08:00:00', '16:30:00', FALSE),
(2, 6, '00:00:00', '00:00:00', TRUE),

-- OSA (Mon-Fri 08:30-17:30)
(3, 0, '00:00:00', '00:00:00', TRUE),
(3, 1, '08:30:00', '17:30:00', FALSE),
(3, 2, '08:30:00', '17:30:00', FALSE),
(3, 3, '08:30:00', '17:30:00', FALSE),
(3, 4, '08:30:00', '17:30:00', FALSE),
(3, 5, '08:30:00', '17:30:00', FALSE),
(3, 6, '09:00:00', '12:00:00', FALSE),

-- Health Clinic (Open 7 days: Mon-Fri 07:30-19:00, Sat-Sun 08:00-16:00)
(4, 0, '08:00:00', '16:00:00', FALSE),
(4, 1, '07:30:00', '19:00:00', FALSE),
(4, 2, '07:30:00', '19:00:00', FALSE),
(4, 3, '07:30:00', '19:00:00', FALSE),
(4, 4, '07:30:00', '19:00:00', FALSE),
(4, 5, '07:30:00', '19:00:00', FALSE),
(4, 6, '08:00:00', '16:00:00', FALSE),

-- Guidance (Mon-Fri 08:00-17:00)
(5, 0, '00:00:00', '00:00:00', TRUE),
(5, 1, '08:00:00', '17:00:00', FALSE),
(5, 2, '08:00:00', '17:00:00', FALSE),
(5, 3, '08:00:00', '17:00:00', FALSE),
(5, 4, '08:00:00', '17:00:00', FALSE),
(5, 5, '08:00:00', '17:00:00', FALSE),
(5, 6, '00:00:00', '00:00:00', TRUE),

-- Library (Mon-Sat 07:30-20:00)
(6, 0, '00:00:00', '00:00:00', TRUE),
(6, 1, '07:30:00', '20:00:00', FALSE),
(6, 2, '07:30:00', '20:00:00', FALSE),
(6, 3, '07:30:00', '20:00:00', FALSE),
(6, 4, '07:30:00', '20:00:00', FALSE),
(6, 5, '07:30:00', '20:00:00', FALSE),
(6, 6, '08:00:00', '17:00:00', FALSE),

-- IT Helpdesk (Mon-Fri 08:00-18:00, Sat 09:00-13:00)
(7, 0, '00:00:00', '00:00:00', TRUE),
(7, 1, '08:00:00', '18:00:00', FALSE),
(7, 2, '08:00:00', '18:00:00', FALSE),
(7, 3, '08:00:00', '18:00:00', FALSE),
(7, 4, '08:00:00', '18:00:00', FALSE),
(7, 5, '08:00:00', '18:00:00', FALSE),
(7, 6, '09:00:00', '13:00:00', FALSE),

-- Admissions (Mon-Fri 08:00-17:00)
(8, 0, '00:00:00', '00:00:00', TRUE),
(8, 1, '08:00:00', '17:00:00', FALSE),
(8, 2, '08:00:00', '17:00:00', FALSE),
(8, 3, '08:00:00', '17:00:00', FALSE),
(8, 4, '08:00:00', '17:00:00', FALSE),
(8, 5, '08:00:00', '17:00:00', FALSE),
(8, 6, '00:00:00', '00:00:00', TRUE);

-- ----------------------------------------------------------------------------
-- 7. USER ACCOUNTS & PROFILES (Separated for 3NF Compliance)
-- ----------------------------------------------------------------------------
INSERT INTO `user_accounts` (`user_id`, `email`, `password_hash`, `user_role`, `is_active`) VALUES
(1, 'admin@unidesk.edu', '$2b$10$Uas3kmnFjUx5Jh.h4ACQQOy5VprUfSwNMdiu/h2L4v.rmJCdkvxxO', 'ADMIN', TRUE),
(2, 'staff.registrar@unidesk.edu', '$2b$10$Uas3kmnFjUx5Jh.h4ACQQOy5VprUfSwNMdiu/h2L4v.rmJCdkvxxO', 'STAFF', TRUE),
(3, 'alex.santos@student.unidesk.edu', '$2b$10$Uas3kmnFjUx5Jh.h4ACQQOy5VprUfSwNMdiu/h2L4v.rmJCdkvxxO', 'STUDENT', TRUE),
(4, 'maria.reyes@student.unidesk.edu', '$2b$10$Uas3kmnFjUx5Jh.h4ACQQOy5VprUfSwNMdiu/h2L4v.rmJCdkvxxO', 'STUDENT', TRUE),
(5, 'john.visitor@gmail.com', '$2b$10$Uas3kmnFjUx5Jh.h4ACQQOy5VprUfSwNMdiu/h2L4v.rmJCdkvxxO', 'VISITOR', TRUE);

INSERT INTO `user_profiles` (`profile_id`, `user_id`, `student_or_visitor_id`, `full_name`, `phone_number`, `department_or_affiliation`, `office_id`) VALUES
(1, 1, 'ADM-0001', 'System Administrator', '+63 917 000 0001', 'University Information Technology', NULL),
(2, 2, 'STF-1029', 'Evelyn Mendoza', '+63 917 111 2233', 'Office of the Registrar', 1),
(3, 3, 'STD-2024-0891', 'Alex Santos', '+63 918 555 4321', 'College of Engineering', NULL),
(4, 4, 'STD-2023-1422', 'Maria Clara Reyes', '+63 922 444 8899', 'College of Business & Accountancy', NULL),
(5, 5, 'VIS-9021', 'John Doe (Campus Visitor)', '+63 915 777 9900', 'Guest / Prospective Transferee', NULL);

-- ----------------------------------------------------------------------------
-- 8. ISSUE CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO `issue_categories` (`issue_category_id`, `category_name`, `description`) VALUES
(1, 'Academic Records & Documentation', 'Transcripts, enrollment certifications, subject crediting, and diploma requests'),
(2, 'Identification & Campus Access', 'Lost or damaged student ID cards, RFID replacement, visitor badges, and vehicle stickers'),
(3, 'Payments, Tuition & Billing', 'Tuition assessment, cashier payments, exam clearance, and laboratory fee receipts'),
(4, 'Health, Clearance & Wellness', 'Medical certificates, entrance physical exam, first aid, and dental consult'),
(5, 'Campus IT, Network & Portal', 'Student portal password resets, Wi-Fi credentials, LMS account synchronization'),
(6, 'Library Borrowing & Fines', 'Book reservations, overdue fines settlement, thesis archives access, study rooms'),
(7, 'Admissions & Entrance Applications', 'Freshman entrance examinations, transferee admissions, high school card evaluation');

-- ----------------------------------------------------------------------------
-- 9. ISSUES (CAMPUS ADMINISTRATIVE PROBLEMS)
-- ----------------------------------------------------------------------------
INSERT INTO `issues` (`issue_id`, `issue_category_id`, `issue_code`, `issue_name`, `description`, `standard_fee`, `requires_in_person`) VALUES
(1, 2, 'ISS-ID-LOST', 'Lost Student ID Card Replacement', 'Request a replacement RFID student identification card due to loss or physical damage. Requires Affidavit of Loss.', 150.00, TRUE),
(2, 1, 'ISS-TOR-REQ', 'Official Transcript of Records (TOR) Request', 'Processing and issuance of official academic transcript for employment, board examination, or transfer.', 250.00, FALSE),
(3, 3, 'ISS-FEE-PAY', 'Tuition Fee Assessment & Cashier Settlement', 'In-person payment of semester tuition, outstanding balances, lab fees, or graduation dues.', 0.00, TRUE),
(4, 4, 'ISS-MED-CLR', 'Medical Clearance & Physical Exam Certification', 'Mandatory health clearance for internships, clinical rotations, athletic meets, or returning students.', 100.00, TRUE),
(5, 2, 'ISS-GMC-REQ', 'Certificate of Good Moral Character', 'Issuance of clearance certifying student disciplinary standing and exemplary conduct.', 75.00, FALSE),
(6, 5, 'ISS-WIFI-PWD', 'Student Portal Password Reset & Wi-Fi Authentication', 'Assistance for locked portal accounts, forgot password, campus Wi-Fi MAC address registration.', 0.00, FALSE),
(7, 6, 'ISS-LIB-CLR', 'Library Overdue Clearance & Study Cubicle Booking', 'Settlement of accrued overdue book penalties and advance reservation of air-conditioned research rooms.', 50.00, TRUE),
(8, 7, 'ISS-ADM-EXM', 'Freshman Admission Application & Entrance Exam', 'Filing of university admission paperwork and scheduling of College Entrance Test (CET).', 300.00, TRUE),
(9, 1, 'ISS-DIP-DUP', 'Duplicate Diploma / Certificate of Graduation', 'Re-issuance of official university diploma following loss or destruction of original certificate.', 500.00, TRUE),
(10, 4, 'ISS-DNT-CHK', 'Dental Checkup & Oral Prophylaxis', 'Routine dental screening, tooth extraction clearance, or free oral hygiene consultation.', 0.00, TRUE);

-- ----------------------------------------------------------------------------
-- 10. ISSUE OFFICE MAPPINGS (JUNCTION TABLE - M:N)
-- ----------------------------------------------------------------------------
INSERT INTO `issue_office_mappings` (`mapping_id`, `issue_id`, `office_id`, `priority_level`, `resolution_guide`, `avg_resolution_minutes`) VALUES
-- Lost ID -> OSA (Primary), Cashier (Secondary for payment)
(1, 1, 3, 'PRIMARY', 'Submit Affidavit of Loss at OSA counter. Receive assessment slip, then settle payment at Cashier window.', 25),
(2, 1, 2, 'SECONDARY', 'Pay ID replacement fee of PHP 150. Present receipt back to OSA for camera capture and RFID printing.', 15),

-- Transcript of Records -> Registrar (Primary), Cashier (Secondary)
(3, 2, 1, 'PRIMARY', 'Fill out Online Request Form or Window 2 slip. Check clearance status. Processing takes 3-5 business days.', 20),
(4, 2, 2, 'SECONDARY', 'Settle TOR processing fee of PHP 250 at Cashier Window 3.', 10),

-- Tuition Fee Payment -> Cashier (Primary), Registrar (Secondary)
(5, 3, 2, 'PRIMARY', 'Present student number and Assessment Form at Treasury Window. Cash, credit/debit card, or campus wallet accepted.', 15),
(6, 3, 1, 'SECONDARY', 'Consult Registrar if subjects enrolled require add/drop adjustment before final cashier payment.', 30),

-- Medical Clearance -> Health Clinic (Primary)
(7, 4, 4, 'PRIMARY', 'Bring Chest X-ray and CBC laboratory results. Triage nurse will record vitals followed by physician exam.', 35),

-- Good Moral Character -> OSA (Primary)
(8, 5, 3, 'PRIMARY', 'Submit verification form. Records officer verifies zero pending disciplinary cases. Claim document in 24 hours.', 15),

-- Wi-Fi & Password Reset -> IT Helpdesk (Primary)
(9, 6, 7, 'PRIMARY', 'Present student ID or valid government ID. Support engineer will reset password and register MAC address.', 10),

-- Library Clearance & Cubicle -> Library Desk (Primary)
(10, 7, 6, 'PRIMARY', 'Present book barcode to circulation librarian. Settle 5 PHP/day fine or select available cubicle slot.', 15),

-- Freshman Admission -> Admissions Center (Primary), Cashier (Secondary)
(11, 8, 8, 'PRIMARY', 'Submit Form 137 / 138 high school card, PSA birth certificate, and 2x2 photos at Admissions Room 202.', 40),
(12, 8, 2, 'SECONDARY', 'Pay PHP 300 Entrance Exam Application fee before test permit release.', 15),

-- Duplicate Diploma -> Registrar (Primary), Cashier (Secondary)
(13, 9, 1, 'PRIMARY', 'Submit notarized affidavit of loss and identification. Processing takes 10 working days.', 30),
(14, 9, 2, 'SECONDARY', 'Settle PHP 500 duplicate diploma fee at Cashier.', 10),

-- Dental Consult -> Health Clinic (Primary)
(15, 10, 4, 'PRIMARY', 'Walk-in or pre-book appointment at Clinic Room 102. Free for enrolled university students.', 30);

-- ----------------------------------------------------------------------------
-- 11. OFFICE STAFF ASSIGNMENTS (JUNCTION TABLE SEED)
-- ----------------------------------------------------------------------------
INSERT INTO `office_staff_assignments` (`assignment_id`, `user_id`, `office_id`, `assigned_role`, `assignment_status`, `shift_schedule`, `can_process_payments`, `daily_case_quota`) VALUES
(1, 2, 1, 'OFFICE_HEAD', 'ACTIVE', 'FULL_TIME', TRUE, 30),
(2, 2, 8, 'CASE_HANDLER', 'ACTIVE', 'MORNING_SHIFT', FALSE, 15);

-- ----------------------------------------------------------------------------
-- 12. ISSUE SEARCH KEYWORDS (SEARCH ENGINE ACCELERATOR)
-- ----------------------------------------------------------------------------
INSERT INTO `issue_search_keywords` (`issue_id`, `keyword`) VALUES
(1, 'lost id'), (1, 'id card'), (1, 'student card'), (1, 'lost card'), (1, 'rfid badge'), (1, 'replace id'), (1, 'lost student id'),
(2, 'transcript'), (2, 'tor'), (2, 'grades'), (2, 'official records'), (2, 'academic transcript'), (2, 'transcript request'),
(3, 'tuition'), (3, 'pay fee'), (3, 'cashier'), (3, 'balance'), (3, 'semester payment'), (3, 'enrollment payment'),
(4, 'medical'), (4, 'clinic'), (4, 'health clearance'), (4, 'physical exam'), (4, 'doctor note'), (4, 'sick leave'),
(5, 'good moral'), (5, 'character certificate'), (5, 'disciplinary clearance'), (5, 'conduct certificate'),
(6, 'wifi'), (6, 'password reset'), (6, 'student portal'), (6, 'login problem'), (6, 'canvas password'), (6, 'internet access'),
(7, 'library fine'), (7, 'overdue book'), (7, 'study room'), (7, 'cubicle reservation'), (7, 'borrow book'),
(8, 'admission'), (8, 'entrance exam'), (8, 'freshman application'), (8, 'cet'), (8, 'apply college'),
(9, 'diploma'), (9, 'graduation certificate'), (9, 'lost diploma'), (9, 'duplicate diploma'),
(10, 'dental'), (10, 'teeth'), (10, 'dentist'), (10, 'toothache'), (10, 'oral checkup');

-- ----------------------------------------------------------------------------
-- 12. INITIAL SAMPLE RESERVATIONS & TRANSACTIONS
-- Note: Trigger trg_reservations_audit_insert, trg_transactions_audit_insert
-- will automatically populate audit_logs!
-- ----------------------------------------------------------------------------
INSERT INTO `office_reservations` (`reservation_id`, `user_id`, `office_id`, `issue_id`, `reservation_date`, `slot_time`, `status`, `notes`) VALUES
(1, 3, 3, 1, '2026-10-15', '09:00:00', 'PENDING', 'Lost my ID at the cafeteria yesterday. Affidavit of Loss attached.'),
(2, 4, 1, 2, '2026-10-16', '10:30:00', 'CONFIRMED', 'Official Transcript needed for graduate school application.'),
(3, 5, 8, 8, '2026-10-19', '14:00:00', 'PENDING', 'Prospective engineering applicant from St. Jude High School.');

INSERT INTO `transactions` (`transaction_id`, `reservation_id`, `user_id`, `office_id`, `issue_id`, `amount`, `payment_method`, `payment_status`, `reference_no`, `paid_at`) VALUES
(1, 1, 3, 3, 1, 150.00, 'CAMPUS_WALLET', 'PENDING', 'TXN-INIT-001', NULL),
(2, 2, 4, 1, 2, 250.00, 'ONLINE_TRANSFER', 'PAID', 'TXN-INIT-002', NOW()),
(3, 3, 5, 8, 8, 300.00, 'CASH', 'PENDING', 'TXN-INIT-003', NULL);

-- Simulate settled transaction trigger confirmation test
UPDATE `transactions` SET `payment_status` = 'PAID' WHERE `transaction_id` = 2;
