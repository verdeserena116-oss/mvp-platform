const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');

const authRoutes = require('./authRoutes');
const operationsRoutes = require('./operationsRoutes');
const leadsRoutes = require('./leadsRoutes');
const campaignsRoutes = require('./campaignsRoutes');
const prospectingRoutes = require('./prospectingRoutes');
const cnaeRoutes = require('./cnaeRoutes');

// Public
router.use('/auth', authRoutes);

// Protected
router.use('/operations', authMiddleware, operationsRoutes);
router.use('/operations/:operationId/leads', authMiddleware, leadsRoutes);
router.use('/operations/:operationId/campaigns', authMiddleware, campaignsRoutes);
router.use('/operations/:operationId/prospecting', authMiddleware, prospectingRoutes);
router.use('/cnaes', authMiddleware, cnaeRoutes);

module.exports = router;