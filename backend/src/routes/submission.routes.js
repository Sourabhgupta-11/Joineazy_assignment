const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  confirmSubmission,
  confirmIndividualSubmission,
  reviewSubmission,
  reviewIndividualSubmission,
  getGroupSubmissions,
  getMySubmissions,
  getAssignmentSubmissions,
} = require('../controllers/submission.controller');
const {
  confirmSubmissionRules,
  confirmIndividualSubmissionRules,
  reviewSubmissionRules,
  reviewIndividualSubmissionRules,
  handleValidation,
} = require('../middleware/validator');

router.use(authenticate);

router.post(
  '/:assignmentId/groups/:groupId/confirm',
  authorize('student'),
  confirmSubmissionRules,
  handleValidation,
  confirmSubmission
);
router.put(
  '/:assignmentId/groups/:groupId/review',
  authorize('admin'),
  reviewSubmissionRules,
  handleValidation,
  reviewSubmission
);
router.get('/group/:groupId', getGroupSubmissions);

router.post(
  '/:assignmentId/confirm',
  authorize('student'),
  confirmIndividualSubmissionRules,
  handleValidation,
  confirmIndividualSubmission
);
router.put(
  '/:assignmentId/students/:studentId/review',
  authorize('admin'),
  reviewIndividualSubmissionRules,
  handleValidation,
  reviewIndividualSubmission
);
router.get('/mine', authorize('student'), getMySubmissions);

router.get('/assignment/:assignmentId', authorize('admin'), getAssignmentSubmissions);

module.exports = router;