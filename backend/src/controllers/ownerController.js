const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/responseHandler');
const Product = require('../models/Product');
const Menu = require('../models/Menu');
const QRCode = require('../models/QRCode');
const Category = require('../models/Category');
const Branch = require('../models/Branch');
const FeaturedSection = require('../models/FeaturedSection');

// @desc    Get Owner Dashboard Statistics
// @route   GET /api/owner/dashboard-stats
// @access  Private (Owner)
const getOwnerDashboardStats = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const restaurantId = req.restaurantId;

  const branchFilter = branchId ? { restaurant: restaurantId, branch: branchId } : { restaurant: restaurantId };

  const [
    totalBranches,
    totalCategories,
    totalProducts,
    totalMenus,
    totalQRCodes,
    totalFeatured
  ] = await Promise.all([
    Branch.countDocuments({ restaurant: restaurantId }),
    Category.countDocuments(branchFilter),
    Product.countDocuments(branchFilter),
    Menu.countDocuments(branchFilter),
    QRCode.countDocuments(branchFilter),
    FeaturedSection.countDocuments(branchFilter)
  ]);

  return sendResponse(res, 200, 'Owner dashboard stats fetched', {
    totalBranches,
    totalCategories,
    totalProducts,
    totalMenus,
    totalQRCodes,
    totalFeatured,
    maxBranches: req.restaurant ? req.restaurant.maxBranches : 3
  });
});

module.exports = {
  getOwnerDashboardStats
};
