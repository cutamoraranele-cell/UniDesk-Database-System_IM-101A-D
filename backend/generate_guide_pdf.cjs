const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.resolve(__dirname, '..', 'docs', 'TEAM_GIT_CONTRIBUTION_AND_COMPLIANCE_GUIDE.pdf');
const rootOutputPath = path.resolve(__dirname, '..', 'TEAM_GIT_CONTRIBUTION_AND_COMPLIANCE_GUIDE.pdf');

// Ensure docs directory exists
const docsDir = path.dirname(outputPath);
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 45, left: 45, right: 45 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Palette
const PRIMARY = '#0f5132';     // Deep forest green
const SECONDARY = '#1f6fb0';   // Navy blue
const ACCENT = '#d97706';      // Amber gold
const DARK = '#111827';        // Text dark
const MUTED = '#4b5563';       // Gray text
const LIGHT_BG = '#f8fafc';    // Card/table background
const BORDER = '#e2e8f0';      // Border line
const CODE_BG = '#f1f5f9';     // Code background

function checkPage(neededHeight = 60) {
  if (doc.y + neededHeight > doc.page.height - 45) {
    doc.addPage();
  }
}

function headerBar() {
  doc.rect(45, 30, doc.page.width - 90, 4).fill(PRIMARY);
  doc.y = 42;
}

function sectionTitle(title, icon = '') {
  checkPage(40);
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(PRIMARY).text(`${icon ? icon + ' ' : ''}${title}`);
  doc.rect(45, doc.y + 2, doc.page.width - 90, 1.5).fill(PRIMARY);
  doc.moveDown(0.4);
}

function subTitle(title) {
  checkPage(30);
  doc.moveDown(0.4);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(SECONDARY).text(title);
  doc.moveDown(0.2);
}

function bodyText(text) {
  checkPage(20);
  doc.font('Helvetica').fontSize(9.5).fillColor(DARK).text(text, { lineGap: 2.5 });
  doc.moveDown(0.2);
}

function bullet(text, boldPrefix = '') {
  checkPage(18);
  const indent = 55;
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY).text('• ', 45, doc.y, { continued: true });
  if (boldPrefix) {
    doc.font('Helvetica-Bold').fillColor(DARK).text(boldPrefix + ' ', { continued: true });
  }
  doc.font('Helvetica').fillColor(DARK).text(text, { lineGap: 2 });
  doc.moveDown(0.15);
}

function callout(title, text, type = 'info') {
  checkPage(50);
  const color = type === 'warning' ? '#dc2626' : (type === 'important' ? '#b45309' : PRIMARY);
  const bg = type === 'warning' ? '#fef2f2' : (type === 'important' ? '#fffbeb' : '#f0fdf4');
  const startY = doc.y;
  
  // Measure text
  doc.font('Helvetica').fontSize(9);
  const textHeight = doc.heightOfString(text, { width: doc.page.width - 120 });
  const boxHeight = textHeight + 24;
  
  doc.rect(45, startY, doc.page.width - 90, boxHeight).fill(bg);
  doc.rect(45, startY, 4, boxHeight).fill(color);
  
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(color).text(title, 55, startY + 5);
  doc.font('Helvetica').fontSize(9).fillColor(DARK).text(text, 55, startY + 18, { width: doc.page.width - 120, lineGap: 1.5 });
  
  doc.y = startY + boxHeight + 8;
}

function codeBlock(codeLines) {
  const code = Array.isArray(codeLines) ? codeLines.join('\n') : codeLines;
  doc.font('Courier').fontSize(8.5);
  const h = doc.heightOfString(code, { width: doc.page.width - 110 }) + 14;
  checkPage(h + 10);
  
  const y = doc.y;
  doc.rect(45, y, doc.page.width - 90, h).fill(CODE_BG);
  doc.rect(45, y, doc.page.width - 90, h).stroke(BORDER);
  doc.font('Courier').fontSize(8.5).fillColor('#0f172a').text(code, 52, y + 7, { width: doc.page.width - 110, lineGap: 2 });
  doc.y = y + h + 6;
}

function drawTable(headers, rows, colWidths) {
  checkPage(40 + rows.length * 20);
  const startX = 45;
  let currentY = doc.y + 4;
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);

  // Header Row
  doc.rect(startX, currentY, tableWidth, 20).fill(PRIMARY);
  let curX = startX;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff');
  headers.forEach((h, i) => {
    doc.text(h, curX + 4, currentY + 5, { width: colWidths[i] - 8, align: 'left' });
    curX += colWidths[i];
  });
  currentY += 20;

  // Data Rows
  rows.forEach((row, rIdx) => {
    // Check if new page needed
    if (currentY + 22 > doc.page.height - 45) {
      doc.addPage();
      currentY = 45;
      // Re-draw header
      doc.rect(startX, currentY, tableWidth, 20).fill(PRIMARY);
      let rX = startX;
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff');
      headers.forEach((h, i) => {
        doc.text(h, rX + 4, currentY + 5, { width: colWidths[i] - 8, align: 'left' });
        rX += colWidths[i];
      });
      currentY += 20;
    }

    const rowBg = rIdx % 2 === 0 ? '#ffffff' : LIGHT_BG;
    doc.rect(startX, currentY, tableWidth, 20).fill(rowBg);
    doc.rect(startX, currentY, tableWidth, 20).stroke(BORDER);

    curX = startX;
    row.forEach((cell, cIdx) => {
      const isBold = cIdx === 0;
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor(DARK);
      doc.text(cell, curX + 4, currentY + 5, { width: colWidths[cIdx] - 8 });
      curX += colWidths[cIdx];
    });
    currentY += 20;
  });

  doc.y = currentY + 8;
}

// ============================================================================
// DOCUMENT GENERATION
// ============================================================================

// --- COVER HEADER ---
headerBar();
doc.moveDown(0.2);
doc.font('Helvetica-Bold').fontSize(20).fillColor(PRIMARY).text('UNIDESK DATABASE SYSTEM');
doc.font('Helvetica-Bold').fontSize(13).fillColor(SECONDARY).text('3-Person Collaborative Git Workflow & Instructor Compliance Playbook');
doc.font('Helvetica-Oblique').fontSize(9).fillColor(MUTED).text('A rigorous guide to feature branching, linear commit footprints, branch protection, and equal grading split');
doc.moveDown(0.4);

callout('INSTRUCTOR COMPLIANCE NOTICE', 
  'This repository is governed by strict academic contribution auditing. Commits must be iterative, frequency-balanced across all three contributors, scoped to designated modules, and merged strictly via reviewed Pull Requests. Direct pushes to main or bulk single-commit uploads violate grading policy and result in zero-grade penalties.',
  'important'
);

// --- ROLES & RESPONSIBILITIES ---
sectionTitle('Team Role Allocation & Ownership Matrix', '👥');
bodyText('To ensure all three team members receive full contribution grades, each member strictly owns one module directory. Cross-module edits must be coordinated via linked Pull Requests.');

const roleHeaders = ['Team Member', 'Assigned Module', 'Directory Scope', 'Sample Branch Prefix'];
const roleRows = [
  ['Person A', 'Frontend Client Application', 'frontend/', 'feature/fe-*'],
  ['Person B', 'Backend API & DB Middleware', 'backend/', 'feature/be-*'],
  ['Person C (Admin)', 'Database Architecture & Docs', 'database/ & docs/', 'feature/db-*']
];
drawTable(roleHeaders, roleRows, [100, 150, 120, 135]);

// --- SECTION 1: REPOSITORY ARCHITECTURE ---
sectionTitle('1. Repository Structure & File Governance', '📁');
bodyText('The repository is organized into isolated functional tiers. Every member must respect boundaries to prevent merge collisions.');

codeBlock([
  'unidesk-database-system/',
  '├── .gitignore                     # Root level ignore (REQUIRED - stage first)',
  '├── README.md                      # Setup instructions & member ownership matrix',
  '├── docs/                          # Person C (ERD diagrams, DB architecture specs)',
  '│   ├── DATABASE_SCHEMA_DESIGN.md',
  '│   ├── unidesk_schema.drawio',
  '│   └── DRAWIO_IMPORT_GUIDE.md',
  '├── database/                      # Person C (SQL DDL/DML, triggers, routines, RBAC)',
  '│   ├── 01_schema_3nf.sql',
  '│   ├── 02_triggers.sql',
  '│   ├── 03_procedures_functions.sql',
  '│   ├── 04_rbac.sql',
  '│   └── 05_seed_data.sql',
  '├── backend/                       # Person B (Node.js/Express API & connection pool)',
  '│   ├── package.json & package-lock.json',
  '│   ├── .env.example               # Sanitized template (NEVER real credentials)',
  '│   └── src/ (server.js, db.js, routes/)',
  '└── frontend/                      # Person A (React/Vite single-page application)',
  '    ├── package.json & package-lock.json',
  '    ├── index.html, vite.config.js',
  '    └── src/ (App.jsx, components/)'
]);

const fileHeaders = ['File / Artifact', 'Status', 'Inspection Criterion'];
const fileRows = [
  ['Root .gitignore', 'REQUIRED', 'Prevents node_modules, .env, and dist from contaminating history.'],
  ['Root README.md', 'REQUIRED', 'Documents setup, prerequisites, and explicit 3-member contribution matrix.'],
  ['backend/.env.example', 'REQUIRED', 'Proves secret governance. Contains dummy keys (DB_HOST, DB_USER).'],
  ['package.json & lock', 'REQUIRED', 'Committed in both frontend/ and backend/ for deterministic builds.'],
  ['database/*.sql scripts', 'REQUIRED', 'Direct proof of 3NF schema, procedures, triggers, RBAC, and seed dataset.'],
  ['docs/ ERD & Schemas', 'REQUIRED', 'Visual proof of relational integrity (PKs, FKs, Cardinality).'],
  ['.env files (secrets)', 'FORBIDDEN', 'Credential leakage penalty. Zero grade on security audit.'],
  ['node_modules/ or dist/', 'FORBIDDEN', 'Bulk file dumping penalty. Bloats repository index.']
];
drawTable(fileHeaders, fileRows, [140, 95, 270]);

// --- SECTION 2: IDENTITY AUTHENTICATION ---
sectionTitle('2. Fair Contribution Split & Identity Authentication', '🔐');
bodyText('GitHub calculates contributions in Insights > Contributors based strictly on the email associated with each commit. If a team member commits with an unverified or local machine email, their commits will show as an unlinked gray avatar, resulting in zero contribution points.');

subTitle('Machine Configuration (Run once on each laptop before committing):');
bodyText('Person A (Frontend Lead):');
codeBlock([
  'git config --global user.name "Person A Full Name"',
  'git config --global user.email "person-a-email@university.edu"'
]);

bodyText('Person B (Backend Lead):');
codeBlock([
  'git config --global user.name "Person B Full Name"',
  'git config --global user.email "person-b-email@university.edu"'
]);

bodyText('Person C (Database Lead & Admin):');
codeBlock([
  'git config --global user.name "Person C Full Name"',
  'git config --global user.email "person-c-email@university.edu"'
]);

callout('EMAIL VERIFICATION RULE', 
  'The email entered in git config user.email MUST exactly match an email added and verified under GitHub Profile > Settings > Emails. If you use a university email, verify both your university email and GitHub primary email.',
  'warning'
);

subTitle('Initial Repository Seeding (Person C / Admin only):');
codeBlock([
  'cd unidesk-database-system',
  'git init -b main',
  'git add .gitignore README.md',
  'git commit -m "chore(repo): initialize repository structure and gitignore governance"',
  'git remote add origin https://github.com/<org-or-user>/unidesk-database-system.git',
  'git push -u origin main'
]);

bodyText('Once Person C pushes the initial seed commit, Person A and Person B clone the repository:');
codeBlock([
  'git clone https://github.com/<org-or-user>/unidesk-database-system.git',
  'cd unidesk-database-system'
]);

// --- SECTION 3: BRANCH PROTECTION ---
sectionTitle('3. Branch Protection Setup & Repository Governance', '🛡️');
bodyText('To comply with the non-negotiable rule ("Pushing directly to main is prohibited. The core branch must be locked"), Person C must configure GitHub Branch Protection immediately.');

bullet('Designate Person C as Repository Administrator (Repository Owner).', 'Administrator Role:');
bullet('Add Person A and Person B under Settings > Collaborators with Write permissions.', 'Collaborator Access:');

subTitle('Step-by-Step GitHub Web UI Protection Settings:');
bullet('In your GitHub repo, click Settings (top right tab) > Branches (left sidebar).', 'Step 1:');
bullet('Click Add branch protection rule and set Branch name pattern to: main', 'Step 2:');
bullet('Require a pull request before merging (Set required approvals to: 1).', 'Step 3:');
bullet('Dismiss stale pull request approvals when new commits are pushed.', 'Step 4:');
bullet('Require linear history (Eliminates messy merge bubbles; keeps tracking tree clean).', 'Step 5:');
bullet('Do not allow force pushes (Prevents destructive git push --force).', 'Step 6:');
bullet('Do not allow deletions (Prevents accidental branch removal).', 'Step 7:');
bullet('Do not allow bypass of the above settings (Enforce rules for Administrators).', 'Step 8:');

subTitle('Equivalent GitHub CLI (gh) Command:');
codeBlock([
  'gh api --method PUT /repos/:owner/:repo/branches/main/protection \\',
  '  --input - <<< \'{',
  '    "required_status_checks": null,',
  '    "enforce_admins": true,',
  '    "required_pull_request_reviews": {',
  '      "dismiss_stale_reviews": true,',
  '      "require_code_owner_reviews": false,',
  '      "required_approving_review_count": 1',
  '    },',
  '    "restrictions": null,',
  '    "required_linear_history": true,',
  '    "allow_force_pushes": false,',
  '    "allow_deletions": false',
  '  }\''
]);

// --- SECTION 4: FEATURE-BRANCH PIPELINE ---
sectionTitle('4. Feature-Branch Workflow & Pull Request Pipeline', '🌿');
bodyText('Direct pushes to main are strictly forbidden. Every feature, bug fix, or schema evolution must originate on an isolated side branch and be merged through a peer-reviewed Pull Request.');

subTitle('Standard Feature Branch Naming Syntax:');
bullet('feature/fe-auth-ui, feature/fe-campus-map, feature/fe-visitor-routing', 'Frontend (Person A):');
bullet('feature/be-express-pool, feature/be-request-crud-api, feature/be-auth-middleware', 'Backend (Person B):');
bullet('feature/db-3nf-schema-v1, feature/db-audit-triggers, feature/db-stored-procedures', 'Database (Person C):');

subTitle('Command-by-Command Lifecycle (Example: Person C adding triggers):');
codeBlock([
  '# 1. Always pull latest main before starting',
  'git checkout main',
  'git pull origin main',
  '',
  '# 2. Create and switch to your feature branch',
  'git checkout -b feature/db-audit-triggers',
  '',
  '# 3. Work inside your assigned folder & stage small atomic commits',
  'git add database/02_triggers.sql',
  'git commit -m "feat(db): implement audit trigger for requests status changes"',
  '',
  '# 4. Make further iterative refinements',
  'git add database/02_triggers.sql',
  'git commit -m "fix(db): correct old-value null handling in relocation trigger"',
  '',
  '# 5. Fetch and rebase against main before pushing to ensure linear graph',
  'git fetch origin',
  'git rebase origin/main',
  '',
  '# 6. Push the feature branch to GitHub',
  'git push -u origin feature/db-audit-triggers'
]);

subTitle('Opening & Merging the Pull Request on GitHub:');
bullet('Open the repo in GitHub. Click Compare & pull request on your pushed branch.', 'Step 1:');
bullet('Title: feat(db): automated audit triggers for status & relocation changes.', 'Step 2:');
bullet('Description: Fill out the brief PR template (Summary of Changes & Testing Steps).', 'Step 3:');
bullet('Reviewers: Assign your teammates (Person A and Person B) on the right sidebar.', 'Step 4:');
bullet('Teammate Review: Person A or B opens PR > Files changed > Review changes > Approve.', 'Step 5:');
bullet('Merge: Click Rebase and merge (or Squash and merge).', 'Step 6:');
bullet('Clean up: Click Delete branch on GitHub, then clean up locally: git checkout main && git pull origin main && git branch -d feature/db-audit-triggers.', 'Step 7:');

// --- SECTION 5: COMMIT HYGIENE ---
sectionTitle('5. Commit Hygiene & Avoiding the Bulk Drop Penalty', '✍️');
bodyText('Commits must adhere to the Conventional Commits specification. A single massive commit containing an entire module is flagged as non-compliant.');

subTitle('Commit Message Anatomy: <type>(<scope>): <concise description>');
bullet('feat(fe): scaffold react application with vite and custom routing', 'Person A:');
bullet('feat(fe): build campus directory hero with interactive search input', 'Person A:');
bullet('feat(fe): implement password visibility toggle with eye-off icon', 'Person A:');
bullet('feat(fe): create public visitor default interface and auth modal', 'Person A:');
bullet('feat(be): initialize express server and configure cors middleware', 'Person B:');
bullet('feat(be): setup mysql2 connection pool with environment variables', 'Person B:');
bullet('feat(be): implement auth login endpoint with bcrypt verification', 'Person B:');
bullet('feat(be): build service request crud endpoints with transaction support', 'Person B:');
bullet('docs(erd): finalize 15-table 3nf relational schema architecture', 'Person C:');
bullet('feat(db): define core tables, primary keys, and foreign key cascades', 'Person C:');
bullet('feat(db): write stored procedure for appointment scheduling validation', 'Person C:');
bullet('feat(db): establish rbac roles, table grants, and operational permissions', 'Person C:');

subTitle('Staging Partial Work with Precision:');
codeBlock([
  '# Target specific files (NEVER run generic `git add .`)',
  'git add frontend/src/App.jsx',
  'git commit -m "feat(fe): add show-hide password toggle to login"',
  '',
  '# Interactive hunk staging (stage parts of a modified file)',
  'git add -p frontend/src/App.jsx'
]);

subTitle('Emergency: What if you made a giant commit locally before pushing?');
codeBlock([
  '# Undo the single giant commit, but KEEP all modified files intact in working directory',
  'git reset --soft HEAD~1',
  '',
  '# Now break it into 4 separate logical commits:',
  'git add backend/package.json backend/.env.example',
  'git commit -m "chore(be): setup dependencies and environment configuration"',
  '',
  'git add backend/src/config/db.js',
  'git commit -m "feat(be): implement mysql connection pool manager"',
  '',
  'git add backend/src/routes/auth.js',
  'git commit -m "feat(be): build user authentication and password hashing logic"',
  '',
  'git add backend/src/server.js',
  'git commit -m "feat(be): assemble api router and health check listener"'
]);

// --- SECTION 6: TIMELINE & PRE-INSPECTION ---
sectionTitle('6. Multi-Week Cadence & Live Inspection Checklist', '📊');
bodyText('Distribute your Pull Requests evenly across project sprints to produce an organic, credible software engineering network graph.');

const timelineHeaders = ['Sprint / Week', 'Person C (Database Lead)', 'Person B (Backend Lead)', 'Person A (Frontend Lead)'];
const timelineRows = [
  ['Week 1 (Foundations)', 'PR #1: 3NF Relational Tables DDL', 'PR #2: Express Server & DB Pool', 'PR #3: Vite Setup & Design Tokens'],
  ['Week 2 (Core Logic)', 'PR #4: Business Stored Procedures', 'PR #5: Office Directory Search API', 'PR #6: Campus Directory & Office Views'],
  ['Week 3 (Integrations)', 'PR #7: Audit Triggers & RBAC Grants', 'PR #8: Booking & CRUD Endpoints', 'PR #9: Visitor Interface & Request Forms'],
  ['Week 4 (Hardening)', 'PR #10: Seed Datasets & ERD Docs', 'PR #11: Input Validation & Error API', 'PR #12: Password Eye Toggles & Polish']
];
drawTable(timelineHeaders, timelineRows, [100, 135, 135, 135]);

subTitle('Live Inspection Day Checklist (Verify 24h Before Presentation):');
bullet('Insights > Contributors displays all 3 team members with healthy, proportional commit bars (~33% each).', '1. Contributor Graph:');
bullet('Insights > Network shows feature branches branching off main and merging cleanly via Pull Requests.', '2. Network Tree:');
bullet('Pull Requests > Closed shows 10-15 closed PRs, each reviewed and approved by teammates.', '3. Closed PR History:');
bullet('Settings > Branches displays "main is a protected branch" badge with approval enforcement.', '4. Branch Protection:');
bullet('Commit history contains small, scoped Conventional Commits with zero generic "final" or "upload" commits.', '5. Commit Footprints:');
bullet('Zero credentials committed; backend/.env.example exists; .env is properly gitignored.', '6. Security Hygiene:');
bullet('Repository contains no node_modules/ or build artifacts.', '7. Tree Cleanliness:');

// --- NUMBERING PAGES ---
const pageCount = doc.bufferedPageRange().count;
for (let i = 0; i < pageCount; i++) {
  doc.switchToPage(i);
  doc.font('Helvetica').fontSize(8).fillColor(MUTED);
  doc.text(
    `UniDesk System Project — Git Workflow & Compliance Guide | Page ${i + 1} of ${pageCount}`,
    45,
    doc.page.height - 30,
    { width: doc.page.width - 90, align: 'center' }
  );
}

doc.end();

writeStream.on('finish', () => {
  // Also copy to root directory for easy access
  try {
    fs.copyFileSync(outputPath, rootOutputPath);
    console.log(`PDF successfully generated at: ${outputPath}`);
    console.log(`Root copy created at: ${rootOutputPath}`);
  } catch (err) {
    console.error('Copy error:', err);
  }
});
