const Restaurant = require('../models/Restaurant');

const requireTenant = async (req, res, next) => {
  try {
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (req.user.role === 'RESTAURANT_OWNER') {
      if (!req.user.restaurantId) {
        return res.status(400).json({
          success: false,
          message: 'No restaurant associated with this owner account.'
        });
      }

      const restaurant = await Restaurant.findById(req.user.restaurantId);
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: 'Associated restaurant not found.'
        });
      }

      if (restaurant.status === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          message: 'This restaurant account is currently suspended.'
        });
      }

      req.restaurant = restaurant;
      req.restaurantId = restaurant._id;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Unauthorized tenant access.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { requireTenant };
