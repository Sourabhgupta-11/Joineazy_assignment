const crypto = require('crypto');
const db = require('../config/db');

// Generates a short, human-shareable join code like "PHYS-4K9X".
function generateCourseCode(name) {
  const prefix = (name || 'CRS')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 4)
    .toUpperCase()
    .padEnd(3, 'X');
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `${prefix}-${suffix}`;
}

// POST /api/courses  (professor creates a course)
async function createCourse(req, res) {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Course name is required.' });
    }

    // Retry a couple of times in the rare case of a code collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCourseCode(name);
      try {
        const result = await db.query(
          `INSERT INTO courses (name, description, code, created_by)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [name.trim(), description || null, code, req.user.id]
        );
        return res.status(201).json({ course: result.rows[0] });
      } catch (err) {
        if (err.code === '23505') continue; // unique_violation on code, retry
        throw err;
      }
    }
    return res.status(500).json({ message: 'Failed to generate a unique course code, please try again.' });
  } catch (err) {
    console.error('Create course error:', err);
    return res.status(500).json({ message: 'Failed to create course.' });
  }
}

// GET /api/courses/mine  (professor: courses they teach; student: courses they're enrolled in)
async function myCourses(req, res) {
  try {
    if (req.user.role === 'admin') {
      const result = await db.query(
        `SELECT c.*,
                (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) AS student_count,
                (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id) AS assignment_count
         FROM courses c
         WHERE c.created_by = $1
         ORDER BY c.created_at DESC`,
        [req.user.id]
      );
      return res.json({ courses: result.rows });
    }

    const result = await db.query(
      `SELECT c.*, u.name AS professor_name,
              (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id) AS assignment_count
       FROM courses c
       JOIN course_enrollments ce ON ce.course_id = c.id
       JOIN users u ON u.id = c.created_by
       WHERE ce.student_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    return res.json({ courses: result.rows });
  } catch (err) {
    console.error('My courses error:', err);
    return res.status(500).json({ message: 'Failed to fetch courses.' });
  }
}

// POST /api/courses/enroll  (student self-enrolls using a course join code)
async function enrollByCode(req, res) {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'A course code is required.' });
    }

    const courseResult = await db.query('SELECT * FROM courses WHERE code = $1', [code.trim().toUpperCase()]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'No course found with that code.' });
    }
    const course = courseResult.rows[0];

    const already = await db.query(
      'SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2',
      [course.id, req.user.id]
    );
    if (already.rows.length > 0) {
      return res.status(409).json({ message: 'You are already enrolled in this course.' });
    }

    await db.query('INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2)', [
      course.id,
      req.user.id,
    ]);

    return res.status(201).json({ message: 'Enrolled successfully.', course });
  } catch (err) {
    console.error('Enroll error:', err);
    return res.status(500).json({ message: 'Failed to enroll in course.' });
  }
}

// GET /api/courses/:id  (course detail; professor who owns it, or an enrolled student)
async function getCourse(req, res) {
  try {
    const { id } = req.params;
    const courseResult = await db.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    const course = courseResult.rows[0];

    if (req.user.role === 'admin') {
      if (course.created_by !== req.user.id) {
        return res.status(403).json({ message: 'You do not teach this course.' });
      }
    } else {
      const enrolled = await db.query(
        'SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2',
        [id, req.user.id]
      );
      if (enrolled.rows.length === 0) {
        return res.status(403).json({ message: 'You are not enrolled in this course.' });
      }
    }

    return res.json({ course });
  } catch (err) {
    console.error('Get course error:', err);
    return res.status(500).json({ message: 'Failed to fetch course.' });
  }
}

// GET /api/courses/:id/students  (professor: roster with basic analytics)
async function getCourseStudents(req, res) {
  try {
    const { id } = req.params;
    const courseResult = await db.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    if (courseResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'You do not teach this course.' });
    }

    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.student_id, ce.enrolled_at
       FROM course_enrollments ce
       JOIN users u ON u.id = ce.student_id
       WHERE ce.course_id = $1
       ORDER BY u.name ASC`,
      [id]
    );

    return res.json({ students: result.rows });
  } catch (err) {
    console.error('Get course students error:', err);
    return res.status(500).json({ message: 'Failed to fetch course roster.' });
  }
}

// GET /api/courses/:id/analytics  (professor: submission stats for this course's assignments)
async function getCourseAnalytics(req, res) {
  try {
    const { id } = req.params;
    const courseResult = await db.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    if (courseResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'You do not teach this course.' });
    }

    const studentCount = await db.query(
      'SELECT COUNT(*)::int AS count FROM course_enrollments WHERE course_id = $1',
      [id]
    );

    const perAssignment = await db.query(
      `SELECT a.id, a.title, a.due_date, a.submission_type,
              COUNT(s.*)::int AS total,
              COUNT(*) FILTER (WHERE s.status = 'confirmed')::int AS confirmed,
              COUNT(*) FILTER (WHERE s.review_status = 'approved')::int AS approved,
              COUNT(*) FILTER (WHERE s.review_status = 'rejected')::int AS rejected
       FROM assignments a
       LEFT JOIN submissions s ON s.assignment_id = a.id
       WHERE a.course_id = $1
       GROUP BY a.id, a.title, a.due_date, a.submission_type
       ORDER BY a.due_date ASC`,
      [id]
    );

    return res.json({
      studentCount: studentCount.rows[0].count,
      assignmentCount: perAssignment.rows.length,
      perAssignment: perAssignment.rows,
    });
  } catch (err) {
    console.error('Get course analytics error:', err);
    return res.status(500).json({ message: 'Failed to fetch course analytics.' });
  }
}

module.exports = { createCourse, myCourses, enrollByCode, getCourse, getCourseStudents, getCourseAnalytics };