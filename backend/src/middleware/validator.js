const { body, param, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('name must be 2-150 characters.'),
  body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 100 })
    .withMessage('password must be at least 8 characters.'),
  body('role').isIn(['student', 'admin']).withMessage("role must be 'student' or 'admin'."),
  body('studentId')
    .if(body('role').equals('student'))
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('studentId is required for student accounts.'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('password is required.'),
];

const createGroupRules = [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Group name must be 2-150 characters.'),
];

const addMemberRules = [
  body('identifier')
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Provide a valid student email or student ID.'),
];

const groupIdParamRule = [param('id').isInt({ min: 1 }).withMessage('Invalid group id.')];

const createAssignmentRules = [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('title must be 2-200 characters.'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 5000 }),
  body('dueDate').isISO8601().withMessage('dueDate must be a valid date.').toDate(),
  body('onedriveLink')
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('onedriveLink must be a valid http(s) URL.'),
  body('targetType').optional().isIn(['all', 'group']).withMessage("targetType must be 'all' or 'group'."),
  body('groupIds')
    .if(body('targetType').equals('group'))
    .isArray({ min: 1 })
    .withMessage('groupIds must be a non-empty array when targetType is "group".'),
  body('groupIds.*').optional().isInt({ min: 1 }).withMessage('Each groupId must be a positive integer.'),
];


const confirmSubmissionRules = [
  param('assignmentId').isInt({ min: 1 }).withMessage('Invalid assignment id.'),
  param('groupId').isInt({ min: 1 }).withMessage('Invalid group id.'),
  body('confirm').equals('true').withMessage('confirm must be explicitly set to true.').bail(),
];

module.exports = {
  handleValidation,
  registerRules,
  loginRules,
  createGroupRules,
  addMemberRules,
  groupIdParamRule,
  createAssignmentRules,
  confirmSubmissionRules,
};