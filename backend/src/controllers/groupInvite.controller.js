const db = require('../config/db');

async function requireLeader(req, res, groupId) {
  const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
  if (groupResult.rows.length === 0) {
    res.status(404).json({ message: 'Group not found.' });
    return null;
  }
  const group = groupResult.rows[0];
  if (group.created_by !== req.user.id) {
    res.status(403).json({ message: 'Only the group leader can manage invites.' });
    return null;
  }
  return group;
}

async function createInvite(req, res) {
  try {
    const { id: groupId } = req.params;
    const { identifier } = req.body;

    const group = await requireLeader(req, res, groupId);
    if (!group) return;

    const userResult = await db.query(
      `SELECT id, name, email, role, student_id FROM users
       WHERE (email = $1 OR student_id = $1) AND role = 'student'`,
      [identifier.trim()]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'No student found with that email or student ID.' });
    }
    const student = userResult.rows[0];

    const alreadyMember = await db.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, student.id]
    );
    if (alreadyMember.rows.length > 0) {
      return res.status(409).json({ message: 'This student is already a member of this group.' });
    }

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

    const existingPending = await db.query(
      `SELECT 1 FROM group_invites WHERE group_id = $1 AND invited_user_id = $2 AND status = 'pending'`,
      [groupId, student.id]
    );
    if (existingPending.rows.length > 0) {
      return res.status(409).json({ message: 'This student already has a pending invite to this group.' });
    }

    const result = await db.query(
      `INSERT INTO group_invites (group_id, invited_user_id, invited_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [groupId, student.id, req.user.id]
    );

    return res.status(201).json({ message: 'Invite sent.', invite: result.rows[0], student });
  } catch (err) {
    console.error('Create invite error:', err);
    return res.status(500).json({ message: 'Failed to send invite.' });
  }
}

async function listGroupInvites(req, res) {
  try {
    const { id: groupId } = req.params;
    const group = await requireLeader(req, res, groupId);
    if (!group) return;

    const result = await db.query(
      `SELECT gi.*, u.name AS invitee_name, u.email AS invitee_email, u.student_id AS invitee_student_id
       FROM group_invites gi
       JOIN users u ON u.id = gi.invited_user_id
       WHERE gi.group_id = $1 AND gi.status = 'pending'
       ORDER BY gi.created_at DESC`,
      [groupId]
    );

    return res.json({ invites: result.rows });
  } catch (err) {
    console.error('List group invites error:', err);
    return res.status(500).json({ message: 'Failed to fetch invites.' });
  }
}

async function cancelInvite(req, res) {
  try {
    const { id: groupId, inviteId } = req.params;
    const group = await requireLeader(req, res, groupId);
    if (!group) return;

    const result = await db.query(
      `DELETE FROM group_invites WHERE id = $1 AND group_id = $2 AND status = 'pending' RETURNING id`,
      [inviteId, groupId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No pending invite found to cancel.' });
    }

    return res.json({ message: 'Invite cancelled.' });
  } catch (err) {
    console.error('Cancel invite error:', err);
    return res.status(500).json({ message: 'Failed to cancel invite.' });
  }
}

async function myInvites(req, res) {
  try {
    const result = await db.query(
      `SELECT gi.*, g.name AS group_name, u.name AS invited_by_name
       FROM group_invites gi
       JOIN groups g ON g.id = gi.group_id
       JOIN users u ON u.id = gi.invited_by
       WHERE gi.invited_user_id = $1 AND gi.status = 'pending'
       ORDER BY gi.created_at DESC`,
      [req.user.id]
    );

    return res.json({ invites: result.rows });
  } catch (err) {
    console.error('My invites error:', err);
    return res.status(500).json({ message: 'Failed to fetch your invites.' });
  }
}

async function acceptInvite(req, res) {
  const client = await db.pool.connect();
  try {
    const { inviteId } = req.params;

    const inviteResult = await client.query('SELECT * FROM group_invites WHERE id = $1', [inviteId]);
    if (inviteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Invite not found.' });
    }
    const invite = inviteResult.rows[0];

    if (invite.invited_user_id !== req.user.id) {
      return res.status(403).json({ message: 'This invite is not addressed to you.' });
    }
    if (invite.status !== 'pending') {
      return res.status(409).json({ message: 'This invite has already been responded to.' });
    }

    const inOtherGroup = await client.query(
      'SELECT 1 FROM group_members WHERE user_id = $1',
      [req.user.id]
    );
    if (inOtherGroup.rows.length > 0) {
      return res.status(409).json({
        message: 'You are already a member of a group. Leave it before accepting a new invite.',
      });
    }

    await client.query('BEGIN');
    await client.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [
      invite.group_id,
      req.user.id,
    ]);
    await client.query(
      `UPDATE group_invites SET status = 'accepted', responded_at = NOW() WHERE id = $1`,
      [inviteId]
    );
    await client.query('COMMIT');

    const groupResult = await client.query('SELECT * FROM groups WHERE id = $1', [invite.group_id]);
    return res.json({ message: 'Invite accepted.', group: groupResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Accept invite error:', err);
    return res.status(500).json({ message: 'Failed to accept invite.' });
  } finally {
    client.release();
  }
}

async function declineInvite(req, res) {
  try {
    const { inviteId } = req.params;

    const inviteResult = await db.query('SELECT * FROM group_invites WHERE id = $1', [inviteId]);
    if (inviteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Invite not found.' });
    }
    const invite = inviteResult.rows[0];

    if (invite.invited_user_id !== req.user.id) {
      return res.status(403).json({ message: 'This invite is not addressed to you.' });
    }
    if (invite.status !== 'pending') {
      return res.status(409).json({ message: 'This invite has already been responded to.' });
    }

    await db.query(`UPDATE group_invites SET status = 'declined', responded_at = NOW() WHERE id = $1`, [
      inviteId,
    ]);

    return res.json({ message: 'Invite declined.' });
  } catch (err) {
    console.error('Decline invite error:', err);
    return res.status(500).json({ message: 'Failed to decline invite.' });
  }
}

module.exports = { createInvite, listGroupInvites, cancelInvite, myInvites, acceptInvite, declineInvite };