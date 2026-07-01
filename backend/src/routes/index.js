const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');

const authRoutes = require('./authRoutes');
const operationsRoutes = require('./operationsRoutes');
const leadsRoutes = require('./leadsRoutes');
const campaignsRoutes = require('./campaignsRoutes');

// Public auth routes
router.use('/auth', authRoutes);

// Everything below requires authentication
router.use('/operations', authMiddleware, operationsRoutes);

// Nested resources under an operation
router.use('/operations/:operationId/leads', authMiddleware, leadsRoutes);
router.use('/operations/:operationId/campaigns', authMiddleware, campaignsRoutes);

module.exports = router;
