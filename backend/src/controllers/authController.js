const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/responseHandler');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

// @desc    Login user (Super Admin / Restaurant Owner)
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
  }

  let restaurant = null;
  if (user.role === 'RESTAURANT_OWNER' && user.restaurantId) {
    restaurant = await Restaurant.findById(user.restaurantId);
    if (restaurant && restaurant.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Your restaurant account has been suspended.' });
    }
  }

  const accessToken = generateAccessToken(user._id, user.role, user.restaurantId);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId,
    restaurant: restaurant ? {
      _id: restaurant._id,
      name: restaurant.name,
      logo: restaurant.logo,
      maxBranches: restaurant.maxBranches
    } : null
  };

  return sendResponse(res, 200, 'Login successful', {
    user: userResponse,
    accessToken,
    refreshToken
  });
});

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Refresh token is required.' });
  }

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.userId);

  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found.' });
  }

  const tokenExists = user.refreshTokens.some(rt => rt.token === token);
  if (!tokenExists) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
  }

  const newAccessToken = generateAccessToken(user._id, user.role, user.restaurantId);

  return sendResponse(res, 200, 'Access token refreshed', {
    accessToken: newAccessToken
  });
});

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  let restaurant = null;
  if (user.role === 'RESTAURANT_OWNER' && user.restaurantId) {
    restaurant = await Restaurant.findById(user.restaurantId);
  }

  return sendResponse(res, 200, 'User profile retrieved', {
    user,
    restaurant
  });
});

// @desc    Change Password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide current and new passwords.' });
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Incorrect current password.' });
  }

  user.password = newPassword;
  await user.save();

  return sendResponse(res, 200, 'Password updated successfully.');
});

// @desc    Logout User
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    req.user.refreshTokens = req.user.refreshTokens.filter(rt => rt.token !== refreshToken);
    await req.user.save();
  }
  return sendResponse(res, 200, 'Logged out successfully.');
});

module.exports = {
  login,
  refreshToken,
  getMe,
  changePassword,
  logout
};
