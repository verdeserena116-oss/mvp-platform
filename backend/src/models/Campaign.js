const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  operationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'operation_id',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  objective: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  channel: {
    type: DataTypes.ENUM('email', 'whatsapp'),
    allowNull: false,
  },
  // Message content with template variables like {{name}}, {{company}}
  emailSubject: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'email_subject',
  },
  messageTemplate: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'message_template',
  },
  // Targeting filters (stored as JSON: { segment, region, tags, status })
  filters: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'sent', 'paused'),
    defaultValue: 'draft',
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'scheduled_at',
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sent_at',
  },
  // Aggregate stats
  totalRecipients: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_recipients',
  },
  totalSent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_sent',
  },
  totalFailed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_failed',
  },
}, {
  tableName: 'campaigns',
  underscored: true,
  timestamps: true,
  indexes: [
    { fields: ['operation_id'] },
    { fields: ['status'] },
  ],
});

module.exports = Campaign;
