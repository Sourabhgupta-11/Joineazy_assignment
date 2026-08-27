const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createAssignment,
  updateAssignment,
  listAssignments,
  getAssignment,
} = require('../controllers/assignment.controller');
const {
  createAssignmentRules,
  listAssignmentsQueryRules,
  handleValidation,
} = require('../middleware/validators');

router.use(authenticate);

router.post('/', authorize('admin'), createAssignmentRules, handleValidation, createAssignment);
router.put('/:id', authorize('admin'), updateAssignment);
router.get('/', listAssignmentsQueryRules, handleValidation, listAssignments);
router.get('/:id', getAssignment);

module.exports = router;