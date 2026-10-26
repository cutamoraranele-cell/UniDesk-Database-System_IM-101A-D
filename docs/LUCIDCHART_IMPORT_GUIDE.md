# How to Import UniDesk Schema into Lucidchart

You can import the **UniDesk Database Schema** into [Lucidchart](https://www.lucidchart.com) using either of the two standard methods below.

---

## ⚡ Option 1: Native Lucidchart ERD File Import (Recommended - Full Interactive ERD)

Lucidchart can automatically build your ER diagram with draggable tables, field types, primary keys, and crow's foot relationships using our pre-generated schema metadata file:

### Ready-to-Use Import Files
- **TSV Format**: [`docs/lucidchart_erd_import.tsv`](file:///c:/Users/harne/.gemini/antigravity-ide/scratch/unidesk-database-system/docs/lucidchart_erd_import.tsv)
- **CSV Format**: [`docs/lucidchart_erd_import.csv`](file:///c:/Users/harne/.gemini/antigravity-ide/scratch/unidesk-database-system/docs/lucidchart_erd_import.csv)

### Step-by-Step Instructions:
1. Open a new or blank document in [Lucidchart](https://lucid.app).
2. On the left sidebar, click **"+ More shapes"** (or press `M`) and ensure the **"Entity Relationship"** shape library is enabled.
3. At the bottom of the Entity Relationship shape list on the left, click **"Import"** (or click **"Create from data"** in the top search bar and choose **Entity Relationship (ERD)**).
4. Select **MySQL** from the Database Management System (DBMS) dropdown.
5. Click **Next**.
6. On the next screen, click **"Choose File"** and upload [`docs/lucidchart_erd_import.csv`](file:///c:/Users/harne/.gemini/antigravity-ide/scratch/unidesk-database-system/docs/lucidchart_erd_import.csv) (or [`docs/lucidchart_erd_import.tsv`](file:///c:/Users/harne/.gemini/antigravity-ide/scratch/unidesk-database-system/docs/lucidchart_erd_import.tsv)), OR select the text box and paste the text contents directly.
7. Click **Import**.
8. All 15 database tables will appear in your left-hand ERD shapes drawer.
9. Drag the tables onto your canvas (or click **"Select All" / "Add All"**). Lucidchart will automatically generate and connect all relationship lines and foreign keys!

---

## ⚡ Option 2: Direct Mermaid Import (Fastest - 10 Seconds)

Lucidchart includes native Mermaid code rendering.

### Step-by-Step Instructions:
1. Open a blank document in Lucidchart.
2. In the top navigation menu, click **File** > **Import Data** > **Mermaid** (or in the left tool tray, click the **+ Insert** button > **Mermaid**).
3. Paste the Mermaid ERD code block below into the code editor.
4. Click **Insert Diagram**. Lucidchart will automatically draw and organize the diagram on your canvas.

```mermaid
erDiagram
    CAMPUSES ||--o{ BUILDINGS : contains
    BUILDINGS ||--o{ FACILITIES : contains
    FACILITY_CATEGORIES ||--o{ FACILITIES : classifies
    FACILITIES ||--o{ OFFICES : houses
    OFFICES ||--o{ OFFICE_OPERATING_HOURS : scheduled_by
    OFFICES ||--o{ ISSUE_OFFICE_MAPPINGS : handles
    OFFICES ||--o{ OFFICE_STAFF_ASSIGNMENTS : staffs
    OFFICES ||--o{ OFFICE_RESERVATIONS : hosts
    OFFICES ||--o{ TRANSACTIONS : collects

    USER_ACCOUNTS ||--|| USER_PROFILES : describes
    USER_ACCOUNTS ||--o{ OFFICE_STAFF_ASSIGNMENTS : assigned_to
    USER_ACCOUNTS ||--o{ OFFICE_RESERVATIONS : books
    USER_ACCOUNTS ||--o{ TRANSACTIONS : pays

    ISSUE_CATEGORIES ||--o{ ISSUES : categorizes
    ISSUES ||--o{ ISSUE_OFFICE_MAPPINGS : resolved_at
    ISSUES ||--o{ OFFICE_RESERVATIONS : requested_in
    ISSUES ||--o{ TRANSACTIONS : billed_for

    OFFICE_RESERVATIONS ||--o| TRANSACTIONS : settles

    CAMPUSES {
        int campus_id PK
        varchar campus_code UK
        varchar name
        varchar address
        decimal latitude
        decimal longitude
    }

    BUILDINGS {
        int building_id PK
        int campus_id FK
        varchar building_code UK
        varchar name
        tinyint total_floors
    }

    FACILITIES {
        int facility_id PK
        int building_id FK
        int category_id FK
        varchar room_number
        tinyint floor_number
        boolean is_public
    }

    OFFICES {
        int office_id PK
        int facility_id FK
        varchar office_code UK
        varchar name
        text desk_directions
        boolean is_accepting_payments
        boolean is_accepting_reservations
    }

    OFFICE_OPERATING_HOURS {
        int hours_id PK
        int office_id FK
        tinyint day_of_week
        time open_time
        time close_time
        boolean is_closed
    }

    USER_ACCOUNTS {
        int user_id PK
        varchar email UK
        varchar password_hash
        enum user_role
        boolean is_active
    }

    USER_PROFILES {
        int profile_id PK
        int user_id FK, UK
        varchar student_or_visitor_id UK
        varchar full_name
        varchar phone_number
        varchar department_or_affiliation
    }

    ISSUES {
        int issue_id PK
        int issue_category_id FK
        varchar issue_code UK
        varchar issue_name
        decimal standard_fee
        boolean requires_in_person
    }

    ISSUE_OFFICE_MAPPINGS {
        int mapping_id PK
        int issue_id FK
        int office_id FK
        enum priority_level
        text resolution_guide
        int avg_resolution_minutes
        boolean is_active
        datetime mapped_at
    }

    OFFICE_STAFF_ASSIGNMENTS {
        int assignment_id PK
        int user_id FK
        int office_id FK
        enum assigned_role
        enum assignment_status
        enum shift_schedule
        boolean can_process_payments
        int daily_case_quota
        datetime assigned_at
    }

    OFFICE_RESERVATIONS {
        int reservation_id PK
        int user_id FK
        int office_id FK
        int issue_id FK
        date reservation_date
        time slot_time
        enum status
    }

    TRANSACTIONS {
        int transaction_id PK
        int reservation_id FK
        int user_id FK
        int office_id FK
        int issue_id FK
        decimal amount
        enum payment_status
        varchar reference_no UK
    }

    AUDIT_LOGS {
        bigint log_id PK
        varchar table_name
        enum action_type
        varchar record_id
        json old_values
        json new_values
    }
```
