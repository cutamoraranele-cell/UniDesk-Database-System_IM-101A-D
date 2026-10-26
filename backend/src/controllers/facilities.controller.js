import { executeQuery } from '../config/db.js';

export async function getAllFacilities(req, res, next) {
  try {
    const categoryFilter = req.query.category || null;
    let sql = `
      SELECT 
        f.facility_id,
        f.room_number,
        f.floor_number,
        f.name AS facility_name,
        f.description,
        f.is_public,
        fc.category_code,
        fc.name AS category_name,
        fc.icon_name,
        b.building_id,
        b.building_code,
        b.name AS building_name,
        b.latitude AS building_lat,
        b.longitude AS building_lng,
        c.name AS campus_name
      FROM facilities f
      INNER JOIN facility_categories fc ON f.category_id = fc.category_id
      INNER JOIN buildings b ON f.building_id = b.building_id
      INNER JOIN campuses c ON b.campus_id = c.campus_id
    `;
    const params = [];

    if (categoryFilter) {
      sql += ` WHERE fc.category_code = ?`;
      params.push(categoryFilter);
    }

    sql += ` ORDER BY b.building_code ASC, f.floor_number ASC, f.room_number ASC`;

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

export async function getFacilityCategories(req, res, next) {
  try {
    const { rows } = await executeQuery(`
      SELECT category_id, category_code, name, description, icon_name
      FROM facility_categories
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

export async function getCampusBuildings(req, res, next) {
  try {
    const { rows: buildings } = await executeQuery(`
      SELECT 
        b.building_id,
        b.building_code,
        b.name AS building_name,
        b.total_floors,
        b.latitude,
        b.longitude,
        c.name AS campus_name,
        COUNT(f.facility_id) AS total_facilities
      FROM buildings b
      INNER JOIN campuses c ON b.campus_id = c.campus_id
      LEFT JOIN facilities f ON b.building_id = f.building_id
      GROUP BY b.building_id, c.name
      ORDER BY b.name ASC
    `);

    res.json({
      success: true,
      data: buildings
    });
  } catch (error) {
    next(error);
  }
}
