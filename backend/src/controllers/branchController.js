const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/responseHandler');
const Branch = require('../models/Branch');
const Restaurant = require('../models/Restaurant');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Get All Branches for Logged-In Restaurant
// @route   GET /api/branches
// @access  Private (Owner / Super Admin)
const getBranches = asyncHandler(async (req, res) => {
  const restaurantId = req.user.role === 'SUPER_ADMIN' ? req.query.restaurantId : req.restaurantId;

  if (!restaurantId) {
    return res.status(400).json({ success: false, message: 'Restaurant ID is required.' });
  }

  const branches = await Branch.find({ restaurant: restaurantId }).sort({ createdAt: -1 });
  return sendResponse(res, 200, 'Branches fetched successfully', branches);
});

// @desc    Create New Branch (Checking maxBranches Limit)
// @route   POST /api/branches
// @access  Private (Owner)
const createBranch = asyncHandler(async (req, res) => {
  const { name, address, phone, isMain } = req.body;
  const restaurantId = req.restaurantId;

  if (!name || !address || !phone) {
    return res.status(400).json({ success: false, message: 'Please provide branch name, address, and phone.' });
  }

  // 1. Check current branch count vs maxBranches limit
  const restaurant = await Restaurant.findById(restaurantId);
  const currentBranchCount = await Branch.countDocuments({ restaurant: restaurantId });

  if (currentBranchCount >= restaurant.maxBranches) {
    return res.status(400).json({
      success: false,
      message: `Branch limit reached! Your subscription allows a maximum of ${restaurant.maxBranches} branches.`
    });
  }

  let logoUrl = '';
  let coverUrl = '';

  if (req.files?.logo) {
    const uploadedLogo = await uploadToCloudinary(req.files.logo[0].buffer, 'branches/logos');
    logoUrl = uploadedLogo.secure_url;
  }

  if (req.files?.coverImage) {
    const uploadedCover = await uploadToCloudinary(req.files.coverImage[0].buffer, 'branches/covers');
    coverUrl = uploadedCover.secure_url;
  }

  const branch = new Branch({
    restaurant: restaurantId,
    name,
    address,
    phone,
    logo: logoUrl,
    coverImage: coverUrl,
    isMain: isMain === 'true' || isMain === true
  });

  await branch.save();
  return sendResponse(res, 201, 'Branch created successfully', branch);
});

// @desc    Update Branch
// @route   PUT /api/branches/:id
// @access  Private (Owner)
const updateBranch = asyncHandler(async (req, res) => {
  const { name, address, phone, status, isMain } = req.body;

  const branch = await Branch.findOne({ _id: req.params.id, restaurant: req.restaurantId });
  if (!branch) {
    return res.status(404).json({ success: false, message: 'Branch not found or access denied.' });
  }

  if (name) branch.name = name;
  if (address) branch.address = address;
  if (phone) branch.phone = phone;
  if (status) branch.status = status;
  if (isMain !== undefined) branch.isMain = isMain === 'true' || isMain === true;

  if (req.files?.logo) {
    const uploadedLogo = await uploadToCloudinary(req.files.logo[0].buffer, 'branches/logos');
    branch.logo = uploadedLogo.secure_url;
  }

  if (req.files?.coverImage) {
    const uploadedCover = await uploadToCloudinary(req.files.coverImage[0].buffer, 'branches/covers');
    branch.coverImage = uploadedCover.secure_url;
  }

  await branch.save();
  return sendResponse(res, 200, 'Branch updated successfully', branch);
});

// @desc    Delete Branch
// @route   DELETE /api/branches/:id
// @access  Private (Owner)
const deleteBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findOne({ _id: req.params.id, restaurant: req.restaurantId });
  if (!branch) {
    return res.status(404).json({ success: false, message: 'Branch not found or access denied.' });
  }

  if (branch.isMain) {
    return res.status(400).json({ success: false, message: 'Cannot delete the Main Branch.' });
  }

  await Branch.findByIdAndDelete(branch._id);
  return sendResponse(res, 200, 'Branch deleted successfully.');
});

module.exports = {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch
};
