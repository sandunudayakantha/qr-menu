const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/responseHandler');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Branch = require('../models/Branch');
const Product = require('../models/Product');
const Menu = require('../models/Menu');
const QRCode = require('../models/QRCode');

// @desc    Get Global Super Admin Dashboard Stats
// @route   GET /api/admin/dashboard-stats
// @access  Private (Super Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalRestaurants,
    totalBranches,
    totalProducts,
    totalMenus,
    totalQRCodes,
    activeRestaurants,
    suspendedRestaurants
  ] = await Promise.all([
    Restaurant.countDocuments(),
    Branch.countDocuments(),
    Product.countDocuments(),
    Menu.countDocuments(),
    QRCode.countDocuments(),
    Restaurant.countDocuments({ status: 'ACTIVE' }),
    Restaurant.countDocuments({ status: 'SUSPENDED' })
  ]);

  return sendResponse(res, 200, 'Dashboard statistics fetched', {
    totalRestaurants,
    totalBranches,
    totalProducts,
    totalMenus,
    totalQRCodes,
    activeRestaurants,
    suspendedRestaurants
  });
});

// @desc    Create Restaurant & Restaurant Owner Account
// @route   POST /api/admin/restaurants
// @access  Private (Super Admin)
const createRestaurant = asyncHandler(async (req, res) => {
  const { name, ownerName, ownerEmail, ownerPassword, maxBranches = 3 } = req.body;

  if (!name || !ownerName || !ownerEmail || !ownerPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide restaurant name, owner name, owner email, and owner password.'
    });
  }

  const existingUser = await User.findOne({ email: ownerEmail });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists.'
    });
  }

  // 1. Create Owner User
  const owner = new User({
    name: ownerName,
    email: ownerEmail,
    password: ownerPassword,
    role: 'RESTAURANT_OWNER'
  });
  await owner.save();

  // 2. Create Restaurant
  const restaurant = new Restaurant({
    name,
    owner: owner._id,
    maxBranches: Number(maxBranches) || 3
  });
  await restaurant.save();

  // Link restaurantId to owner
  owner.restaurantId = restaurant._id;
  await owner.save();

  // 3. Automatically create Main Branch
  const mainBranch = new Branch({
    restaurant: restaurant._id,
    name: 'Main Branch',
    address: 'Headquarters',
    phone: '+1 000 000 0000',
    isMain: true,
    status: 'ACTIVE'
  });
  await mainBranch.save();

  return sendResponse(res, 201, 'Restaurant created successfully', {
    restaurant,
    owner: {
      _id: owner._id,
      name: owner.name,
      email: owner.email
    },
    mainBranch
  });
});

// @desc    Get All Restaurants (Paginated & Searchable)
// @route   GET /api/admin/restaurants
// @access  Private (Super Admin)
const getRestaurants = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = req.query.search || '';

  const query = {};
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const total = await Restaurant.countDocuments(query);
  const restaurants = await Restaurant.find(query)
    .populate('owner', 'name email status')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Attach branch count for each restaurant
  const restaurantsWithCounts = await Promise.all(
    restaurants.map(async (rest) => {
      const branchCount = await Branch.countDocuments({ restaurant: rest._id });
      const menuCount = await Menu.countDocuments({ restaurant: rest._id });
      const qrCount = await QRCode.countDocuments({ restaurant: rest._id });
      return {
        ...rest.toObject(),
        branchCount,
        menuCount,
        qrCount
      };
    })
  );

  return sendResponse(res, 200, 'Restaurants fetched successfully', restaurantsWithCounts, {
    total,
    page,
    pages: Math.ceil(total / limit)
  });
});

// @desc    Update Restaurant Details
// @route   PUT /api/admin/restaurants/:id
// @access  Private (Super Admin)
const updateRestaurant = asyncHandler(async (req, res) => {
  const { name, maxBranches } = req.body;
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found.' });
  }

  if (name) restaurant.name = name;
  if (maxBranches !== undefined) restaurant.maxBranches = Number(maxBranches);

  await restaurant.save();
  return sendResponse(res, 200, 'Restaurant updated successfully', restaurant);
});

// @desc    Toggle Restaurant Status (Activate / Suspend)
// @route   PATCH /api/admin/restaurants/:id/status
// @access  Private (Super Admin)
const toggleRestaurantStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'ACTIVE' or 'SUSPENDED'
  if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value.' });
  }

  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found.' });
  }

  restaurant.status = status;
  await restaurant.save();

  // Also sync Owner account status
  await User.findByIdAndUpdate(restaurant.owner, { status });

  return sendResponse(res, 200, `Restaurant ${status === 'ACTIVE' ? 'activated' : 'suspended'} successfully`, restaurant);
});

// @desc    Update Restaurant Branch Limit
// @route   PATCH /api/admin/restaurants/:id/branch-limit
// @access  Private (Super Admin)
const updateBranchLimit = asyncHandler(async (req, res) => {
  const { maxBranches } = req.body;
  if (!maxBranches || Number(maxBranches) < 1) {
    return res.status(400).json({ success: false, message: 'Branch limit must be at least 1.' });
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    { maxBranches: Number(maxBranches) },
    { new: true }
  );

  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found.' });
  }

  return sendResponse(res, 200, 'Branch limit updated successfully', restaurant);
});

// @desc    Reset Restaurant Owner Password
// @route   POST /api/admin/restaurants/:id/reset-password
// @access  Private (Super Admin)
const resetRestaurantPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found.' });
  }

  const owner = await User.findById(restaurant.owner);
  if (!owner) {
    return res.status(404).json({ success: false, message: 'Restaurant owner user not found.' });
  }

  owner.password = newPassword;
  await owner.save();

  return sendResponse(res, 200, `Password for ${owner.email} reset successfully.`);
});

// @desc    Delete Restaurant
// @route   DELETE /api/admin/restaurants/:id
// @access  Private (Super Admin)
const deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found.' });
  }

  // Delete owner, branches, products, menus, QRs
  await Promise.all([
    User.findByIdAndDelete(restaurant.owner),
    Branch.deleteMany({ restaurant: restaurant._id }),
    Product.deleteMany({ restaurant: restaurant._id }),
    Menu.deleteMany({ restaurant: restaurant._id }),
    QRCode.deleteMany({ restaurant: restaurant._id }),
    Restaurant.findByIdAndDelete(restaurant._id)
  ]);

  return sendResponse(res, 200, 'Restaurant and associated data deleted successfully.');
});

module.exports = {
  getDashboardStats,
  createRestaurant,
  getRestaurants,
  updateRestaurant,
  toggleRestaurantStatus,
  updateBranchLimit,
  resetRestaurantPassword,
  deleteRestaurant
};
