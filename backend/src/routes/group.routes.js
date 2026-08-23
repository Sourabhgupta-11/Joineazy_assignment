const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {createGroup,myGroups,listAllGroups,getGroup,addMember,removeMember} = require('../controllers/group.controller');

router.use(authenticate);

router.post('/', authorize('student'), createGroup);
router.get('/mine', authorize('student'), myGroups);
router.get('/', authorize('admin'), listAllGroups);
router.get('/:id', getGroup);
router.post('/:id/members', authorize('student'), addMember);
router.delete('/:id/members/:userId', authorize('student'), removeMember);

module.exports = router;
