const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/responseHandler');
const Menu = require('../models/Menu');
const MenuItem = require('../models/MenuItem');
const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get Menus for a Branch
// @route   GET /api/menus
// @access  Private (Owner)
const getMenus = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  if (!branchId) {
    return res.status(400).json({ success: false, message: 'Branch ID is required.' });
  }

  const menus = await Menu.find({
    restaurant: req.restaurantId,
    branch: branchId
  }).sort({ createdAt: -1 });

  // Attach item count to each menu
  const menusWithCounts = await Promise.all(
    menus.map(async (m) => {
      const itemCount = await MenuItem.countDocuments({ menu: m._id });
      return {
        ...m.toObject(),
        itemCount
      };
    })
  );

  return sendResponse(res, 200, 'Menus fetched successfully', menusWithCounts);
});

// @desc    Get Cross-Menu Price Matrix & Comparison Report (Paginated for high scale)
// @route   GET /api/menus/price-matrix
// @access  Private (Owner)
const getPriceMatrix = asyncHandler(async (req, res) => {
  const { branchId, page = 1, limit = 10, search = '', categoryId = '' } = req.query;
  if (!branchId) {
    return res.status(400).json({ success: false, message: 'Branch ID is required.' });
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Math.min(100, Number(limit)));

  const productQuery = {
    restaurant: req.restaurantId,
    branch: branchId
  };

  if (categoryId && categoryId !== 'ALL') {
    productQuery.category = categoryId;
  }

  if (search) {
    productQuery.name = { $regex: search, $options: 'i' };
  }

  const [menus, totalProducts, categories] = await Promise.all([
    Menu.find({ restaurant: req.restaurantId, branch: branchId }).sort({ createdAt: 1 }),
    Product.countDocuments(productQuery),
    Category.find({ restaurant: req.restaurantId, branch: branchId }).sort({ sortOrder: 1 })
  ]);

  const products = await Product.find(productQuery)
    .populate('category', 'name')
    .sort({ name: 1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const menuIds = menus.map(m => m._id);
  const productIds = products.map(p => p._id);

  // Fetch menu items only for the paginated products
  const menuItems = await MenuItem.find({
    menu: { $in: menuIds },
    product: { $in: productIds }
  });

  // Build matrix lookup map: matrix[productId][menuId] = { menuItemId, price, available }
  const matrix = {};
  menuItems.forEach(item => {
    const pId = item.product.toString();
    const mId = item.menu.toString();
    if (!matrix[pId]) matrix[pId] = {};
    matrix[pId][mId] = {
      menuItemId: item._id,
      price: item.price,
      available: item.available
    };
  });

  return sendResponse(res, 200, 'Price matrix report loaded successfully', {
    menus,
    products,
    categories,
    matrix
  }, {
    total: totalProducts,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(totalProducts / limitNum) || 1
  });
});

// @desc    Create Menu
// @route   POST /api/menus
// @access  Private (Owner)
const createMenu = asyncHandler(async (req, res) => {
  const { branchId, name, description, status } = req.body;

  if (!branchId || !name) {
    return res.status(400).json({ success: false, message: 'Branch ID and Menu name are required.' });
  }

  const menu = new Menu({
    restaurant: req.restaurantId,
    branch: branchId,
    name,
    description: description || '',
    status: status || 'ACTIVE'
  });

  await menu.save();
  return sendResponse(res, 201, 'Menu created successfully', menu);
});

// @desc    Update Menu
// @route   PUT /api/menus/:id
// @access  Private (Owner)
const updateMenu = asyncHandler(async (req, res) => {
  const { name, description, status } = req.body;

  const menu = await Menu.findOne({ _id: req.params.id, restaurant: req.restaurantId });
  if (!menu) {
    return res.status(404).json({ success: false, message: 'Menu not found or access denied.' });
  }

  if (name) menu.name = name;
  if (description !== undefined) menu.description = description;
  if (status) menu.status = status;

  await menu.save();
  return sendResponse(res, 200, 'Menu updated successfully', menu);
});

// @desc    Delete Menu (and its MenuItems)
// @route   DELETE /api/menus/:id
// @access  Private (Owner)
const deleteMenu = asyncHandler(async (req, res) => {
  const menu = await Menu.findOne({ _id: req.params.id, restaurant: req.restaurantId });
  if (!menu) {
    return res.status(404).json({ success: false, message: 'Menu not found or access denied.' });
  }

  await Promise.all([
    MenuItem.deleteMany({ menu: menu._id }),
    Menu.findByIdAndDelete(menu._id)
  ]);

  return sendResponse(res, 200, 'Menu deleted successfully.');
});

module.exports = {
  getMenus,
  getPriceMatrix,
  createMenu,
  updateMenu,
  deleteMenu
};
