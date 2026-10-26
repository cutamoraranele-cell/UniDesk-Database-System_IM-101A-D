import { executeQuery } from '../config/db.js';

/**
 * Book appointment/reservation using database stored procedure
 */
export async function bookReservation(req, res, next) {
  try {
    const {
      userId = 3, // Defaults to student user Alex Santos
      officeId,
      issueId,
      reservationDate,
      slotTime,
      notes = '',
      requesterRole,
      requesterOfficeId
    } = req.body;

    if (!officeId || !issueId || !reservationDate || !slotTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing mandatory fields: officeId, issueId, reservationDate, slotTime'
      });
    }

    // RBAC: If requester is STAFF, enforce that reservation is for their own office
    if (requesterRole === 'STAFF' && requesterOfficeId && parseInt(requesterOfficeId, 10) !== parseInt(officeId, 10)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Staff members can only create reservations for their own assigned office.'
      });
    }

    // Call stored procedure
    await executeQuery(
      'CALL sp_book_office_reservation(?, ?, ?, ?, ?, ?, @out_res_id, @out_txn_id, @out_fee, @out_code, @out_msg)',
      [userId, officeId, issueId, reservationDate, slotTime, notes]
    );

    const { rows: outVars } = await executeQuery(
      'SELECT @out_res_id AS res_id, @out_txn_id AS txn_id, @out_fee AS fee, @out_code AS code, @out_msg AS msg'
    );

    const result = outVars[0];

    if (result.code === 'ERROR' || result.code === 'CONFLICT') {
      return res.status(400).json({
        success: false,
        statusCode: result.code,
        message: result.msg
      });
    }

    res.status(201).json({
      success: true,
      statusCode: result.code,
      message: result.msg,
      data: {
        reservationId: result.res_id,
        transactionId: result.txn_id,
        feeAmount: result.fee,
        requiresPayment: result.fee > 0
      }
    });
  } catch (error) {
    // If caught by MySQL trigger (SQLSTATE 45000), return clean message
    if (error.sqlState === '45000' || error.message.includes('Engine Rule Violation')) {
      return res.status(422).json({
        success: false,
        triggerViolation: true,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * Retrieve active and historical reservations with complete relational graph
 * Supports filtering by userId, officeId, and status
 */
export async function getReservations(req, res, next) {
  try {
    const userId = req.query.userId || null;
    const officeId = req.query.officeId || null;
    const status = req.query.status || null;

    let sql = `
      SELECT 
        r.reservation_id,
        r.user_id,
        r.reservation_date,
        r.slot_time,
        r.status AS reservation_status,
        r.notes,
        r.location_override,
        r.created_at,
        u.email AS user_email,
        u.user_role,
        p.full_name AS student_name,
        p.student_or_visitor_id,
        p.department_or_affiliation,
        o.office_id,
        o.office_code,
        o.name AS office_name,
        o.desk_directions,
        b.name AS building_name,
        f.room_number,
        f.floor_number,
        i.issue_id,
        i.issue_name,
        i.standard_fee,
        t.transaction_id,
        t.payment_status,
        t.payment_method,
        t.reference_no
      FROM office_reservations r
      INNER JOIN user_accounts u ON r.user_id = u.user_id
      LEFT JOIN user_profiles p ON u.user_id = p.user_id
      INNER JOIN offices o ON r.office_id = o.office_id
      INNER JOIN facilities f ON o.facility_id = f.facility_id
      INNER JOIN buildings b ON f.building_id = b.building_id
      INNER JOIN issues i ON r.issue_id = i.issue_id
      LEFT JOIN transactions t ON r.reservation_id = t.reservation_id
    `;
    
    const conditions = [];
    const params = [];

    if (userId) {
      conditions.push('r.user_id = ?');
      params.push(userId);
    }

    if (officeId) {
      conditions.push('r.office_id = ?');
      params.push(officeId);
    }

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY r.reservation_id DESC LIMIT 100';

    const { rows } = await executeQuery(sql, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update reservation details or status (Full CRUD Support with RBAC)
 * Admin: Can edit all reservations across any office
 * Staff: Can ONLY edit reservations belonging to their assigned office
 */
export async function updateReservation(req, res, next) {
  try {
    const reservationId = parseInt(req.params.id, 10);
    const {
      status,
      reservationDate,
      slotTime,
      notes,
      locationOverride,
      requesterRole = 'STAFF',
      requesterOfficeId = null,
      requesterUserId = null
    } = req.body;

    // Check if reservation exists
    const { rows: existingRows } = await executeQuery(`
      SELECT r.reservation_id, r.user_id, r.office_id, r.status, o.name AS office_name
      FROM office_reservations r
      INNER JOIN offices o ON r.office_id = o.office_id
      WHERE r.reservation_id = ?
    `, [reservationId]);

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Reservation ID #${reservationId} was not found.`
      });
    }

    const reservation = existingRows[0];

    // RBAC: Staff can only edit reservations belonging to their assigned office
    if (requesterRole === 'STAFF') {
      if (!requesterOfficeId || parseInt(requesterOfficeId, 10) !== parseInt(reservation.office_id, 10)) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: Staff members can only edit reservations for their own assigned office (${reservation.office_name}).`
        });
      }
    } else if (requesterRole === 'STUDENT' || requesterRole === 'FACULTY') {
      // Students/Faculty can only cancel their own reservations
      if (!requesterUserId || parseInt(requesterUserId, 10) !== parseInt(reservation.user_id, 10)) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied: You may only modify your own reservations.'
        });
      }
    } else if (requesterRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Insufficient privileges.'
      });
    }

    await executeQuery(`
      UPDATE office_reservations 
      SET 
        status = COALESCE(?, status),
        reservation_date = COALESCE(?, reservation_date),
        slot_time = COALESCE(?, slot_time),
        notes = COALESCE(?, notes),
        location_override = COALESCE(?, location_override)
      WHERE reservation_id = ?
    `, [
      status || null,
      reservationDate || null,
      slotTime || null,
      notes !== undefined ? notes : null,
      locationOverride !== undefined ? locationOverride : null,
      reservationId
    ]);

    res.json({
      success: true,
      message: 'Reservation updated successfully. Automated trigger trg_reservations_audit_update executed.'
    });
  } catch (error) {
    if (error.sqlState === '45000' || error.message.includes('Engine Rule Violation')) {
      return res.status(422).json({
        success: false,
        triggerViolation: true,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * Delete a reservation record (Full CRUD Support with RBAC)
 * Admin: Can delete any reservation
 * Staff: Can ONLY delete reservations belonging to their assigned office
 */
export async function deleteReservation(req, res, next) {
  try {
    const reservationId = parseInt(req.params.id, 10);
    const requesterRole = req.query.requesterRole || req.body?.requesterRole || 'STAFF';
    const requesterOfficeId = req.query.requesterOfficeId || req.body?.requesterOfficeId || null;

    // Check if reservation exists
    const { rows: existingRows } = await executeQuery(`
      SELECT r.reservation_id, r.user_id, r.office_id, r.status, o.name AS office_name
      FROM office_reservations r
      INNER JOIN offices o ON r.office_id = o.office_id
      WHERE r.reservation_id = ?
    `, [reservationId]);

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Reservation ID #${reservationId} was not found.`
      });
    }

    const reservation = existingRows[0];

    // RBAC: Staff can only delete reservations for their own office
    if (requesterRole === 'STAFF') {
      if (!requesterOfficeId || parseInt(requesterOfficeId, 10) !== parseInt(reservation.office_id, 10)) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: Staff members can only delete reservations for their own assigned office (${reservation.office_name}).`
        });
      }
    } else if (requesterRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only staff and administrators can remove reservation records.'
      });
    }

    await executeQuery('DELETE FROM office_reservations WHERE reservation_id = ?', [reservationId]);

    res.json({
      success: true,
      message: 'Reservation record deleted successfully. Automated trigger trg_reservations_audit_delete executed.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel a reservation (legacy patch endpoint)
 */
export async function cancelReservation(req, res, next) {
  try {
    const reservationId = parseInt(req.params.id, 10);
    await executeQuery(
      'UPDATE office_reservations SET status = "CANCELLED" WHERE reservation_id = ?',
      [reservationId]
    );

    res.json({
      success: true,
      message: 'Reservation cancelled successfully. Automated trigger trg_reservations_audit_update executed.'
    });
  } catch (error) {
    next(error);
  }
}
