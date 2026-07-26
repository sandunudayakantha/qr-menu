const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');
const { upload } = require('../config/cloudinary');

router.use(protect, requireTenant);

router.route('/')
  .get(getProducts)
  .post(
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'featuredImage', maxCount: 1 }
    ]),
    createProduct
  );

router.route('/:id')
  .put(
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'featuredImage', maxCount: 1 }
    ]),
    updateProduct
  )
  .delete(deleteProduct);

module.exports = router;
