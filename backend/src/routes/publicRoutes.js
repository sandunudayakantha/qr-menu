const express = require('express');
const router = express.Router();
const { getPublicMenuByToken } = require('../controllers/publicController');

router.get('/menu/:token', getPublicMenuByToken);

module.exports = router;
