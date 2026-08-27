const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createGroup,
  myGroups,
  listAllGroups,
  getGroup,
  renameGroup,
  deleteGroup,
  addMember,
  removeMember,
} = require('../controllers/group.controller');
const {
  createGroupRules,
  addMemberRules,
  groupIdParamRule,
  renameGroupRules,
  handleValidation,
} = require('../middleware/validators');

router.use(authenticate);

router.post('/', authorize('student'), createGroupRules, handleValidation, createGroup);
router.get('/mine', authorize('student'), myGroups);
router.get('/', authorize('admin'), listAllGroups);
router.get('/:id', groupIdParamRule, handleValidation, getGroup);
router.put('/:id', authorize('student'), renameGroupRules, handleValidation, renameGroup);
router.delete('/:id', authorize('student'), groupIdParamRule, handleValidation, deleteGroup);
router.post(
  '/:id/members',
  authorize('student'),
  groupIdParamRule,
  addMemberRules,
  handleValidation,
  addMember
);
router.delete('/:id/members/:userId', authorize('student'), groupIdParamRule, handleValidation, removeMember);

module.exports = router;