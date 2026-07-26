const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/responseHandler');
const FeaturedSection = require('../models/FeaturedSection');

// @desc    Get Featured Sections for a Branch
// @route   GET /api/featured
// @access  Private (Owner)
const getFeaturedSections = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  if (!branchId) {
    return res.status(400).json({ success: false, message: 'Branch ID is required.' });
  }

  const sections = await FeaturedSection.find({
    restaurant: req.restaurantId,
    branch: branchId
  })
    .populate({
      path: 'products',
      populate: { path: 'category', select: 'name' }
    })
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, 'Featured sections fetched successfully', sections);
});

// @desc    Create Featured Section
// @route   POST /api/featured
// @access  Private (Owner)
const createFeaturedSection = asyncHandler(async (req, res) => {
  const { branchId, title, description, products, startDate, endDate, isActive } = req.body;

  if (!branchId || !title) {
    return res.status(400).json({ success: false, message: 'Branch ID and section title are required.' });
  }

  const featured = new FeaturedSection({
    restaurant: req.restaurantId,
    branch: branchId,
    title,
    description: description || '',
    products: Array.isArray(products) ? products : [],
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    isActive: isActive !== undefined ? isActive === true || isActive === 'true' : true
  });

  await featured.save();
  const populated = await FeaturedSection.findById(featured._id).populate({
    path: 'products',
    populate: { path: 'category', select: 'name' }
  });

  return sendResponse(res, 201, 'Featured section created successfully', populated);
});

// @desc    Update Featured Section
// @route   PUT /api/featured/:id
// @access  Private (Owner)
const updateFeaturedSection = asyncHandler(async (req, res) => {
  const { title, description, products, startDate, endDate, isActive } = req.body;

  const featured = await FeaturedSection.findOne({ _id: req.params.id, restaurant: req.restaurantId });
  if (!featured) {
    return res.status(404).json({ success: false, message: 'Featured section not found or access denied.' });
  }

  if (title) featured.title = title;
  if (description !== undefined) featured.description = description;
  if (Array.isArray(products)) featured.products = products;
  if (startDate !== undefined) featured.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) featured.endDate = endDate ? new Date(endDate) : null;
  if (isActive !== undefined) featured.isActive = isActive === true || isActive === 'true';

  await featured.save();
  const populated = await FeaturedSection.findById(featured._id).populate({
    path: 'products',
    populate: { path: 'category', select: 'name' }
  });

  return sendResponse(res, 200, 'Featured section updated successfully', populated);
});

// @desc    Delete Featured Section
// @route   DELETE /api/featured/:id
// @access  Private (Owner)
const deleteFeaturedSection = asyncHandler(async (req, res) => {
  const featured = await FeaturedSection.findOne({ _id: req.params.id, restaurant: req.restaurantId });
  if (!featured) {
    return res.status(404).json({ success: false, message: 'Featured section not found or access denied.' });
  }

  await FeaturedSection.findByIdAndDelete(featured._id);
  return sendResponse(res, 200, 'Featured section deleted successfully.');
});

module.exports = {
  getFeaturedSections,
  createFeaturedSection,
  updateFeaturedSection,
  deleteFeaturedSection
};
