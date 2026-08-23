const db = require('../config/db');

async function assertMembership(groupId, userId) {
  const membership = await db.query(
    'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  return membership.rows.length > 0;
}

async function confirmSubmission(req, res) {
  try {
    const { assignmentId, groupId } = req.params;
    const { confirm } = req.body;

    if (confirm !== true) {
      return res.status(400).json({message: 'Submission must be explicitly confirmed (confirm: true)'});
    }

    const isMember = await assertMembership(groupId, req.user.id);
    if (!isMember) {
      return res.status(403).json({message: 'You must be a member of this group to confirm submission'});
    }

    const existing = await db.query(
      'SELECT * FROM submissions WHERE assignment_id = $1 AND group_id = $2',
      [assignmentId, groupId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: 'This assignment was not assigned to your group, so there is nothing to confirm.',
      });
    }

    const result = await db.query(
      `UPDATE submissions
       SET status = 'confirmed', confirmed_by = $1, confirmed_at = NOW()
       WHERE assignment_id = $2 AND group_id = $3
       RETURNING *`,
      [req.user.id, assignmentId, groupId]
    );

    return res.json({submission: result.rows[0] });
  } catch (err) {
    console.error('Confirm submission error:', err);
    return res.status(500).json({message: 'Failed to confirm submission'});
  }
}

async function getGroupSubmissions(req, res) {
  try {
    const { groupId } = req.params;

    if (req.user.role === 'student') {
      const isMember = await assertMembership(groupId, req.user.id);
      if (!isMember) {
        return res.status(403).json({message: 'You are not a member of this group'});
      }
    }

    const result = await db.query(
      `SELECT s.*, a.title, a.due_date, a.onedrive_link
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       WHERE s.group_id = $1
       ORDER BY a.due_date ASC`,
      [groupId]
    );

    const total = result.rows.length;
    const confirmed = result.rows.filter((r) => r.status === 'confirmed').length;
    const progressPercent = total === 0 ? 0 : Math.round((confirmed / total) * 100);

    return res.json({submissions: result.rows, progress: { total, confirmed, progressPercent } });
  } catch (err) {
    console.error('Get group submissions error:', err);
    return res.status(500).json({message: 'Failed to fetch group submissions'});
  }
}

async function getAssignmentSubmissions(req, res) {
  try {
    const { assignmentId } = req.params;

    const result = await db.query(
      `SELECT s.*, g.name AS group_name,
              (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count
       FROM submissions s
       JOIN groups g ON g.id = s.group_id
       WHERE s.assignment_id = $1
       ORDER BY g.name ASC`,
      [assignmentId]
    );

    const total = result.rows.length;
    const confirmed = result.rows.filter((r) => r.status === 'confirmed').length;

    return res.json({
      submissions: result.rows,
      summary: { total, confirmed, pending: total - confirmed },
    });
  } catch (err) {
    console.error('Get assignment submissions error:', err);
    return res.status(500).json({message: 'Failed to fetch assignment submissions'});
  }
}

module.exports = { confirmSubmission, getGroupSubmissions, getAssignmentSubmissions };
