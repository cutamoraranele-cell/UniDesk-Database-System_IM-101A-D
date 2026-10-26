# How to Generate the UniDesk Schema in draw.io (diagrams.net)

You can generate the complete **UniDesk Database Schema** in **[draw.io](https://app.diagrams.net/)** (or the draw.io desktop app / VS Code extension) using either of two methods:

---

## ⚡ Method 1: Instant Mermaid Import (Recommended - Auto-Generates All Crow's Foot Connector Lines)

Using draw.io's built-in Mermaid parser, draw.io will **automatically position the tables and draw all Crow's Foot relationship lines** between entities!

### Step-by-Step Instructions:
1. Open [draw.io (app.diagrams.net)](https://app.diagrams.net/).
2. In the top toolbar, click **`+` (Insert)** > **Advanced** > **Mermaid...**  
   *(Or from the top menu bar: **Arrange** > **Insert** > **Advanced** > **Mermaid...**)*.
3. Replace any existing text in the dialog box by pasting the code below (or from [`docs/drawio_schema.mermaid`](file:///c:/Users/harne/.gemini/antigravity-ide/scratch/unidesk-database-system/docs/drawio_schema.mermaid)):

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

    FACILITY_CATEGORIES {
        int category_id PK
        varchar category_code UK
        varchar name
        varchar description
        varchar icon_name
    }

    FACILITIES {
        int facility_id PK
        int building_id FK
        int category_id FK
        varchar room_number
        tinyint floor_number
        varchar name
        text description
        boolean is_public
    }

    OFFICES {
        int office_id PK
        int facility_id FK
        varchar office_code UK
        varchar name
        varchar email
        varchar phone
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

    ISSUE_CATEGORIES {
        int issue_category_id PK
        varchar category_name UK
        varchar description
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
        text notes
    }

    TRANSACTIONS {
        int transaction_id PK
        int reservation_id FK
        int user_id FK
        int office_id FK
        int issue_id FK
        decimal amount
        enum payment_method
        enum payment_status
        varchar reference_no UK
        datetime paid_at
    }

    AUDIT_LOGS {
        bigint log_id PK
        varchar table_name
        enum action_type
        varchar record_id
        json old_values
        json new_values
        varchar performed_by
        datetime performed_at
    }
```

4. Click **Insert**.
5. Draw.io will instantly generate the entities and all Crow’s foot connector lines on your canvas.

---

## ⚡ Method 2: Direct SQL Import in draw.io (Native Entity Table Shapes)

If you prefer draw.io's native SQL database entity shapes:

### Step-by-Step Instructions:
1. Open [draw.io (app.diagrams.net)](https://app.diagrams.net/).
2. In the top toolbar, click **`+` (Insert)** > **Advanced** > **SQL...**  
   *(Or: **Arrange** > **Insert** > **Advanced** > **SQL...**)*.
3. Copy all lines from [`docs/drawio_schema.sql`](file:///c:/Users/harne/.gemini/antigravity-ide/scratch/unidesk-database-system/docs/drawio_schema.sql) and paste them into the dialog box.
4. Click **Insert**.
5. Draw.io will instantly build all 15 table shapes with columns, primary key icons, and data types!
