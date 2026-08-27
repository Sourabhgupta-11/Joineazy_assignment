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
      return res.status(400).json({ message: 'Submission must be explicitly confirmed (confirm: true).' });
    }

    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found.' });
    }
    if (groupResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({
        message: 'Only the group leader can confirm submission for the whole group.',
      });
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
       SET status = 'confirmed',
           confirmed_by = $1,
           confirmed_at = NOW(),
           review_status = 'unchecked',
           feedback = NULL,
           reviewed_by = NULL,
           reviewed_at = NULL
       WHERE assignment_id = $2 AND group_id = $3
       RETURNING *`,
      [req.user.id, assignmentId, groupId]
    );

    return res.json({ submission: result.rows[0] });
  } catch (err) {
    console.error('Confirm submission error:', err);
    return res.status(500).json({ message: 'Failed to confirm submission.' });
  }
}

async function confirmIndividualSubmission(req, res) {
  try {
    const { assignmentId } = req.params;
    const { confirm } = req.body;

    if (confirm !== true) {
      return res.status(400).json({ message: 'Submission must be explicitly confirmed (confirm: true).' });
    }

    const assignmentResult = await db.query('SELECT * FROM assignments WHERE id = $1', [assignmentId]);
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    if (assignmentResult.rows[0].submission_type !== 'individual') {
      return res.status(400).json({ message: 'This assignment requires a group confirmation, not an individual one.' });
    }

    const existing = await db.query(
      'SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignmentId, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: 'This assignment is not on your list (are you enrolled in its course?), so there is nothing to confirm.',
      });
    }

    const result = await db.query(
      `UPDATE submissions
       SET status = 'confirmed',
           confirmed_by = $1,
           confirmed_at = NOW(),
           review_status = 'unchecked',
           feedback = NULL,
           reviewed_by = NULL,
           reviewed_at = NULL
       WHERE assignment_id = $2 AND student_id = $1
       RETURNING *`,
      [req.user.id, assignmentId]
    );

    return res.json({ submission: result.rows[0] });
  } catch (err) {
    console.error('Confirm individual submission error:', err);
    return res.status(500).json({ message: 'Failed to confirm submission.' });
  }
}

async function reviewSubmission(req, res) {
  try {
    const { assignmentId, groupId } = req.params;
    const { reviewStatus, feedback } = req.body;

    const existing = await db.query(
      'SELECT * FROM submissions WHERE assignment_id = $1 AND group_id = $2',
      [assignmentId, groupId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'No submission found for this assignment and group.' });
    }
    if (existing.rows[0].status !== 'confirmed') {
      return res.status(400).json({
        message: 'This group has not confirmed their submission yet, so there is nothing to review.',
      });
    }

    const result = await db.query(
      `UPDATE submissions
       SET review_status = $1, feedback = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE assignment_id = $4 AND group_id = $5
       RETURNING *`,
      [reviewStatus, reviewStatus === 'rejected' ? feedback : feedback || null, req.user.id, assignmentId, groupId]
    );

    return res.json({ submission: result.rows[0] });
  } catch (err) {
    console.error('Review submission error:', err);
    return res.status(500).json({ message: 'Failed to review submission.' });
  }
}

async function reviewIndividualSubmission(req, res) {
  try {
    const { assignmentId, studentId } = req.params;
    const { reviewStatus, feedback } = req.body;

    const existing = await db.query(
      'SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignmentId, studentId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'No submission found for this assignment and student.' });
    }
    if (existing.rows[0].status !== 'confirmed') {
      return res.status(400).json({
        message: 'This student has not confirmed their submission yet, so there is nothing to review.',
      });
    }

    const result = await db.query(
      `UPDATE submissions
       SET review_status = $1, feedback = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE assignment_id = $4 AND student_id = $5
       RETURNING *`,
      [reviewStatus, reviewStatus === 'rejected' ? feedback : feedback || null, req.user.id, assignmentId, studentId]
    );

    return res.json({ submission: result.rows[0] });
  } catch (err) {
    console.error('Review individual submission error:', err);
    return res.status(500).json({ message: 'Failed to review submission.' });
  }
}

async function getGroupSubmissions(req, res) {
  try {
    const { groupId } = req.params;

    if (req.user.role === 'student') {
      const isMember = await assertMembership(groupId, req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: 'You are not a member of this group.' });
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

    return res.json({ submissions: result.rows, progress: { total, confirmed, progressPercent } });
  } catch (err) {
    console.error('Get group submissions error:', err);
    return res.status(500).json({ message: 'Failed to fetch group submissions.' });
  }
}

async function getMySubmissions(req, res) {
  try {
    const { courseId } = req.query;
    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required.' });
    }

    const result = await db.query(
      `SELECT s.*, a.title, a.due_date, a.onedrive_link
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       WHERE s.student_id = $1 AND a.course_id = $2
       ORDER BY a.due_date ASC`,
      [req.user.id, courseId]
    );

    const total = result.rows.length;
    const confirmed = result.rows.filter((r) => r.status === 'confirmed').length;
    const progressPercent = total === 0 ? 0 : Math.round((confirmed / total) * 100);

    return res.json({ submissions: result.rows, progress: { total, confirmed, progressPercent } });
  } catch (err) {
    console.error('Get my submissions error:', err);
    return res.status(500).json({ message: 'Failed to fetch your submissions.' });
  }
}

async function getAssignmentSubmissions(req, res) {
  try {
    const { assignmentId } = req.params;

    const assignmentResult = await db.query('SELECT * FROM assignments WHERE id = $1', [assignmentId]);
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    const assignment = assignmentResult.rows[0];

    let result;
    if (assignment.submission_type === 'individual') {
      result = await db.query(
        `SELECT s.*, u.name AS student_name, u.student_id AS student_code
         FROM submissions s
         JOIN users u ON u.id = s.student_id
         WHERE s.assignment_id = $1
         ORDER BY u.name ASC`,
        [assignmentId]
      );
    } else {
      result = await db.query(
        `SELECT s.*, g.name AS group_name,
                (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count
         FROM submissions s
         JOIN groups g ON g.id = s.group_id
         WHERE s.assignment_id = $1
         ORDER BY g.name ASC`,
        [assignmentId]
      );
    }

    const total = result.rows.length;
    const confirmed = result.rows.filter((r) => r.status === 'confirmed').length;

    return res.json({
      submissionType: assignment.submission_type,
      submissions: result.rows,
      summary: { total, confirmed, pending: total - confirmed },
    });
  } catch (err) {
    console.error('Get assignment submissions error:', err);
    return res.status(500).json({ message: 'Failed to fetch assignment submissions.' });
  }
}

module.exports = {
  confirmSubmission,
  confirmIndividualSubmission,
  reviewSubmission,
  reviewIndividualSubmission,
  getGroupSubmissions,
  getMySubmissions,
  getAssignmentSubmissions,
};