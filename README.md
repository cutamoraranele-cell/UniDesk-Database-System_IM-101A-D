# UniDesk Database System (Campus Lookup & Operations Management Engine)

A high-performance, enterprise-grade relational database engine and full-stack campus management platform engineered to resolve university administrative routing, appointment booking, and fee settlement.

Designed strictly in conformance with **Third Normal Form (3NF)**, server-side data automation (operational database triggers & stored procedures), hardened server-level **Role-Based Access Control (RBAC)**, SQL injection prevention via Prepared Statements, and **Production Cloud Hosting** readiness.

---

## 🏛️ System Architecture & Grading Compliance

| Matrix | Requirement | Technical Implementation in UniDesk |
|---|---|---|
| **1. 3NF Schema & Data Integrity** | Rigid Third Normal Form (3NF); Junction tables for M:N; Explicit referential actions (`CASCADE`, `SET NULL`, `RESTRICT`). | 16 discrete tables with 0 transitive/partial dependencies. Separates user credentials from user profile data. Explicit junction tables (`issue_office_mappings`, `issue_search_keywords`). |
| **2. Server-Side Data Automation** | Engine-level triggers for audit logs and status transitions; Parameterized Stored Procedures and Stored Functions. | 13 automated triggers (`trg_offices_audit_*`, `trg_reservations_audit_*`, `trg_transactions_audit_*`, `trg_validate_reservation_schedule`, `trg_on_transaction_payment_settled`). 4 Stored Procedures + 1 Stored Function. Application-level computation for core audit logging is strictly eliminated. |
| **3. Production Cloud Hosting** | Zero localhost submissions; deployment to modern free-tier cloud relational providers. | MySQL 8.0 / MariaDB cluster schema deployable to [Aiven Cloud MySQL](https://aiven.io), Clever Cloud, or TiDB Cloud via automated migration runner (`npm run migrate`). |
| **4. Security & RBAC** | Prepared statements to neutralize SQL injection; Custom server-level roles with limited privileges (No root). | All SQL calls utilize parameterized Prepared Statements (`?`). Application connects strictly via hardened non-root user `unidesk_app_user` with role `unidesk_app_role` (DDL operations like `DROP TABLE` are denied by the engine). |
| **5. Mandatory Framework Utilization** | Established backend framework; zero unorganized native scripts. | Node.js + Express.js modular Clean Architecture (Database Pool, Controllers, Routes, Migrations, Verification Suite). |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MySQL / MariaDB (via XAMPP or Cloud Provider e.g. Aiven)

### 1. Database Initialization
```bash
# From project root, navigate to backend
cd backend

# Run the automated migration runner (executes schema, triggers, procedures, rbac, and seed data)
npm run migrate
```

### 2. Run Engine Verification Suite (14/14 Tests)
Run the automated test suite to verify 100% compliance across triggers, procedures, RBAC, and schemas:
```bash
npm run test:engine
```
Output:
```
================================================================
 TEST RESULTS: 14/14 TESTS PASSED (100% COMPLIANCE)
================================================================
```

### 3. Start Backend API Server
```bash
npm start
# Server starts on http://localhost:5000
# Diagnostic health check: http://localhost:5000/api/health
```

### 4. Start Frontend Web Console
```bash
cd ../frontend
npm run dev
# Open http://localhost:5173
```

---

## ☁️ Production Cloud Deployment (Zero Localhost Rule)

To fulfill the **Zero Localhost Submissions** requirement:
1. Create a free-tier MySQL instance on [Aiven](https://aiven.io) or [Clever Cloud](https://www.clever-cloud.com).
2. Copy your cloud URI and update `backend/.env`:
   ```ini
   DATABASE_URL=mysql://avnadmin:YOUR_PASSWORD@mysql-unidesk.aivencloud.com:21345/defaultdb?ssl={"rejectUnauthorized":false}
   ```
3. Run migrations against your cloud cluster:
   ```bash
   npm run migrate
   ```
4. Verify with `npm run test:engine`. Detailed walkthrough is documented in [`docs/CLOUD_DEPLOYMENT.md`](file:///C:/Users/harne/.gemini/antigravity-ide/scratch/unidesk-database-system/docs/CLOUD_DEPLOYMENT.md).

---

## 📁 Repository Structure

```
unidesk-database-system/
├── backend/
│   ├── src/
│   │   ├── config/db.js             # MySQL connection pool & prepared statement executor
│   │   ├── controllers/             # Express controllers (lookup, facilities, reservations, ai, admin)
│   │   ├── routes/                  # RESTful API route definitions
│   │   ├── scripts/
│   │   │   ├── migrate.js           # Automated cloud/local database migration runner
│   │   │   └── test_engine.js       # 14-test compliance test suite
│   │   └── server.js                # Express application entrypoint
│   ├── .env                         # Environment credentials (unidesk_app_user, DATABASE_URL)
│   └── package.json
├── database/
│   ├── 01_schema_3nf.sql            # 16 normalized tables, FKs, check constraints
│   ├── 02_triggers.sql              # 13 automated database engine triggers
│   ├── 03_procedures_functions.sql  # 4 Stored procedures + 1 Stored function
│   ├── 04_rbac.sql                  # unidesk_app_role & unidesk_app_user provisioning
│   └── 05_seed_data.sql             # Real campus buildings, offices, issues, and schedules
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # Cluster diagnostics & navigation tabs
│   │   │   ├── LookupView.jsx       # Problem & issue resolver (sp_resolve_office_by_query)
│   │   │   ├── CampusMapView.jsx    # Interactive campus SVG layout & directory
│   │   │   ├── ReservationsView.jsx # Appointments & fee settlement terminal
│   │   │   ├── AIChatView.jsx       # Conversational AI assistant with direct DB booking
│   │   │   └── AdminView.jsx        # Live trigger audit inspector & procedure benchmark
│   │   ├── App.jsx
│   │   └── index.css                # Glassmorphic design system
│   ├── package.json
│   └── vite.config.js
└── docs/
    ├── DATABASE_ARCHITECTURE.md     # 3NF normalization proofs, trigger catalog, RBAC matrix
    └── CLOUD_DEPLOYMENT.md          # Step-by-step Aiven Cloud MySQL deployment guide
```

---

## ⚡ Stored Procedures & Functions Catalog

- `sp_resolve_office_by_query(IN p_search_term VARCHAR(150))`
  Parameterized problem resolver joining issues, offices, facilities, buildings, and campuses with relevance ranking and real-time open status calculation.
- `sp_book_office_reservation(IN p_user_id, IN p_office_id, ...)`
  Transaction-safe appointment booking routine with conflict checking and automated fee transaction generation.
- `sp_process_office_payment(IN p_transaction_id, IN p_payment_method, ...)`
  Atomic financial settlement routine with row-level locking (`FOR UPDATE`); activates trigger `trg_on_transaction_payment_settled` to auto-confirm reservation status.
- `sp_get_office_analytics(IN p_office_id INT)`
  Server-side calculation routine computing booking volumes, revenue collections, and peak traffic distribution.
- `fn_is_office_open_now(p_office_id INT) RETURNS TINYINT(1)`
  Deterministic function evaluating current day and clock against office operating hours.
