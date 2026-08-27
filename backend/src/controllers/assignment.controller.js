const db = require('../config/db');

async function createAssignment(req, res) {
  const client = await db.pool.connect();
  try {
    const { courseId, title, description, dueDate, onedriveLink, submissionType, targetType, groupIds } =
      req.body;

    if (!courseId || !title || !dueDate || !onedriveLink || !submissionType) {
      return res
        .status(400)
        .json({ message: 'courseId, title, dueDate, onedriveLink and submissionType are required.' });
    }

    const courseResult = await client.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    if (courseResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'You do not teach this course.' });
    }

    const finalTargetType = targetType === 'group' ? 'group' : 'all';
    if (submissionType === 'group' && finalTargetType === 'group' && (!Array.isArray(groupIds) || groupIds.length === 0)) {
      return res.status(400).json({ message: 'groupIds must be provided when targetType is "group".' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO assignments
         (course_id, title, description, due_date, onedrive_link, submission_type, target_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        courseId,
        title,
        description || null,
        dueDate,
        onedriveLink,
        submissionType,
        submissionType === 'group' ? finalTargetType : 'all',
        req.user.id,
      ]
    );
    const assignment = result.rows[0];

    if (submissionType === 'individual') {
      const enrolled = await client.query(
        'SELECT student_id FROM course_enrollments WHERE course_id = $1',
        [courseId]
      );
      for (const row of enrolled.rows) {
        await client.query(
          `INSERT INTO submissions (assignment_id, student_id, status)
           VALUES ($1, $2, 'pending')
           ON CONFLICT (assignment_id, student_id) DO NOTHING`,
          [assignment.id, row.student_id]
        );
      }
    } else {
      let targetGroupIds = [];
      if (finalTargetType === 'group') {
        for (const gid of groupIds) {
          await client.query(
            'INSERT INTO assignment_groups (assignment_id, group_id) VALUES ($1, $2)',
            [assignment.id, gid]
          );
        }
        targetGroupIds = groupIds;
      } else {
        const allGroups = await client.query('SELECT id FROM groups');
        targetGroupIds = allGroups.rows.map((g) => g.id);
      }

      for (const gid of targetGroupIds) {
        await client.query(
          `INSERT INTO submissions (assignment_id, group_id, status)
           VALUES ($1, $2, 'pending')
           ON CONFLICT (assignment_id, group_id) DO NOTHING`,
          [assignment.id, gid]
        );
      }
    }

    await client.query('COMMIT');
    return res.status(201).json({ assignment });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create assignment error:', err);
    return res.status(500).json({ message: 'Failed to create assignment.' });
  } finally {
    client.release();
  }
}

async function updateAssignment(req, res) {
  try {
    const { id } = req.params;
    const { title, description, dueDate, onedriveLink } = req.body;

    const existing = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    if (existing.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'You did not create this assignment.' });
    }

    const result = await db.query(
      `UPDATE assignments
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           due_date = COALESCE($3, due_date),
           onedrive_link = COALESCE($4, onedrive_link),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, description, dueDate, onedriveLink, id]
    );

    return res.json({ assignment: result.rows[0] });
  } catch (err) {
    console.error('Update assignment error:', err);
    return res.status(500).json({ message: 'Failed to update assignment.' });
  }
}

async function listAssignments(req, res) {
  try {
    const { courseId, groupId } = req.query;

    if (req.user.role === 'admin') {
      if (courseId) {
        const course = await db.query('SELECT * FROM courses WHERE id = $1', [courseId]);
        if (course.rows.length === 0) {
          return res.status(404).json({ message: 'Course not found.' });
        }
        if (course.rows[0].created_by !== req.user.id) {
          return res.status(403).json({ message: 'You do not teach this course.' });
        }
        const result = await db.query(
          'SELECT * FROM assignments WHERE course_id = $1 ORDER BY due_date ASC',
          [courseId]
        );
        return res.json({ assignments: result.rows });
      }
      const result = await db.query(
        `SELECT a.* FROM assignments a
         JOIN courses c ON c.id = a.course_id
         WHERE c.created_by = $1
         ORDER BY a.due_date ASC`,
        [req.user.id]
      );
      return res.json({ assignments: result.rows });
    }

    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required.' });
    }

    const enrollment = await db.query(
      'SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2',
      [courseId, req.user.id]
    );
    if (enrollment.rows.length === 0) {
      return res.status(403).json({ message: 'You are not enrolled in this course.' });
    }

    if (groupId) {
      const membership = await db.query(
        'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, req.user.id]
      );
      if (membership.rows.length === 0) {
        return res.status(403).json({ message: 'You are not a member of this group.' });
      }

      const result = await db.query(
        `SELECT DISTINCT a.*
         FROM assignments a
         LEFT JOIN assignment_groups ag ON ag.assignment_id = a.id AND ag.group_id = $2
         WHERE a.course_id = $1
           AND (a.submission_type = 'individual' OR a.target_type = 'all' OR ag.group_id = $2)
         ORDER BY a.due_date ASC`,
        [courseId, groupId]
      );
      return res.json({ assignments: result.rows });
    }

    const result = await db.query(
      `SELECT * FROM assignments
       WHERE course_id = $1 AND (submission_type = 'individual' OR target_type = 'all')
       ORDER BY due_date ASC`,
      [courseId]
    );
    return res.json({ assignments: result.rows });
  } catch (err) {
    console.error('List assignments error:', err);
    return res.status(500).json({ message: 'Failed to fetch assignments.' });
  }
}

async function getAssignment(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    return res.json({ assignment: result.rows[0] });
  } catch (err) {
    console.error('Get assignment error:', err);
    return res.status(500).json({ message: 'Failed to fetch assignment.' });
  }
}

module.exports = { createAssignment, updateAssignment, listAssignments, getAssignment };