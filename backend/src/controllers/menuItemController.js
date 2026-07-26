const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/responseHandler');
const MenuItem = require('../models/MenuItem');
const Menu = require('../models/Menu');

// @desc    Get All Items in a Menu
// @route   GET /api/menu-items?menuId=xyz
// @access  Private (Owner)
const getMenuItems = asyncHandler(async (req, res) => {
  const { menuId } = req.query;
  if (!menuId) {
    return res.status(400).json({ success: false, message: 'Menu ID is required.' });
  }

  const menu = await Menu.findOne({ _id: menuId, restaurant: req.restaurantId });
  if (!menu) {
    return res.status(404).json({ success: false, message: 'Menu not found or access denied.' });
  }

  const items = await MenuItem.find({ menu: menuId })
    .populate({
      path: 'product',
      populate: { path: 'category', select: 'name' }
    })
    .sort({ sortOrder: 1, createdAt: 1 });

  return sendResponse(res, 200, 'Menu items fetched successfully', items);
});

// @desc    Add Product to Menu with Custom Price
// @route   POST /api/menu-items
// @access  Private (Owner)
const addMenuItem = asyncHandler(async (req, res) => {
  const { menuId, productId, price, available, sortOrder } = req.body;

  if (!menuId || !productId || price === undefined) {
    return res.status(400).json({ success: false, message: 'Menu ID, Product ID, and Price are required.' });
  }

  const menu = await Menu.findOne({ _id: menuId, restaurant: req.restaurantId });
  if (!menu) {
    return res.status(404).json({ success: false, message: 'Menu not found or access denied.' });
  }

  const existingItem = await MenuItem.findOne({ menu: menuId, product: productId });
  if (existingItem) {
    return res.status(400).json({ success: false, message: 'This product is already in the menu.' });
  }

  const menuItem = new MenuItem({
    menu: menuId,
    product: productId,
    price: Number(price),
    available: available !== undefined ? available === true || available === 'true' : true,
    sortOrder: Number(sortOrder) || 0
  });

  await menuItem.save();
  const populatedItem = await MenuItem.findById(menuItem._id).populate({
    path: 'product',
    populate: { path: 'category', select: 'name' }
  });

  return sendResponse(res, 201, 'Product added to menu successfully', populatedItem);
});

// @desc    Update Menu Item (Price, Availability, Sort Order)
// @route   PUT /api/menu-items/:id
// @access  Private (Owner)
const updateMenuItem = asyncHandler(async (req, res) => {
  const { price, available, sortOrder } = req.body;

  const menuItem = await MenuItem.findById(req.params.id).populate('menu');
  if (!menuItem) {
    return res.status(404).json({ success: false, message: 'Menu item not found.' });
  }

  const menu = await Menu.findOne({ _id: menuItem.menu._id, restaurant: req.restaurantId });
  if (!menu) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  if (price !== undefined) menuItem.price = Number(price);
  if (available !== undefined) menuItem.available = available === true || available === 'true';
  if (sortOrder !== undefined) menuItem.sortOrder = Number(sortOrder);

  await menuItem.save();
  const updatedItem = await MenuItem.findById(menuItem._id).populate({
    path: 'product',
    populate: { path: 'category', select: 'name' }
  });

  return sendResponse(res, 200, 'Menu item updated successfully', updatedItem);
});

// @desc    Reorder Menu Items Batch Update (for Drag and Drop Menu Builder)
// @route   PUT /api/menu-items/reorder
// @access  Private (Owner)
const reorderMenuItems = asyncHandler(async (req, res) => {
  const { items } = req.body; // Array of { id, sortOrder }

  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'Items array is required for reordering.' });
  }

  const updatePromises = items.map((item) =>
    MenuItem.findByIdAndUpdate(item.id, { sortOrder: item.sortOrder })
  );

  await Promise.all(updatePromises);
  return sendResponse(res, 200, 'Menu items reordered successfully.');
});

// @desc    Remove Product from Menu
// @route   DELETE /api/menu-items/:id
// @access  Private (Owner)
const removeMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id).populate('menu');
  if (!menuItem) {
    return res.status(404).json({ success: false, message: 'Menu item not found.' });
  }

  const menu = await Menu.findOne({ _id: menuItem.menu._id, restaurant: req.restaurantId });
  if (!menu) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  await MenuItem.findByIdAndDelete(menuItem._id);
  return sendResponse(res, 200, 'Product removed from menu successfully.');
});

module.exports = {
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  reorderMenuItems,
  removeMenuItem
};
