const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  createRestaurant,
  getRestaurants,
  updateRestaurant,
  toggleRestaurantStatus,
  updateBranchLimit,
  resetRestaurantPassword,
  deleteRestaurant
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('SUPER_ADMIN'));

router.get('/dashboard-stats', getDashboardStats);
router.route('/restaurants')
  .post(createRestaurant)
  .get(getRestaurants);

router.route('/restaurants/:id')
  .put(updateRestaurant)
  .delete(deleteRestaurant);

router.patch('/restaurants/:id/status', toggleRestaurantStatus);
router.patch('/restaurants/:id/branch-limit', updateBranchLimit);
router.post('/restaurants/:id/reset-password', resetRestaurantPassword);

module.exports = router;
