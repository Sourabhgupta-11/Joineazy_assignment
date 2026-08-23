const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAnalytics } = require('../controllers/admin.controller');

router.use(authenticate, authorize('admin'));

router.get('/analytics', getAnalytics);

module.exports = router;
