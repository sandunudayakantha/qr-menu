const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/responseHandler');
const QRCodeModel = require('../models/QRCode');
const Menu = require('../models/Menu');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const FeaturedSection = require('../models/FeaturedSection');

// @desc    Get Public Customer Menu by QR Code Token
// @route   GET /api/public/menu/:token
// @access  Public (Customer scanning QR)
const getPublicMenuByToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // 1. Find QR Code by Token
  const qrCode = await QRCodeModel.findOne({ token })
    .populate('restaurant', 'name logo coverImage status')
    .populate('branch', 'name address phone logo coverImage status')
    .populate('menu', 'name description status');

  if (!qrCode) {
    return res.status(404).json({ success: false, message: 'Invalid or expired QR code.' });
  }

  if (!qrCode.isActive) {
    return res.status(403).json({ success: false, message: 'This QR code is currently inactive.' });
  }

  if (qrCode.restaurant.status === 'SUSPENDED') {
    return res.status(403).json({ success: false, message: 'This restaurant service is currently unavailable.' });
  }

  if (qrCode.branch.status !== 'ACTIVE') {
    return res.status(403).json({ success: false, message: 'This branch is currently closed or inactive.' });
  }

  if (qrCode.menu.status !== 'ACTIVE') {
    return res.status(403).json({ success: false, message: 'This menu is currently inactive.' });
  }

  const branchId = qrCode.branch._id;
  const menuId = qrCode.menu._id;
  const restaurantId = qrCode.restaurant._id;

  // 2. Fetch Active Categories for the Branch
  const categories = await Category.find({
    restaurant: restaurantId,
    branch: branchId,
    status: 'ACTIVE'
  }).sort({ sortOrder: 1, createdAt: 1 });

  // 3. Fetch Menu Items with Product and Category details
  const menuItems = await MenuItem.find({
    menu: menuId,
    available: true
  })
    .populate({
      path: 'product',
      match: { available: true },
      populate: { path: 'category', select: 'name' }
    })
    .sort({ sortOrder: 1, createdAt: 1 });

  // Filter out any items where product might be unavailable/null
  const validMenuItems = menuItems.filter(item => item.product !== null);

  // 4. Fetch Active, Non-Expired Featured Sections
  const now = new Date();
  const rawFeaturedSections = await FeaturedSection.find({
    restaurant: restaurantId,
    branch: branchId,
    isActive: true,
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] }
    ]
  }).populate({
    path: 'products',
    match: { available: true },
    populate: { path: 'category', select: 'name' }
  });

  const featuredSections = rawFeaturedSections.map(sec => ({
    _id: sec._id,
    title: sec.title,
    description: sec.description,
    products: sec.products.filter(p => p !== null)
  }));

  return sendResponse(res, 200, 'Public menu loaded successfully', {
    tableName: qrCode.tableName || '',
    restaurant: {
      _id: qrCode.restaurant._id,
      name: qrCode.restaurant.name,
      logo: qrCode.restaurant.logo
    },
    branch: {
      _id: qrCode.branch._id,
      name: qrCode.branch.name,
      address: qrCode.branch.address,
      phone: qrCode.branch.phone,
      logo: qrCode.branch.logo,
      coverImage: qrCode.branch.coverImage
    },
    menu: {
      _id: qrCode.menu._id,
      name: qrCode.menu.name,
      description: qrCode.menu.description
    },
    categories,
    menuItems: validMenuItems.map(item => ({
      _id: item._id,
      price: item.price,
      available: item.available,
      sortOrder: item.sortOrder,
      product: item.product
    })),
    featuredSections
  });
});

module.exports = {
  getPublicMenuByToken
};
