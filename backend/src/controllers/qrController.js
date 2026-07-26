const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/responseHandler');
const QRCodeModel = require('../models/QRCode');
const QRCode = require('qrcode');
const { customAlphabet } = require('nanoid');

const generateToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// @desc    Get QR Codes for a Branch
// @route   GET /api/qr
// @access  Private (Owner)
const getQRCodes = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  if (!branchId) {
    return res.status(400).json({ success: false, message: 'Branch ID is required.' });
  }

  const qrCodes = await QRCodeModel.find({
    restaurant: req.restaurantId,
    branch: branchId
  })
    .populate('menu', 'name status')
    .populate('branch', 'name')
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, 'QR codes fetched successfully', qrCodes);
});

// @desc    Generate New Permanent QR Code
// @route   POST /api/qr
// @access  Private (Owner)
const generateQRCode = asyncHandler(async (req, res) => {
  const { branchId, menuId, tableName } = req.body;

  if (!branchId || !menuId) {
    return res.status(400).json({ success: false, message: 'Branch ID and Menu ID are required.' });
  }

  let token = generateToken();
  let attempts = 0;
  while (await QRCodeModel.findOne({ token }) && attempts < 5) {
    token = generateToken();
    attempts++;
  }

  const qrCode = new QRCodeModel({
    restaurant: req.restaurantId,
    branch: branchId,
    menu: menuId,
    token,
    tableName: tableName || '',
    isActive: true
  });

  await qrCode.save();
  const populated = await QRCodeModel.findById(qrCode._id)
    .populate('menu', 'name status')
    .populate('branch', 'name');

  return sendResponse(res, 201, 'QR code generated successfully', populated);
});

// @desc    Get Rendered QR Image Data (PNG or SVG)
// @route   GET /api/qr/:id/render
// @access  Private / Public
const renderQRImage = asyncHandler(async (req, res) => {
  const { format = 'png' } = req.query;
  const qrCode = await QRCodeModel.findById(req.params.id);

  if (!qrCode) {
    return res.status(404).json({ success: false, message: 'QR Code not found.' });
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const qrUrl = `${clientUrl}/q/${qrCode.token}`;

  if (format === 'svg') {
    const svgString = await QRCode.toString(qrUrl, { type: 'svg', margin: 2, width: 300 });
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svgString);
  } else {
    const dataUrl = await QRCode.toDataURL(qrUrl, { margin: 2, width: 300 });
    return sendResponse(res, 200, 'QR image rendered', { dataUrl, url: qrUrl });
  }
});

// @desc    Toggle QR Code Status
// @route   PATCH /api/qr/:id/status
// @access  Private (Owner)
const toggleQRStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const qrCode = await QRCodeModel.findOne({ _id: req.params.id, restaurant: req.restaurantId });
  if (!qrCode) {
    return res.status(404).json({ success: false, message: 'QR Code not found or access denied.' });
  }

  qrCode.isActive = isActive === true || isActive === 'true';
  await qrCode.save();

  return sendResponse(res, 200, `QR Code ${qrCode.isActive ? 'activated' : 'deactivated'} successfully`, qrCode);
});

// @desc    Delete QR Code
// @route   DELETE /api/qr/:id
// @access  Private (Owner)
const deleteQRCode = asyncHandler(async (req, res) => {
  const qrCode = await QRCodeModel.findOne({ _id: req.params.id, restaurant: req.restaurantId });
  if (!qrCode) {
    return res.status(404).json({ success: false, message: 'QR Code not found or access denied.' });
  }

  await QRCodeModel.findByIdAndDelete(qrCode._id);
  return sendResponse(res, 200, 'QR Code deleted successfully.');
});

module.exports = {
  getQRCodes,
  generateQRCode,
  renderQRImage,
  toggleQRStatus,
  deleteQRCode
};
