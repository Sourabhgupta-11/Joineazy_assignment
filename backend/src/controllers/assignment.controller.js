const db = require('../config/db');

async function createAssignment(req, res) {
  const client = await db.pool.connect();
  try {
    const { title, description, dueDate, onedriveLink, targetType, groupIds } = req.body;

    if (!title || !dueDate || !onedriveLink) {
      return res.status(400).json({message: 'title, dueDate and onedriveLink are required'});
    }

    const finalTargetType = targetType === 'group' ? 'group' : 'all';
    if (finalTargetType === 'group' && (!Array.isArray(groupIds) || groupIds.length === 0)) {
      return res.status(400).json({message: 'groupIds must be provided when targetType is "group"'});
    }

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO assignments (title, description, due_date, onedrive_link, target_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description || null, dueDate, onedriveLink, finalTargetType, req.user.id]
    );
    const assignment = result.rows[0];

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

    await client.query('COMMIT');
    return res.status(201).json({assignment });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create assignment error:', err);
    return res.status(500).json({message: 'Failed to create assignment'});
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
      return res.status(404).json({message: 'Assignment not found'});
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

    return res.json({assignment: result.rows[0] });
  } catch (err) {
    console.error('Update assignment error:', err);
    return res.status(500).json({message: 'Failed to update assignment'});
  }
}

async function listAssignments(req, res) {
  try {
    if (req.user.role === 'admin') {
      const result = await db.query('SELECT * FROM assignments ORDER BY due_date ASC');
      return res.json({assignments: result.rows });
    }

    const result = await db.query(
      `SELECT DISTINCT a.*
       FROM assignments a
       LEFT JOIN assignment_groups ag ON ag.assignment_id = a.id
       LEFT JOIN group_members gm ON gm.group_id = ag.group_id AND gm.user_id = $1
       WHERE a.target_type = 'all' OR gm.user_id = $1
       ORDER BY a.due_date ASC`,
      [req.user.id]
    );
    return res.json({assignments: result.rows });
  } catch (err) {
    console.error('List assignments error:', err);
    return res.status(500).json({message: 'Failed to fetch assignments'});
  }
}

async function getAssignment(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({message: 'Assignment not found'});
    }
    return res.json({assignment: result.rows[0] });
  } catch (err) {
    console.error('Get assignment error:', err);
    return res.status(500).json({message: 'Failed to fetch assignment'});
  }
}

module.exports = { createAssignment, updateAssignment, listAssignments, getAssignment };
