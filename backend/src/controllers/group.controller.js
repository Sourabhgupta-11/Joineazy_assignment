const db = require('../config/db');

// POST /api/groups  (student creates a group; creator is auto-added as a member)
async function createGroup(req, res) {
  const client = await db.pool.connect();
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    await client.query('BEGIN');

    const groupResult = await client.query(
      `INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *`,
      [name.trim(), req.user.id]
    );
    const group = groupResult.rows[0];

    await client.query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`,
      [group.id, req.user.id]
    );

    await client.query('COMMIT');
    return res.status(201).json({ group });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create group error:', err);
    return res.status(500).json({ message: 'Failed to create group.' });
  } finally {
    client.release();
  }
}

// GET /api/groups/mine  (groups the logged-in student belongs to)
async function myGroups(req, res) {
  try {
    const result = await db.query(
      `SELECT g.*, 
              (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id) AS member_count
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    return res.json({ groups: result.rows });
  } catch (err) {
    console.error('My groups error:', err);
    return res.status(500).json({ message: 'Failed to fetch groups.' });
  }
}

// GET /api/groups  (admin: list all groups with member details)
async function listAllGroups(req, res) {
  try {
    const groupsResult = await db.query(`SELECT * FROM groups ORDER BY created_at DESC`);
    const groups = groupsResult.rows;

    for (const group of groups) {
      const membersResult = await db.query(
        `SELECT u.id, u.name, u.email, u.student_id
         FROM group_members gm JOIN users u ON u.id = gm.user_id
         WHERE gm.group_id = $1`,
        [group.id]
      );
      group.members = membersResult.rows;
    }

    return res.json({ groups });
  } catch (err) {
    console.error('List groups error:', err);
    return res.status(500).json({ message: 'Failed to fetch groups.' });
  }
}

// GET /api/groups/:id  (view a single group with members - must be a member or admin)
async function getGroup(req, res) {
  try {
    const { id } = req.params;
    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [id]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found.' });
    }
    const group = groupResult.rows[0];

    if (req.user.role === 'student') {
      const membership = await db.query(
        'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      if (membership.rows.length === 0) {
        return res.status(403).json({ message: 'You are not a member of this group.' });
      }
    }

    const membersResult = await db.query(
      `SELECT u.id, u.name, u.email, u.student_id
       FROM group_members gm JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1`,
      [id]
    );
    group.members = membersResult.rows;

    return res.json({ group });
  } catch (err) {
    console.error('Get group error:', err);
    return res.status(500).json({ message: 'Failed to fetch group.' });
  }
}

// PUT /api/groups/:id  (rename a group; only the creator can)
async function renameGroup(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [id]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found.' });
    }
    const group = groupResult.rows[0];

    if (group.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Only the group creator can rename this group.' });
    }

    const result = await db.query('UPDATE groups SET name = $1 WHERE id = $2 RETURNING *', [
      name.trim(),
      id,
    ]);

    return res.json({ group: result.rows[0] });
  } catch (err) {
    console.error('Rename group error:', err);
    return res.status(500).json({ message: 'Failed to rename group.' });
  }
}

// DELETE /api/groups/:id  (delete a group entirely; only the creator can)
// Cascades to group_members, assignment_groups, and submissions via FK ON DELETE CASCADE.
async function deleteGroup(req, res) {
  try {
    const { id } = req.params;

    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [id]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found.' });
    }
    const group = groupResult.rows[0];

    if (group.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Only the group creator can delete this group.' });
    }

    await db.query('DELETE FROM groups WHERE id = $1', [id]);
    return res.json({ message: 'Group deleted successfully.' });
  } catch (err) {
    console.error('Delete group error:', err);
    return res.status(500).json({ message: 'Failed to delete group.' });
  }
}

// POST /api/groups/:id/members  (add a member by email or studentId)
// A student may only belong to one group at a time, so this rejects adding
// someone who is already a member of a different group.
async function addMember(req, res) {
  try {
    const { id } = req.params;
    const { identifier } = req.body; // email or student_id

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: 'Provide a student email or student ID to add.' });
    }

    // Only existing members (of a student group) may add others
    const membership = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ message: 'Only group members can add new members.' });
    }

    const userResult = await db.query(
      `SELECT id, name, email, role, student_id FROM users
       WHERE (email = $1 OR student_id = $1) AND role = 'student'`,
      [identifier.trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'No student found with that email or student ID.' });
    }

    const student = userResult.rows[0];

    const already = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, student.id]
    );
    if (already.rows.length > 0) {
      return res.status(409).json({ message: 'This student is already a member of this group.' });
    }

    // A student can only be in one group at a time. If they're already a member of
    // some other group, surface which one so the person adding them understands why.
    const inOtherGroup = await db.query(
      `SELECT g.name FROM group_members gm
       JOIN groups g ON g.id = gm.group_id
       WHERE gm.user_id = $1
       LIMIT 1`,
      [student.id]
    );
    if (inOtherGroup.rows.length > 0) {
      return res.status(409).json({
        message: `${student.name} is already a member of another group ("${inOtherGroup.rows[0].name}"). A student can only belong to one group at a time.`,
      });
    }

    await db.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [id, student.id]);

    return res.status(201).json({ message: 'Member added successfully.', member: student });
  } catch (err) {
    console.error('Add member error:', err);
    return res.status(500).json({ message: 'Failed to add member.' });
  }
}

// DELETE /api/groups/:id/members/:userId  (remove a member; only the group creator can)
async function removeMember(req, res) {
  try {
    const { id, userId } = req.params;

    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [id]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found.' });
    }
    const group = groupResult.rows[0];

    if (group.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Only the group creator can remove members.' });
    }

    if (Number(userId) === group.created_by) {
      return res.status(400).json({ message: 'The group creator cannot be removed.' });
    }

    await db.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [id, userId]);
    return res.json({ message: 'Member removed successfully.' });
  } catch (err) {
    console.error('Remove member error:', err);
    return res.status(500).json({ message: 'Failed to remove member.' });
  }
}

module.exports = {
  createGroup,
  myGroups,
  listAllGroups,
  getGroup,
  renameGroup,
  deleteGroup,
  addMember,
  removeMember,
};