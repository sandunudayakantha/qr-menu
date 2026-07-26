const express = require('express');
const router = express.Router();
const {
  getFeaturedSections,
  createFeaturedSection,
  updateFeaturedSection,
  deleteFeaturedSection
} = require('../controllers/featuredController');
const { protect } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');

router.use(protect, requireTenant);

router.route('/')
  .get(getFeaturedSections)
  .post(createFeaturedSection);

router.route('/:id')
  .put(updateFeaturedSection)
  .delete(deleteFeaturedSection);

module.exports = router;
