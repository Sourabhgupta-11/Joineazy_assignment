const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {confirmSubmission,getGroupSubmissions,getAssignmentSubmissions,} = require('../controllers/submission.controller');

router.use(authenticate);

router.post('/:assignmentId/groups/:groupId/confirm', authorize('student'), confirmSubmission);
router.get('/group/:groupId', getGroupSubmissions);
router.get('/assignment/:assignmentId', authorize('admin'), getAssignmentSubmissions);

module.exports = router;
