// Script to generate a complete, native .drawio diagram file with styled tables and Crow's Foot cardinality
import fs from 'fs';
import path from 'path';

const tables = [
  {
    id: 'campuses',
    name: 'campuses',
    x: 50,
    y: 80,
    width: 230,
    headerColor: '#1E293B',
    fields: [
      { name: 'campus_id', type: 'INT', key: 'PK' },
      { name: 'campus_code', type: 'VARCHAR(20)', key: 'UK' },
      { name: 'name', type: 'VARCHAR(150)' },
      { name: 'address', type: 'VARCHAR(255)' },
      { name: 'latitude', type: 'DECIMAL(10,8)' },
      { name: 'longitude', type: 'DECIMAL(11,8)' },
      { name: 'created_at', type: 'DATETIME' }
    ]
  },
  {
    id: 'buildings',
    name: 'buildings',
    x: 50,
    y: 360,
    width: 230,
    headerColor: '#1E293B',
    fields: [
      { name: 'building_id', type: 'INT', key: 'PK' },
      { name: 'campus_id', type: 'INT', key: 'FK' },
      { name: 'building_code', type: 'VARCHAR(20)', key: 'UK' },
      { name: 'name', type: 'VARCHAR(150)' },
      { name: 'total_floors', type: 'TINYINT' },
      { name: 'latitude', type: 'DECIMAL(10,8)' },
      { name: 'longitude', type: 'DECIMAL(11,8)' },
      { name: 'created_at', type: 'DATETIME' }
    ]
  },
  {
    id: 'facility_categories',
    name: 'facility_categories (Lookup)',
    x: 330,
    y: 80,
    width: 240,
    headerColor: '#475569',
    fields: [
      { name: 'category_id', type: 'INT', key: 'PK' },
      { name: 'category_code', type: 'VARCHAR(30)', key: 'UK' },
      { name: 'name', type: 'VARCHAR(100)' },
      { name: 'description', type: 'VARCHAR(255)' },
      { name: 'icon_name', type: 'VARCHAR(50)' }
    ]
  },
  {
    id: 'facilities',
    name: 'facilities',
    x: 330,
    y: 330,
    width: 240,
    headerColor: '#1E293B',
    fields: [
      { name: 'facility_id', type: 'INT', key: 'PK' },
      { name: 'building_id', type: 'INT', key: 'FK' },
      { name: 'category_id', type: 'INT', key: 'FK' },
      { name: 'room_number', type: 'VARCHAR(30)' },
      { name: 'floor_number', type: 'TINYINT' },
      { name: 'name', type: 'VARCHAR(150)' },
      { name: 'description', type: 'TEXT' },
      { name: 'is_public', type: 'BOOLEAN' },
      { name: 'created_at', type: 'DATETIME' }
    ]
  },
  {
    id: 'offices',
    name: 'offices',
    x: 640,
    y: 310,
    width: 250,
    headerColor: '#0F766E', // Teal for core operational hub
    fields: [
      { name: 'office_id', type: 'INT', key: 'PK' },
      { name: 'facility_id', type: 'INT', key: 'FK' },
      { name: 'office_code', type: 'VARCHAR(30)', key: 'UK' },
      { name: 'name', type: 'VARCHAR(150)' },
      { name: 'email', type: 'VARCHAR(120)' },
      { name: 'phone', type: 'VARCHAR(40)' },
      { name: 'desk_directions', type: 'TEXT' },
      { name: 'is_accepting_payments', type: 'BOOLEAN' },
      { name: 'is_accepting_reservations', type: 'BOOLEAN' },
      { name: 'created_at', type: 'DATETIME' },
      { name: 'updated_at', type: 'DATETIME' }
    ]
  },
  {
    id: 'office_operating_hours',
    name: 'office_operating_hours',
    x: 640,
    y: 80,
    width: 250,
    headerColor: '#334155',
    fields: [
      { name: 'hours_id', type: 'INT', key: 'PK' },
      { name: 'office_id', type: 'INT', key: 'FK' },
      { name: 'day_of_week', type: 'TINYINT' },
      { name: 'open_time', type: 'TIME' },
      { name: 'close_time', type: 'TIME' },
      { name: 'is_closed', type: 'BOOLEAN' }
    ]
  },
  {
    id: 'issue_categories',
    name: 'issue_categories (Lookup)',
    x: 960,
    y: 80,
    width: 240,
    headerColor: '#475569',
    fields: [
      { name: 'issue_category_id', type: 'INT', key: 'PK' },
      { name: 'category_name', type: 'VARCHAR(80)', key: 'UK' },
      { name: 'description', type: 'VARCHAR(255)' }
    ]
  },
  {
    id: 'issues',
    name: 'issues',
    x: 960,
    y: 280,
    width: 240,
    headerColor: '#1E293B',
    fields: [
      { name: 'issue_id', type: 'INT', key: 'PK' },
      { name: 'issue_category_id', type: 'INT', key: 'FK' },
      { name: 'issue_code', type: 'VARCHAR(30)', key: 'UK' },
      { name: 'issue_name', type: 'VARCHAR(150)' },
      { name: 'description', type: 'TEXT' },
      { name: 'standard_fee', type: 'DECIMAL(10,2)' },
      { name: 'requires_in_person', type: 'BOOLEAN' },
      { name: 'created_at', type: 'DATETIME' }
    ]
  },
  {
    id: 'issue_office_mappings',
    name: 'issue_office_mappings (M:M 1)',
    x: 960,
    y: 580,
    width: 260,
    headerColor: '#B45309', // Amber for M:M Junction
    fields: [
      { name: 'mapping_id', type: 'INT', key: 'PK' },
      { name: 'issue_id', type: 'INT', key: 'FK' },
      { name: 'office_id', type: 'INT', key: 'FK' },
      { name: 'priority_level', type: 'ENUM' },
      { name: 'resolution_guide', type: 'TEXT' },
      { name: 'avg_resolution_minutes', type: 'INT' },
      { name: 'is_active', type: 'BOOLEAN' },
      { name: 'mapped_at', type: 'DATETIME' }
    ]
  },
  {
    id: 'office_staff_assignments',
    name: 'office_staff_assignments (M:M 2)',
    x: 640,
    y: 680,
    width: 270,
    headerColor: '#B45309', // Amber for M:M Junction
    fields: [
      { name: 'assignment_id', type: 'INT', key: 'PK' },
      { name: 'user_id', type: 'INT', key: 'FK' },
      { name: 'office_id', type: 'INT', key: 'FK' },
      { name: 'assigned_role', type: 'ENUM' },
      { name: 'assignment_status', type: 'ENUM' },
      { name: 'shift_schedule', type: 'ENUM' },
      { name: 'can_process_payments', type: 'BOOLEAN' },
      { name: 'daily_case_quota', type: 'INT' },
      { name: 'assigned_at', type: 'DATETIME' }
    ]
  },
  {
    id: 'user_accounts',
    name: 'user_accounts',
    x: 1280,
    y: 80,
    width: 240,
    headerColor: '#1E293B',
    fields: [
      { name: 'user_id', type: 'INT', key: 'PK' },
      { name: 'email', type: 'VARCHAR(120)', key: 'UK' },
      { name: 'password_hash', type: 'VARCHAR(255)' },
      { name: 'user_role', type: 'ENUM' },
      { name: 'is_active', type: 'BOOLEAN' },
      { name: 'created_at', type: 'DATETIME' },
      { name: 'updated_at', type: 'DATETIME' }
    ]
  },
  {
    id: 'user_profiles',
    name: 'user_profiles',
    x: 1580,
    y: 80,
    width: 250,
    headerColor: '#334155',
    fields: [
      { name: 'profile_id', type: 'INT', key: 'PK' },
      { name: 'user_id', type: 'INT', key: 'FK, UK' },
      { name: 'student_or_visitor_id', type: 'VARCHAR(50)', key: 'UK' },
      { name: 'full_name', type: 'VARCHAR(120)' },
      { name: 'phone_number', type: 'VARCHAR(30)' },
      { name: 'department_or_affiliation', type: 'VARCHAR(120)' },
      { name: 'created_at', type: 'DATETIME' },
      { name: 'updated_at', type: 'DATETIME' }
    ]
  },
  {
    id: 'office_reservations',
    name: 'office_reservations',
    x: 1280,
    y: 350,
    width: 250,
    headerColor: '#0369A1', // Sky blue for reservations
    fields: [
      { name: 'reservation_id', type: 'INT', key: 'PK' },
      { name: 'user_id', type: 'INT', key: 'FK' },
      { name: 'office_id', type: 'INT', key: 'FK' },
      { name: 'issue_id', type: 'INT', key: 'FK' },
      { name: 'reservation_date', type: 'DATE' },
      { name: 'slot_time', type: 'TIME' },
      { name: 'status', type: 'ENUM' },
      { name: 'notes', type: 'TEXT' },
      { name: 'location_override', type: 'VARCHAR(255)' },
      { name: 'created_at', type: 'DATETIME' },
      { name: 'updated_at', type: 'DATETIME' }
    ]
  },
  {
    id: 'transactions',
    name: 'transactions',
    x: 1280,
    y: 710,
    width: 250,
    headerColor: '#15803D', // Green for financial ledger
    fields: [
      { name: 'transaction_id', type: 'INT', key: 'PK' },
      { name: 'reservation_id', type: 'INT', key: 'FK' },
      { name: 'user_id', type: 'INT', key: 'FK' },
      { name: 'office_id', type: 'INT', key: 'FK' },
      { name: 'issue_id', type: 'INT', key: 'FK' },
      { name: 'amount', type: 'DECIMAL(10,2)' },
      { name: 'payment_method', type: 'ENUM' },
      { name: 'payment_status', type: 'ENUM' },
      { name: 'reference_no', type: 'VARCHAR(80)', key: 'UK' },
      { name: 'paid_at', type: 'DATETIME' },
      { name: 'created_at', type: 'DATETIME' }
    ]
  },
  {
    id: 'audit_logs',
    name: 'audit_logs',
    x: 1580,
    y: 350,
    width: 240,
    headerColor: '#475569',
    fields: [
      { name: 'log_id', type: 'BIGINT', key: 'PK' },
      { name: 'table_name', type: 'VARCHAR(64)' },
      { name: 'action_type', type: 'ENUM' },
      { name: 'record_id', type: 'VARCHAR(64)' },
      { name: 'old_values', type: 'JSON' },
      { name: 'new_values', type: 'JSON' },
      { name: 'performed_by', type: 'VARCHAR(100)' },
      { name: 'performed_at', type: 'DATETIME' }
    ]
  }
];

// Relationships with Crow's Foot Cardinality
const relationships = [
  // Physical hierarchy: campuses (1) -> buildings (N)
  { from: 'campuses', to: 'buildings', label: '1 : N', startArrow: 'ERone', endArrow: 'ERmany' },
  // buildings (1) -> facilities (N)
  { from: 'buildings', to: 'facilities', label: '1 : N', startArrow: 'ERone', endArrow: 'ERmany' },
  // facility_categories (1) -> facilities (N)
  { from: 'facility_categories', to: 'facilities', label: '1 : N', startArrow: 'ERone', endArrow: 'ERmany' },
  // facilities (1) -> offices (N)
  { from: 'facilities', to: 'offices', label: '1 : N', startArrow: 'ERone', endArrow: 'ERmany' },
  // offices (1) -> office_operating_hours (N)
  { from: 'offices', to: 'office_operating_hours', label: '1 : N', startArrow: 'ERone', endArrow: 'ERmany' },

  // M:M Junction 1: issues <-> offices via issue_office_mappings
  { from: 'issues', to: 'issue_office_mappings', label: '1 : N', startArrow: 'ERone', endArrow: 'ERmany' },
  { from: 'offices', to: 'issue_office_mappings', label: '1 : N', startArrow: 'ERone', endArrow: 'ERmany' },
  { from: 'issue_categories', to: 'issues', label: '1 : N', startArrow: 'ERone', endArrow: 'ERmany' },

  // User 1:1 relation: user_accounts (1) -> user_profiles (1)
  { from: 'user_accounts', to: 'user_profiles', label: '1 : 1', startArrow: 'ERone', endArrow: 'ERmandOne' },

  // M:M Junction 2: user_accounts <-> offices via office_staff_assignments
  { from: 'user_accounts', to: 'office_staff_assignments', label: '1 : N (staff)', startArrow: 'ERone', endArrow: 'ERmany' },
  { from: 'offices', to: 'office_staff_assignments', label: '1 : N', startArrow: 'ERone', endArrow: 'ERmany' },

  // Operational: reservations
  { from: 'user_accounts', to: 'office_reservations', label: '1 : N (books)', startArrow: 'ERone', endArrow: 'ERmany' },
  { from: 'offices', to: 'office_reservations', label: '1 : N (hosts)', startArrow: 'ERone', endArrow: 'ERmany' },
  { from: 'issues', to: 'office_reservations', label: '1 : N (for)', startArrow: 'ERone', endArrow: 'ERmany' },

  // Fiscal: transactions
  { from: 'office_reservations', to: 'transactions', label: '1 : 0..1 (settles)', startArrow: 'ERone', endArrow: 'ERzeroToOne' },
  { from: 'user_accounts', to: 'transactions', label: '1 : N (pays)', startArrow: 'ERone', endArrow: 'ERmany' },
  { from: 'offices', to: 'transactions', label: '1 : N (collects)', startArrow: 'ERone', endArrow: 'ERmany' }
];

let cellId = 2;
let xmlCells = '';

// Generate XML for each table and its fields
for (const t of tables) {
  const rowHeight = 24;
  const headerHeight = 28;
  const totalHeight = headerHeight + t.fields.length * rowHeight;
  const tableCellId = `table_${t.id}`;

  xmlCells += `
    <mxCell id="${tableCellId}" value="&lt;b&gt;${t.name}&lt;/b&gt;" style="swimlane;fontStyle=0;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=${headerHeight};horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=${t.headerColor};fontColor=#ffffff;strokeColor=#334155;rounded=1;shadow=1;" vertex="1" parent="1">
      <mxGeometry x="${t.x}" y="${t.y}" width="${t.width}" height="${totalHeight}" as="geometry" />
    </mxCell>`;

  let currentY = headerHeight;
  for (const f of t.fields) {
    const fId = `field_${t.id}_${f.name}`;
    const keyBadge = f.key ? `&lt;font color=&quot;#F59E0B&quot;&gt;&lt;b&gt;[${f.key}]&lt;/b&gt;&lt;/font&gt; ` : '';
    const label = `${keyBadge}${f.name} &lt;font color=&quot;#64748B&quot;&gt;: ${f.type}&lt;/font&gt;`;

    xmlCells += `
    <mxCell id="${fId}" value="${label}" style="text;strokeColor=none;fillColor=#ffffff;align=left;verticalAlign=middle;spacingLeft=8;spacingRight=8;overflow=hidden;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;rotatable=0;whiteSpace=wrap;html=1;fontSize=11;fontColor=#1E293B;" vertex="1" parent="${tableCellId}">
      <mxGeometry y="${currentY}" width="${t.width}" height="${rowHeight}" as="geometry" />
    </mxCell>`;
    currentY += rowHeight;
  }
}

// Generate XML for relationship connector lines with Crow's Foot cardinality
for (const r of relationships) {
  const edgeId = `edge_${r.from}_${r.to}_${cellId++}`;
  const sourceId = `table_${r.from}`;
  const targetId = `table_${r.to}`;

  // ER Cardinality Arrow styles in draw.io:
  // ERone: || (one)
  // ERmany: >{ (crow's foot many)
  // ERmandOne: || (mandatory one)
  // ERzeroToOne: O| (zero or one)
  xmlCells += `
    <mxCell id="${edgeId}" value="${r.label}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=${r.startArrow};startFill=0;endArrow=${r.endArrow};endFill=0;strokeColor=#475569;strokeWidth=1.5;fontSize=10;fontColor=#475569;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="${sourceId}" target="${targetId}">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>`;
}

const drawioXml = `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="UniDesk Database Engine" version="21.0.0" type="device">
  <diagram id="unidesk-schema-erd" name="UniDesk Database Schema ERD">
    <mxGraphModel dx="1800" dy="1100" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2000" pageHeight="1200" background="#F8FAFC" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        ${xmlCells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

const outputPath = path.resolve(process.cwd(), '../docs/unidesk_schema.drawio');
fs.writeFileSync(outputPath, drawioXml, 'utf8');

console.log('Successfully generated complete native draw.io diagram file:');
console.log(outputPath);
