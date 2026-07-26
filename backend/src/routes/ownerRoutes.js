const express = require('express');
const router = express.Router();
const { getOwnerDashboardStats } = require('../controllers/ownerController');
const { protect } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');

router.use(protect, requireTenant);

router.get('/dashboard-stats', getOwnerDashboardStats);

module.exports = router;
