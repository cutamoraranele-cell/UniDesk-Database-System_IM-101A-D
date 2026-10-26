import mysql from 'mysql2/promise';
import { executeQuery, getEngineDiagnostics } from '../config/db.js';

/**
 * Live stream of database engine triggers audit logs
 */
export async function getAuditLogs(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const tableFilter = req.query.table || null;

    let sql = `
      SELECT 
        log_id,
        table_name,
        action_type,
        record_id,
        old_values,
        new_values,
        performed_by,
        performed_at
      FROM audit_logs
    `;
    const params = [];

    if (tableFilter) {
      sql += ` WHERE table_name = ?`;
      params.push(tableFilter);
    }

    sql += ` ORDER BY log_id DESC LIMIT ?`;
    params.push(limit);

    const { rows, durationMs } = await executeQuery(sql, params);

    res.json({
      success: true,
      count: rows.length,
      executionTimeMs: durationMs,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Database engine aggregated operational analytics
 */
export async function getAnalytics(req, res, next) {
  try {
    const officeId = req.query.officeId ? parseInt(req.query.officeId, 10) : null;
    
    // Stored procedure returns multiple result sets
    const { rows, durationMs } = await executeQuery('CALL sp_get_office_analytics(?)', [officeId]);

    const summary = rows[0]?.[0] || {};
    const topIssues = rows[1] || [];
    const hourlyTraffic = rows[2] || [];

    res.json({
      success: true,
      executionTimeMs: durationMs,
      data: {
        summary,
        topIssues,
        hourlyTraffic
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Database security & RBAC verification status
 */
export async function getSecurityDiagnostics(req, res, next) {
  try {
    const diagnostics = await getEngineDiagnostics();
    res.json({
      success: true,
      data: diagnostics
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Test a database URI (Cloud Aiven/Clever Cloud or Local)
 */
export async function testConnection(req, res, next) {
  try {
    const { databaseUrl } = req.body;
    if (!databaseUrl || databaseUrl.trim() === '') {
      return res.status(400).json({ success: false, message: 'Database URL required' });
    }

    const startTime = Date.now();
    const conn = await mysql.createConnection({
      uri: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    const [rows] = await conn.query('SELECT CURRENT_USER() AS user, VERSION() AS version, DATABASE() AS db');
    await conn.end();
    const latency = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Cloud database connection successful!',
      data: {
        ...rows[0],
        latencyMs: latency
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Connection failed: ${error.message}`
    });
  }
}

/**
 * Update office details (triggers trg_offices_audit_update)
 * - Staff can only edit their own assigned office
 * - Admin can edit all offices
 */
export async function updateOffice(req, res, next) {
  try {
    const officeId = parseInt(req.params.id, 10);
    const { 
      name, 
      email, 
      phone, 
      deskDirections, 
      isAcceptingPayments, 
      isAcceptingReservations,
      requesterRole = 'ADMIN',
      requesterOfficeId = null
    } = req.body;

    // RBAC Check: Staff can only edit their own assigned office
    if (requesterRole === 'STAFF') {
      if (!requesterOfficeId || parseInt(requesterOfficeId, 10) !== officeId) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied: Staff members can only modify their own assigned administrative office.'
        });
      }
    } else if (requesterRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only staff and administrators can modify office metadata.'
      });
    }

    await executeQuery(`
      UPDATE offices 
      SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        desk_directions = COALESCE(?, desk_directions),
        is_accepting_payments = COALESCE(?, is_accepting_payments),
        is_accepting_reservations = COALESCE(?, is_accepting_reservations)
      WHERE office_id = ?
    `, [
      name !== undefined ? name : null,
      email !== undefined ? email : null,
      phone !== undefined ? phone : null,
      deskDirections !== undefined ? deskDirections : null,
      isAcceptingPayments !== undefined ? isAcceptingPayments : null,
      isAcceptingReservations !== undefined ? isAcceptingReservations : null,
      officeId
    ]);

    res.json({
      success: true,
      message: 'Office updated successfully. Automated trigger trg_offices_audit_update executed.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new campus office (ADMIN ONLY)
 */
export async function createOffice(req, res, next) {
  try {
    const {
      facilityId,
      officeCode,
      name,
      email,
      phone,
      deskDirections,
      isAcceptingPayments = 1,
      isAcceptingReservations = 1,
      requesterRole = 'ADMIN'
    } = req.body;

    if (requesterRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only administrators can create or register new campus offices.'
      });
    }

    if (!facilityId || !officeCode || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing mandatory fields: facilityId, officeCode, and name are required.'
      });
    }

    // Check if office code already exists
    const { rows: existing } = await executeQuery('SELECT office_id FROM offices WHERE office_code = ?', [officeCode.trim().toUpperCase()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `An office with code "${officeCode.toUpperCase()}" already exists.`
      });
    }

    const { rows: result } = await executeQuery(`
      INSERT INTO offices (facility_id, office_code, name, email, phone, desk_directions, is_accepting_payments, is_accepting_reservations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      facilityId,
      officeCode.trim().toUpperCase(),
      name.trim(),
      email || `${officeCode.toLowerCase()}@unidesk.edu`,
      phone || '+63 (2) 8981-8500',
      deskDirections || 'Inquire at Main Lobby directory.',
      isAcceptingPayments ? 1 : 0,
      isAcceptingReservations ? 1 : 0
    ]);

    const newOfficeId = result.insertId;

    // Initialize default Monday-Friday operating hours
    for (let day = 1; day <= 5; day++) {
      await executeQuery(`
        INSERT INTO office_operating_hours (office_id, day_of_week, open_time, close_time, is_closed)
        VALUES (?, ?, '08:00:00', '17:00:00', FALSE)
      `, [newOfficeId, day]);
    }
    // Sunday and Saturday closed
    await executeQuery(`
      INSERT INTO office_operating_hours (office_id, day_of_week, open_time, close_time, is_closed)
      VALUES (?, 0, '00:00:00', '00:00:00', TRUE)
    `, [newOfficeId]);
    await executeQuery(`
      INSERT INTO office_operating_hours (office_id, day_of_week, open_time, close_time, is_closed)
      VALUES (?, 6, '00:00:00', '00:00:00', TRUE)
    `, [newOfficeId]);

    res.status(201).json({
      success: true,
      message: `Office "${name}" (${officeCode.toUpperCase()}) created successfully with automated audit logging.`,
      data: {
        officeId: newOfficeId,
        officeCode: officeCode.toUpperCase(),
        name
      }
    });
  } catch (error) {
    next(error);
  }
}

