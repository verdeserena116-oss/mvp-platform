const express = require('express');
const router = express.Router({ mergeParams: true });
const campaignsController = require('../controllers/campaignsController');

router.get('/', campaignsController.list);
router.get('/:id', campaignsController.getById);
router.get('/:id/preview', campaignsController.preview);
router.get('/:id/messages', campaignsController.listMessages);
router.post('/', campaignsController.create);
router.post('/:id/dispatch', campaignsController.dispatch);
router.put('/:id', campaignsController.update);
router.delete('/:id', campaignsController.remove);

module.exports = router;
