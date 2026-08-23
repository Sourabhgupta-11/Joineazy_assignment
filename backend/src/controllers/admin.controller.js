const db = require('../config/db');

async function getAnalytics(req, res) {
  try {
    const [studentsCount, groupsCount, assignmentsCount] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'student'"),
      db.query('SELECT COUNT(*)::int AS count FROM groups'),
      db.query('SELECT COUNT(*)::int AS count FROM assignments'),
    ]);

    const submissionTotals = await db.query(
      `SELECT status, COUNT(*)::int AS count FROM submissions GROUP BY status`
    );
    const totals = { confirmed: 0, pending: 0 };
    submissionTotals.rows.forEach((r) => {
      totals[r.status] = r.count;
    });

    const perAssignment = await db.query(
      `SELECT a.id, a.title, a.due_date,
              COUNT(s.*)::int AS total_groups,
              COUNT(*) FILTER (WHERE s.status = 'confirmed')::int AS confirmed_groups
       FROM assignments a
       LEFT JOIN submissions s ON s.assignment_id = a.id
       GROUP BY a.id, a.title, a.due_date
       ORDER BY a.due_date ASC`
    );

    const perGroup = await db.query(
      `SELECT g.id, g.name,
              COUNT(s.*)::int AS total_assignments,
              COUNT(*) FILTER (WHERE s.status = 'confirmed')::int AS confirmed_assignments
       FROM groups g
       LEFT JOIN submissions s ON s.group_id = g.id
       GROUP BY g.id, g.name
       ORDER BY g.name ASC`
    );

    return res.json({
      summary: {
        totalStudents: studentsCount.rows[0].count,
        totalGroups: groupsCount.rows[0].count,
        totalAssignments: assignmentsCount.rows[0].count,
        confirmedSubmissions: totals.confirmed || 0,
        pendingSubmissions: totals.pending || 0,
      },
      perAssignment: perAssignment.rows,
      perGroup: perGroup.rows,
    });
  }
  catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({message: 'Failed to compute analytics'});
  }
}

module.exports = { getAnalytics };
