import { executeQuery } from '../config/db.js';

export async function getAllOffices(req, res, next) {
  try {
    const { rows: offices, durationMs } = await executeQuery(`
      SELECT 
        o.office_id,
        o.office_code,
        o.name AS office_name,
        o.email,
        o.phone,
        o.desk_directions,
        o.is_accepting_payments,
        o.is_accepting_reservations,
        f.facility_id,
        f.room_number,
        f.floor_number,
        f.name AS room_name,
        b.building_id,
        b.building_code,
        b.name AS building_name,
        b.latitude,
        b.longitude,
        fc.name AS category_name,
        fc.icon_name,
        fn_is_office_open_now(o.office_id) AS is_open_now
      FROM offices o
      INNER JOIN facilities f ON o.facility_id = f.facility_id
      INNER JOIN facility_categories fc ON f.category_id = fc.category_id
      INNER JOIN buildings b ON f.building_id = b.building_id
      ORDER BY o.name ASC
    `);

    res.json({
      success: true,
      count: offices.length,
      executionTimeMs: durationMs,
      data: offices
    });
  } catch (error) {
    next(error);
  }
}

export async function getOfficeDetails(req, res, next) {
  try {
    const officeId = parseInt(req.params.id, 10);

    // 1. Office profile
    const { rows: officeRows } = await executeQuery(`
      SELECT 
        o.office_id,
        o.office_code,
        o.name AS office_name,
        o.email,
        o.phone,
        o.desk_directions,
        o.is_accepting_payments,
        o.is_accepting_reservations,
        f.room_number,
        f.floor_number,
        b.building_code,
        b.name AS building_name,
        b.latitude,
        b.longitude,
        c.name AS campus_name,
        fn_is_office_open_now(o.office_id) AS is_open_now
      FROM offices o
      INNER JOIN facilities f ON o.facility_id = f.facility_id
      INNER JOIN buildings b ON f.building_id = b.building_id
      INNER JOIN campuses c ON b.campus_id = c.campus_id
      WHERE o.office_id = ?
    `, [officeId]);

    if (officeRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Office not found' });
    }

    // 2. Operating hours
    const { rows: hours } = await executeQuery(`
      SELECT day_of_week, open_time, close_time, is_closed
      FROM office_operating_hours
      WHERE office_id = ?
      ORDER BY day_of_week ASC
    `, [officeId]);

    // 3. Handled issues & mapped fees
    const { rows: mappedIssues } = await executeQuery(`
      SELECT 
        i.issue_id,
        i.issue_code,
        i.issue_name,
        i.description,
        i.standard_fee,
        i.requires_in_person,
        m.priority_level,
        m.resolution_guide,
        m.avg_resolution_minutes
      FROM issue_office_mappings m
      INNER JOIN issues i ON m.issue_id = i.issue_id
      WHERE m.office_id = ?
      ORDER BY m.priority_level ASC, i.issue_name ASC
    `, [officeId]);

    res.json({
      success: true,
      data: {
        ...officeRows[0],
        operatingHours: hours,
        issues: mappedIssues
      }
    });
  } catch (error) {
    next(error);
  }
}
