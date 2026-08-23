const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {createAssignment,updateAssignment,listAssignments,getAssignment,} = require('../controllers/assignment.controller');

router.use(authenticate);

router.post('/', authorize('admin'), createAssignment);
router.put('/:id', authorize('admin'), updateAssignment);
router.get('/', listAssignments);
router.get('/:id', getAssignment);

module.exports = router;
