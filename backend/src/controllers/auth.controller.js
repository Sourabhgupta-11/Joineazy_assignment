const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { signToken } = require('../utils/jwt');

async function register(req, res) {
  try {
    const { name, email, password, role, studentId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({message: 'name, email, password and role are required'});
    }

    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({message: "role must be 'student' or 'admin'"});
    }

    if (role === 'student' && !studentId) {
      return res.status(400).json({message: 'studentId is required for student accounts'});
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({message: 'An account with this email already exists'});
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, student_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, student_id, created_at`,
      [name, email, passwordHash, role, role === 'student' ? studentId : null]
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id, role: user.role, name: user.name, email: user.email });

    return res.status(201).json({ user, token });
  }
  catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({message: 'Internal Server error while registering'});
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({message: 'email and password are required'});
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({message: 'Invalid email or password'});
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({message: 'Invalid password'});
    }

    const token = signToken({ id: user.id, role: user.role, name: user.name, email: user.email });

    delete user.password_hash;
    return res.json({ user, token });
  }
  catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Something went wrong while logging in.' });
  }
}

async function me(req, res) {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, student_id, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found'});
    }
    return res.json({ user: result.rows[0] });
  }
  catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({message: 'Internal Server Error'});
  }
}

module.exports = { register, login, me };
