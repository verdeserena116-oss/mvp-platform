const express = require('express');
const router = express.Router({ mergeParams: true });
const { searchCnpj, importFromProspecting, searchCnaes } = require('../controllers/prospectingController');

router.get('/search', searchCnpj);
router.post('/import', importFromProspecting);

module.exports = router;