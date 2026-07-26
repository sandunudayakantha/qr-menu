const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, role, restaurantId = null) => {
  return jwt.sign(
    { userId, role, restaurantId },
    process.env.JWT_SECRET || 'super_secret_jwt_key_qr_menu_saas_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_qr_menu_saas_2026',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET || 'super_secret_jwt_key_qr_menu_saas_2026'
  );
};

const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_qr_menu_saas_2026'
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
