const sequelize = require('../config/database');
const User = require('./User');
const Operation = require('./Operation');
const Lead = require('./Lead');
const Campaign = require('./Campaign');
const CampaignMessage = require('./CampaignMessage');

// Operation -> Leads
Operation.hasMany(Lead, { foreignKey: 'operationId', as: 'leads' });
Lead.belongsTo(Operation, { foreignKey: 'operationId', as: 'operation' });

// Operation -> Campaigns
Operation.hasMany(Campaign, { foreignKey: 'operationId', as: 'campaigns' });
Campaign.belongsTo(Operation, { foreignKey: 'operationId', as: 'operation' });

// Campaign -> CampaignMessages
Campaign.hasMany(CampaignMessage, { foreignKey: 'campaignId', as: 'messages' });
CampaignMessage.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

// Lead -> CampaignMessages
Lead.hasMany(CampaignMessage, { foreignKey: 'leadId', as: 'campaignMessages' });
CampaignMessage.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });

module.exports = {
  sequelize,
  User,
  Operation,
  Lead,
  Campaign,
  CampaignMessage,
};
