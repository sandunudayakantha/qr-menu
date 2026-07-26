const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/responseHandler');
const Category = require('../models/Category');

// @desc    Get Categories for a Branch
// @route   GET /api/categories
// @access  Private (Owner)
const getCategories = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  if (!branchId) {
    return res.status(400).json({ success: false, message: 'Branch ID is required.' });
  }

  const categories = await Category.find({
    restaurant: req.restaurantId,
    branch: branchId
  }).sort({ sortOrder: 1, createdAt: 1 });

  return sendResponse(res, 200, 'Categories fetched successfully', categories);
});

// @desc    Create Category
// @route   POST /api/categories
// @access  Private (Owner)
const createCategory = asyncHandler(async (req, res) => {
  const { branchId, name, sortOrder } = req.body;

  if (!branchId || !name) {
    return res.status(400).json({ success: false, message: 'Branch ID and category name are required.' });
  }

  const category = new Category({
    restaurant: req.restaurantId,
    branch: branchId,
    name,
    sortOrder: Number(sortOrder) || 0
  });

  await category.save();
  return sendResponse(res, 201, 'Category created successfully', category);
});

// @desc    Update Category
// @route   PUT /api/categories/:id
// @access  Private (Owner)
const updateCategory = asyncHandler(async (req, res) => {
  const { name, sortOrder, status } = req.body;

  const category = await Category.findOne({ _id: req.params.id, restaurant: req.restaurantId });
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found or access denied.' });
  }

  if (name) category.name = name;
  if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);
  if (status) category.status = status;

  await category.save();
  return sendResponse(res, 200, 'Category updated successfully', category);
});

// @desc    Delete Category
// @route   DELETE /api/categories/:id
// @access  Private (Owner)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, restaurant: req.restaurantId });
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found or access denied.' });
  }

  await Category.findByIdAndDelete(category._id);
  return sendResponse(res, 200, 'Category deleted successfully.');
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
