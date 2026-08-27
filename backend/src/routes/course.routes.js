const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createCourse,
  myCourses,
  enrollByCode,
  getCourse,
  getCourseStudents,
  getCourseAnalytics,
} = require('../controllers/course.controller');
const { createCourseRules, enrollCourseRules, handleValidation } = require('../middleware/validators');

router.use(authenticate);

router.post('/', authorize('admin'), createCourseRules, handleValidation, createCourse);
router.get('/mine', myCourses);
router.post('/enroll', authorize('student'), enrollCourseRules, handleValidation, enrollByCode);
router.get('/:id', getCourse);
router.get('/:id/students', authorize('admin'), getCourseStudents);
router.get('/:id/analytics', authorize('admin'), getCourseAnalytics);

module.exports = router;