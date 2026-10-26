# Production Cloud Hosting Guide (Zero Localhost Compliance)

## Mandatory Compliance Notice
> **"Zero Localhost Submissions:** Local database instances running on localhost or 127.0.0.1 will be systematically rejected during the final evaluation phase.
> **Deployment Target:** Relational clusters must be hosted live on cloud environments utilizing modern free-tier relational database providers (e.g., Neon, Aiven, or Supabase for PostgreSQL/MySQL)."

The **UniDesk Database System** is engineered with a cloud-agnostic architecture. While local XAMPP MariaDB/MySQL is provided for rapid local development, the entire schema, triggers, stored procedures, and RBAC matrix are 100% cloud-ready for immediate live deployment to free-tier cloud relational providers.

---

## Recommended Free-Tier Cloud Provider: Aiven for MySQL

[Aiven](https://aiven.io/) provides a permanent free-tier MySQL relational service (MySQL 8.0) that supports native InnoDB, Foreign Keys, Triggers, Stored Procedures, and SSL encryption.

### Step 1: Create Free Cloud MySQL Service
1. Navigate to [https://aiven.io/](https://aiven.io/) and sign up for a free account.
2. Click **Create Service** and select **MySQL**.
3. Choose the **Free Plan** (available in supported AWS / Google Cloud regions).
4. Name your service `unidesk-cloud-cluster` and click **Create Service**.
5. Once active (status `RUNNING`), navigate to **Overview** and copy the **Service URI**.
   - Example URI format:
     ```
     mysql://avnadmin:AVNS_AbCdEf123456@mysql-unidesk-myproject.aivencloud.com:21345/defaultdb?ssl-mode=REQUIRED
     ```

---

### Step 2: Configure Environment Variables

Open `backend/.env` and update the `DATABASE_URL` variable with your cloud connection string:

```ini
# Production Cloud Database URI
DATABASE_URL=mysql://avnadmin:YOUR_PASSWORD@mysql-unidesk-myproject.aivencloud.com:21345/defaultdb?ssl={"rejectUnauthorized":false}
```

---

### Step 3: Run Automated Cloud Migration

Execute the automated cloud migration script from the `backend/` folder:

```bash
cd backend
npm run migrate
```

This single command will sequentially apply:
1. `01_schema_3nf.sql` (Creates all 16 3NF relational tables and referential integrity constraints)
2. `02_triggers.sql` (Compiles all 13 database engine triggers including audit logging & validation)
3. `03_procedures_functions.sql` (Compiles stored procedures `sp_resolve_office_by_query`, `sp_book_office_reservation`, etc.)
4. `04_rbac.sql` (Provisions `unidesk_app_role` and `unidesk_app_user`)
5. `05_seed_data.sql` (Populates campus directory, issues, operating hours, and sample data)

---

### Step 4: Verify Live Cloud Cluster

Run the automated engine verification suite against the cloud instance:

```bash
cd backend
npm run test:engine
```

The test runner will execute all 14 compliance tests against your cloud database and print:
```
================================================================
 TEST RESULTS: 14/14 TESTS PASSED (100% COMPLIANCE)
================================================================
```

---

### Step 5: Test via the Web Console
You can also verify and test any cloud database URI in real time directly from the **UniDesk Admin Console** -> **Cloud Database Manager** tab!
Simply paste your cloud URI, click **"Test Cloud Cluster"**, and the console will display the live cloud hostname, database version, and network latency in milliseconds.
