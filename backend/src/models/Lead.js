const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lead = sequelize.define('Lead', {
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
  // Basic contact info
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // B2B specific fields
  company: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'job_title',
  },
  // B2C / general segmentation
  segment: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  region: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  // Pipeline status
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'interested', 'proposal', 'won', 'lost'),
    defaultValue: 'new',
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true, // e.g. 'csv_import', 'manual', 'webhook'
  },
  // Opt-out / compliance
  optedOut: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'opted_out',
  },
}, {
  tableName: 'leads',
  underscored: true,
  timestamps: true,
  indexes: [
    { fields: ['operation_id'] },
    { fields: ['status'] },
    { fields: ['email'] },
    { fields: ['phone'] },
  ],
});

module.exports = Lead;
