const express = require('express');
const router = express.Router();
const { searchCnaes } = require('../controllers/prospectingController');

router.get('/search', searchCnaes);

module.exports = router;