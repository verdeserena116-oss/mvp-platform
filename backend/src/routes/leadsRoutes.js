const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const leadsController = require('../controllers/leadsController');

// Configure multer to store uploaded CSVs temporarily
const upload = multer({
  dest: path.join(__dirname, '..', '..', 'uploads', 'tmp'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV são permitidos'));
    }
  },
});

router.get('/segments', leadsController.getSegmentOptions);
router.get('/', leadsController.list);
router.get('/:id', leadsController.getById);
router.post('/', leadsController.create);
router.post('/import', upload.single('file'), leadsController.importCsv);
router.put('/:id', leadsController.update);
router.delete('/:id', leadsController.remove);

module.exports = router;
