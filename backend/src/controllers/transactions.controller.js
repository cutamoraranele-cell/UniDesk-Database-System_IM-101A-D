import { executeQuery } from '../config/db.js';

/**
 * Settle transaction fee using database stored procedure sp_process_office_payment
 */
export async function processPayment(req, res, next) {
  try {
    const {
      transactionId,
      paymentMethod = 'CAMPUS_WALLET',
      amountPaid
    } = req.body;

    if (!transactionId || amountPaid === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing mandatory fields: transactionId, amountPaid'
      });
    }

    // Call stored procedure
    await executeQuery(
      'CALL sp_process_office_payment(?, ?, ?, @p_code, @p_msg)',
      [transactionId, paymentMethod, amountPaid]
    );

    const { rows: outVars } = await executeQuery('SELECT @p_code AS code, @p_msg AS msg');
    const result = outVars[0];

    if (result.code !== 'SUCCESS') {
      return res.status(400).json({
        success: false,
        statusCode: result.code,
        message: result.msg
      });
    }

    // Fetch updated transaction and automatically confirmed reservation
    const { rows: txnDetails } = await executeQuery(`
      SELECT 
        t.transaction_id,
        t.amount,
        t.payment_method,
        t.payment_status,
        t.reference_no,
        t.paid_at,
        r.reservation_id,
        r.status AS reservation_status,
        o.name AS office_name,
        i.issue_name
      FROM transactions t
      LEFT JOIN office_reservations r ON t.reservation_id = r.reservation_id
      INNER JOIN offices o ON t.office_id = o.office_id
      INNER JOIN issues i ON t.issue_id = i.issue_id
      WHERE t.transaction_id = ?
    `, [transactionId]);

    res.json({
      success: true,
      statusCode: result.code,
      message: result.msg,
      data: txnDetails[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List transactions with filtering
 */
export async function getTransactions(req, res, next) {
  try {
    const status = req.query.status || null;
    let sql = `
      SELECT 
        t.transaction_id,
        t.reservation_id,
        t.amount,
        t.payment_method,
        t.payment_status,
        t.reference_no,
        t.paid_at,
        t.created_at,
        o.office_code,
        o.name AS office_name,
        i.issue_name,
        p.full_name AS payer_name,
        p.student_or_visitor_id
      FROM transactions t
      INNER JOIN offices o ON t.office_id = o.office_id
      INNER JOIN issues i ON t.issue_id = i.issue_id
      INNER JOIN user_accounts u ON t.user_id = u.user_id
      LEFT JOIN user_profiles p ON u.user_id = p.user_id
    `;
    const params = [];

    if (status) {
      sql += ` WHERE t.payment_status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY t.transaction_id DESC LIMIT 50`;

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
