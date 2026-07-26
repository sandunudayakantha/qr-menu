const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  reorderMenuItems,
  removeMenuItem
} = require('../controllers/menuItemController');
const { protect } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');

router.use(protect, requireTenant);

router.route('/')
  .get(getMenuItems)
  .post(addMenuItem);

router.put('/reorder', reorderMenuItems);

router.route('/:id')
  .put(updateMenuItem)
  .delete(removeMenuItem);

module.exports = router;
