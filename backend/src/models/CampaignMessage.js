const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// One row per (campaign, lead) pair - tracks individual send status
const CampaignMessage = sequelize.define('CampaignMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'campaign_id',
  },
  leadId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'lead_id',
  },
  channel: {
    type: DataTypes.ENUM('email', 'whatsapp'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed', 'delivered', 'opened', 'replied'),
    defaultValue: 'pending',
  },
  renderedMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rendered_message',
  },
  errorMessage: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'error_message',
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sent_at',
  },
}, {
  tableName: 'campaign_messages',
  underscored: true,
  timestamps: true,
  indexes: [
    { fields: ['campaign_id'] },
    { fields: ['lead_id'] },
    { fields: ['status'] },
  ],
});

module.exports = CampaignMessage;
