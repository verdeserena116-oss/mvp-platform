const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Operation = sequelize.define('Operation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  audienceType: {
    type: DataTypes.ENUM('B2B', 'B2C'),
    allowNull: false,
    field: 'audience_type',
  },
  // Channels enabled for this operation
  emailEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'email_enabled',
  },
  whatsappEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'whatsapp_enabled',
  },
  // Sender config per operation
  emailFromName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'email_from_name',
  },
  emailFromAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'email_from_address',
  },
  whatsappInstanceId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'whatsapp_instance_id',
  },
  whatsappToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'whatsapp_token',
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'operations',
  underscored: true,
  timestamps: true,
});

module.exports = Operation;
