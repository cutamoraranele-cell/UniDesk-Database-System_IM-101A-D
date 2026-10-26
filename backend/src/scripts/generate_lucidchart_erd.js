// Script to generate Lucidchart ERD TSV / CSV import data for UniDesk Schema
import fs from 'fs';
import path from 'path';

const columns = [
  'dbms',
  'table_schema',
  'table_name',
  'column_name',
  'ordinal_position',
  'data_type',
  'character_maximum_length',
  'constraint_type',
  'referenced_table_schema',
  'referenced_table_name',
  'referenced_column_name'
];

const schemaName = 'unidesk_db';

const tables = [
  {
    table: 'campuses',
    columns: [
      { name: 'campus_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'campus_code', type: 'varchar', len: 20, key: 'UNIQUE' },
      { name: 'name', type: 'varchar', len: 150 },
      { name: 'address', type: 'varchar', len: 255 },
      { name: 'latitude', type: 'decimal' },
      { name: 'longitude', type: 'decimal' },
      { name: 'created_at', type: 'datetime' }
    ]
  },
  {
    table: 'buildings',
    columns: [
      { name: 'building_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'campus_id', type: 'int', key: 'FOREIGN KEY', refTable: 'campuses', refCol: 'campus_id' },
      { name: 'building_code', type: 'varchar', len: 20, key: 'UNIQUE' },
      { name: 'name', type: 'varchar', len: 150 },
      { name: 'total_floors', type: 'tinyint' },
      { name: 'latitude', type: 'decimal' },
      { name: 'longitude', type: 'decimal' },
      { name: 'created_at', type: 'datetime' }
    ]
  },
  {
    table: 'facility_categories',
    columns: [
      { name: 'category_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'category_code', type: 'varchar', len: 30, key: 'UNIQUE' },
      { name: 'name', type: 'varchar', len: 100 },
      { name: 'description', type: 'varchar', len: 255 },
      { name: 'icon_name', type: 'varchar', len: 50 }
    ]
  },
  {
    table: 'facilities',
    columns: [
      { name: 'facility_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'building_id', type: 'int', key: 'FOREIGN KEY', refTable: 'buildings', refCol: 'building_id' },
      { name: 'category_id', type: 'int', key: 'FOREIGN KEY', refTable: 'facility_categories', refCol: 'category_id' },
      { name: 'room_number', type: 'varchar', len: 30 },
      { name: 'floor_number', type: 'tinyint' },
      { name: 'name', type: 'varchar', len: 150 },
      { name: 'description', type: 'text' },
      { name: 'is_public', type: 'boolean' },
      { name: 'created_at', type: 'datetime' }
    ]
  },
  {
    table: 'offices',
    columns: [
      { name: 'office_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'facility_id', type: 'int', key: 'FOREIGN KEY', refTable: 'facilities', refCol: 'facility_id' },
      { name: 'office_code', type: 'varchar', len: 30, key: 'UNIQUE' },
      { name: 'name', type: 'varchar', len: 150 },
      { name: 'email', type: 'varchar', len: 120 },
      { name: 'phone', type: 'varchar', len: 40 },
      { name: 'desk_directions', type: 'text' },
      { name: 'is_accepting_payments', type: 'boolean' },
      { name: 'is_accepting_reservations', type: 'boolean' },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' }
    ]
  },
  {
    table: 'office_operating_hours',
    columns: [
      { name: 'hours_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'office_id', type: 'int', key: 'FOREIGN KEY', refTable: 'offices', refCol: 'office_id' },
      { name: 'day_of_week', type: 'tinyint' },
      { name: 'open_time', type: 'time' },
      { name: 'close_time', type: 'time' },
      { name: 'is_closed', type: 'boolean' }
    ]
  },
  {
    table: 'user_accounts',
    columns: [
      { name: 'user_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'email', type: 'varchar', len: 120, key: 'UNIQUE' },
      { name: 'password_hash', type: 'varchar', len: 255 },
      { name: 'user_role', type: 'enum' },
      { name: 'is_active', type: 'boolean' },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' }
    ]
  },
  {
    table: 'user_profiles',
    columns: [
      { name: 'profile_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'user_id', type: 'int', key: 'FOREIGN KEY', refTable: 'user_accounts', refCol: 'user_id' },
      { name: 'student_or_visitor_id', type: 'varchar', len: 50, key: 'UNIQUE' },
      { name: 'full_name', type: 'varchar', len: 120 },
      { name: 'phone_number', type: 'varchar', len: 30 },
      { name: 'department_or_affiliation', type: 'varchar', len: 120 },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' }
    ]
  },
  {
    table: 'issue_categories',
    columns: [
      { name: 'issue_category_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'category_name', type: 'varchar', len: 80, key: 'UNIQUE' },
      { name: 'description', type: 'varchar', len: 255 }
    ]
  },
  {
    table: 'issues',
    columns: [
      { name: 'issue_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'issue_category_id', type: 'int', key: 'FOREIGN KEY', refTable: 'issue_categories', refCol: 'issue_category_id' },
      { name: 'issue_code', type: 'varchar', len: 30, key: 'UNIQUE' },
      { name: 'issue_name', type: 'varchar', len: 150 },
      { name: 'description', type: 'text' },
      { name: 'standard_fee', type: 'decimal' },
      { name: 'requires_in_person', type: 'boolean' },
      { name: 'created_at', type: 'datetime' }
    ]
  },
  {
    table: 'issue_office_mappings',
    columns: [
      { name: 'mapping_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'issue_id', type: 'int', key: 'FOREIGN KEY', refTable: 'issues', refCol: 'issue_id' },
      { name: 'office_id', type: 'int', key: 'FOREIGN KEY', refTable: 'offices', refCol: 'office_id' },
      { name: 'priority_level', type: 'enum' },
      { name: 'resolution_guide', type: 'text' },
      { name: 'avg_resolution_minutes', type: 'int' },
      { name: 'is_active', type: 'boolean' },
      { name: 'mapped_at', type: 'datetime' }
    ]
  },
  {
    table: 'office_staff_assignments',
    columns: [
      { name: 'assignment_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'user_id', type: 'int', key: 'FOREIGN KEY', refTable: 'user_accounts', refCol: 'user_id' },
      { name: 'office_id', type: 'int', key: 'FOREIGN KEY', refTable: 'offices', refCol: 'office_id' },
      { name: 'assigned_role', type: 'enum' },
      { name: 'assignment_status', type: 'enum' },
      { name: 'shift_schedule', type: 'enum' },
      { name: 'can_process_payments', type: 'boolean' },
      { name: 'daily_case_quota', type: 'int' },
      { name: 'assigned_at', type: 'datetime' }
    ]
  },
  {
    table: 'office_reservations',
    columns: [
      { name: 'reservation_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'user_id', type: 'int', key: 'FOREIGN KEY', refTable: 'user_accounts', refCol: 'user_id' },
      { name: 'office_id', type: 'int', key: 'FOREIGN KEY', refTable: 'offices', refCol: 'office_id' },
      { name: 'issue_id', type: 'int', key: 'FOREIGN KEY', refTable: 'issues', refCol: 'issue_id' },
      { name: 'reservation_date', type: 'date' },
      { name: 'slot_time', type: 'time' },
      { name: 'status', type: 'enum' },
      { name: 'notes', type: 'text' },
      { name: 'location_override', type: 'varchar', len: 255 },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' }
    ]
  },
  {
    table: 'transactions',
    columns: [
      { name: 'transaction_id', type: 'int', key: 'PRIMARY KEY' },
      { name: 'reservation_id', type: 'int', key: 'FOREIGN KEY', refTable: 'office_reservations', refCol: 'reservation_id' },
      { name: 'user_id', type: 'int', key: 'FOREIGN KEY', refTable: 'user_accounts', refCol: 'user_id' },
      { name: 'office_id', type: 'int', key: 'FOREIGN KEY', refTable: 'offices', refCol: 'office_id' },
      { name: 'issue_id', type: 'int', key: 'FOREIGN KEY', refTable: 'issues', refCol: 'issue_id' },
      { name: 'amount', type: 'decimal' },
      { name: 'payment_method', type: 'enum' },
      { name: 'payment_status', type: 'enum' },
      { name: 'reference_no', type: 'varchar', len: 80, key: 'UNIQUE' },
      { name: 'paid_at', type: 'datetime' },
      { name: 'created_at', type: 'datetime' }
    ]
  },
  {
    table: 'audit_logs',
    columns: [
      { name: 'log_id', type: 'bigint', key: 'PRIMARY KEY' },
      { name: 'table_name', type: 'varchar', len: 64 },
      { name: 'action_type', type: 'enum' },
      { name: 'record_id', type: 'varchar', len: 64 },
      { name: 'old_values', type: 'json' },
      { name: 'new_values', type: 'json' },
      { name: 'performed_by', type: 'varchar', len: 100 },
      { name: 'performed_at', type: 'datetime' }
    ]
  }
];

const rows = [];
rows.push(columns.join('\t'));

for (const t of tables) {
  let pos = 1;
  for (const c of t.columns) {
    const row = [
      'mysql',
      schemaName,
      t.table,
      c.name,
      pos++,
      c.type,
      c.len || '',
      c.key || '',
      c.refTable ? schemaName : '',
      c.refTable || '',
      c.refCol || ''
    ];
    rows.push(row.join('\t'));
  }
}

const outputPathTsv = path.resolve(process.cwd(), '../docs/lucidchart_erd_import.tsv');
const outputPathCsv = path.resolve(process.cwd(), '../docs/lucidchart_erd_import.csv');

fs.writeFileSync(outputPathTsv, rows.join('\n'), 'utf8');

// Also create CSV
const csvRows = rows.map(r => r.split('\t').map(val => `"${val.replace(/"/g, '""')}"`).join(','));
fs.writeFileSync(outputPathCsv, csvRows.join('\n'), 'utf8');

console.log('Successfully generated:');
console.log(outputPathTsv);
console.log(outputPathCsv);
