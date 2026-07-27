const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/responseHandler');
const Product = require('../models/Product');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Get Products for a Branch (with filter, search & pagination)
// @route   GET /api/products
// @access  Private (Owner)
const getProducts = asyncHandler(async (req, res) => {
  const { branchId, categoryId, search, available, page = 1, limit = 10 } = req.query;

  if (!branchId) {
    return res.status(400).json({ success: false, message: 'Branch ID is required.' });
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Math.min(100, Number(limit)));

  const query = {
    restaurant: req.restaurantId,
    branch: branchId
  };

  if (categoryId && categoryId !== 'ALL') query.category = categoryId;
  if (available !== undefined) query.available = available === 'true';
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const totalProducts = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  return sendResponse(res, 200, 'Products fetched successfully', products, {
    total: totalProducts,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(totalProducts / limitNum) || 1
  });
});

// @desc    Create Product
// @route   POST /api/products
// @access  Private (Owner)
const createProduct = asyncHandler(async (req, res) => {
  const { branchId, categoryId, name, description, prepTime, available } = req.body;

  if (!branchId || !categoryId || !name) {
    return res.status(400).json({ success: false, message: 'Branch ID, category, and product name are required.' });
  }

  let imageUrl = '';
  let featuredImageUrl = '';

  if (req.files?.image) {
    const uploadedImage = await uploadToCloudinary(req.files.image[0].buffer, 'products');
    imageUrl = uploadedImage.secure_url;
  }

  if (req.files?.featuredImage) {
    const uploadedFeatured = await uploadToCloudinary(req.files.featuredImage[0].buffer, 'products/featured');
    featuredImageUrl = uploadedFeatured.secure_url;
  }

  const product = new Product({
    restaurant: req.restaurantId,
    branch: branchId,
    category: categoryId,
    name,
    description: description || '',
    prepTime: prepTime || '15-20 mins',
    available: available !== undefined ? available === 'true' || available === true : true,
    image: imageUrl,
    featuredImage: featuredImageUrl
  });

  await product.save();
  const populatedProduct = await Product.findById(product._id).populate('category', 'name');

  return sendResponse(res, 201, 'Product created successfully', populatedProduct);
});

// @desc    Update Product
// @route   PUT /api/products/:id
// @access  Private (Owner)
const updateProduct = asyncHandler(async (req, res) => {
  const { categoryId, name, description, prepTime, available } = req.body;

  const product = await Product.findOne({ _id: req.params.id, restaurant: req.restaurantId });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found or access denied.' });
  }

  if (categoryId) product.category = categoryId;
  if (name) product.name = name;
  if (description !== undefined) product.description = description;
  if (prepTime) product.prepTime = prepTime;
  if (available !== undefined) product.available = available === 'true' || available === true;

  if (req.files?.image) {
    const uploadedImage = await uploadToCloudinary(req.files.image[0].buffer, 'products');
    product.image = uploadedImage.secure_url;
  }

  if (req.files?.featuredImage) {
    const uploadedFeatured = await uploadToCloudinary(req.files.featuredImage[0].buffer, 'products/featured');
    product.featuredImage = uploadedFeatured.secure_url;
  }

  await product.save();
  const updatedProduct = await Product.findById(product._id).populate('category', 'name');

  return sendResponse(res, 200, 'Product updated successfully', updatedProduct);
});

// @desc    Delete Product
// @route   DELETE /api/products/:id
// @access  Private (Owner)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, restaurant: req.restaurantId });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found or access denied.' });
  }

  await Product.findByIdAndDelete(product._id);
  return sendResponse(res, 200, 'Product deleted successfully.');
});

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
