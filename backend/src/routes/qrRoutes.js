const express = require('express');
const router = express.Router();
const {
  getQRCodes,
  generateQRCode,
  renderQRImage,
  toggleQRStatus,
  deleteQRCode
} = require('../controllers/qrController');
const { protect } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');

router.get('/:id/render', renderQRImage);

router.use(protect, requireTenant);

router.route('/')
  .get(getQRCodes)
  .post(generateQRCode);

router.patch('/:id/status', toggleQRStatus);
router.delete('/:id', deleteQRCode);

module.exports = router;
