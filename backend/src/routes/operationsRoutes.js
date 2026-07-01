const express = require('express');
const router = express.Router();
const operationsController = require('../controllers/operationsController');

router.get('/', operationsController.list);
router.get('/:id', operationsController.getById);
router.post('/', operationsController.create);
router.put('/:id', operationsController.update);
router.delete('/:id', operationsController.remove);

module.exports = router;
