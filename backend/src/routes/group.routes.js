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
  removeMember,
} = require('../controllers/group.controller');
const {
  createInvite,
  listGroupInvites,
  cancelInvite,
  myInvites,
  acceptInvite,
  declineInvite,
} = require('../controllers/groupInvite.controller');
const {
  createGroupRules,
  inviteRules,
  groupIdParamRule,
  renameGroupRules,
  handleValidation,
} = require('../middleware/validator');

router.use(authenticate);

router.post('/', authorize('student'), createGroupRules, handleValidation, createGroup);
router.get('/mine', authorize('student'), myGroups);
router.get('/', authorize('admin'), listAllGroups);

router.get('/invites/mine', authorize('student'), myInvites);
router.post('/invites/:inviteId/accept', authorize('student'), acceptInvite);
router.post('/invites/:inviteId/decline', authorize('student'), declineInvite);

router.get('/:id', groupIdParamRule, handleValidation, getGroup);
router.put('/:id', authorize('student'), renameGroupRules, handleValidation, renameGroup);
router.delete('/:id', authorize('student'), groupIdParamRule, handleValidation, deleteGroup);

router.post(
  '/:id/invites',
  authorize('student'),
  groupIdParamRule,
  inviteRules,
  handleValidation,
  createInvite
);
router.get('/:id/invites', authorize('student'), groupIdParamRule, handleValidation, listGroupInvites);
router.delete('/:id/invites/:inviteId', authorize('student'), groupIdParamRule, handleValidation, cancelInvite);

router.delete('/:id/members/:userId', authorize('student'), groupIdParamRule, handleValidation, removeMember);

module.exports = router;