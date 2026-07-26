const express = require('express');
const router = express.Router();
const { getBranches, createBranch, updateBranch, deleteBranch } = require('../controllers/branchController');
const { protect } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');
const { upload } = require('../config/cloudinary');

router.use(protect, requireTenant);

router.route('/')
  .get(getBranches)
  .post(
    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 }
    ]),
    createBranch
  );

router.route('/:id')
  .put(
    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 }
    ]),
    updateBranch
  )
  .delete(deleteBranch);

module.exports = router;
