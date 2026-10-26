import { executeQuery, executeProcedure } from '../config/db.js';

/**
 * High-performance keyword & issue lookup via database stored procedure
 */
export async function handleLookup(req, res, next) {
  try {
    const searchTerm = req.query.q || '';
    const { rows, durationMs } = await executeQuery('CALL sp_resolve_office_by_query(?)', [searchTerm]);
    
    // First result set contains the ranked matched offices and issues
    const results = rows[0] || [];

    res.json({
      success: true,
      query: searchTerm,
      count: results.length,
      executionTimeMs: durationMs,
      data: results
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve all issue catalog categories and problem definitions
 */
export async function getAllIssues(req, res, next) {
  try {
    const { rows: issues } = await executeQuery(`
      SELECT 
        i.issue_id,
        i.issue_code,
        i.issue_name,
        i.description,
        i.standard_fee,
        i.requires_in_person,
        ic.category_name,
        GROUP_CONCAT(k.keyword SEPARATOR ', ') AS keywords
      FROM issues i
      INNER JOIN issue_categories ic ON i.issue_category_id = ic.issue_category_id
      LEFT JOIN issue_search_keywords k ON i.issue_id = k.issue_id
      GROUP BY i.issue_id, ic.category_name
      ORDER BY i.issue_name ASC
    `);

    res.json({
      success: true,
      count: issues.length,
      data: issues
    });
  } catch (error) {
    next(error);
  }
}
