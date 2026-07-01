const { Campaign, Lead, Operation, CampaignMessage } = require('../models');
const { Op } = require('sequelize');
const { renderTemplate } = require('../services/templateService');
const { sendEmail } = require('../services/emailService');
const { sendWhatsappMessage } = require('../services/whatsappService');

// GET /api/operations/:operationId/campaigns
async function list(req, res) {
  try {
    const { operationId } = req.params;
    const campaigns = await Campaign.findAll({
      where: { operationId },
      order: [['createdAt', 'DESC']],
    });
    return res.json(campaigns);
  } catch (err) {
    console.error('Erro ao listar campanhas:', err);
    return res.status(500).json({ error: 'Erro ao listar campanhas' });
  }
}

// GET /api/operations/:operationId/campaigns/:id
async function getById(req, res) {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, operationId: req.params.operationId },
    });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });
    return res.json(campaign);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar campanha' });
  }
}

// POST /api/operations/:operationId/campaigns
async function create(req, res) {
  try {
    const { operationId } = req.params;

    const operation = await Operation.findByPk(operationId);
    if (!operation) return res.status(404).json({ error: 'Operação não encontrada' });

    const { name, objective, channel, emailSubject, messageTemplate, filters, scheduledAt } = req.body;

    if (!name || !channel || !messageTemplate) {
      return res.status(400).json({ error: 'Nome, canal e mensagem são obrigatórios' });
    }

    if (!['email', 'whatsapp'].includes(channel)) {
      return res.status(400).json({ error: 'Canal deve ser "email" ou "whatsapp"' });
    }

    if (channel === 'email' && !emailSubject) {
      return res.status(400).json({ error: 'Assunto do e-mail é obrigatório para campanhas de e-mail' });
    }

    // Validate that the operation has this channel enabled
    if (channel === 'email' && !operation.emailEnabled) {
      return res.status(400).json({ error: 'Esta operação não tem o canal de e-mail habilitado' });
    }
    if (channel === 'whatsapp' && !operation.whatsappEnabled) {
      return res.status(400).json({ error: 'Esta operação não tem o canal de WhatsApp habilitado' });
    }

    const campaign = await Campaign.create({
      operationId,
      name,
      objective,
      channel,
      emailSubject,
      messageTemplate,
      filters: filters || {},
      scheduledAt: scheduledAt || null,
      status: scheduledAt ? 'scheduled' : 'draft',
    });

    return res.status(201).json(campaign);
  } catch (err) {
    console.error('Erro ao criar campanha:', err);
    return res.status(500).json({ error: 'Erro ao criar campanha' });
  }
}

// PUT /api/operations/:operationId/campaigns/:id
async function update(req, res) {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, operationId: req.params.operationId },
    });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return res.status(400).json({ error: 'Não é possível editar uma campanha já enviada ou em envio' });
    }

    const allowedFields = ['name', 'objective', 'emailSubject', 'messageTemplate', 'filters', 'scheduledAt', 'status'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) campaign[field] = req.body[field];
    });

    await campaign.save();
    return res.json(campaign);
  } catch (err) {
    console.error('Erro ao atualizar campanha:', err);
    return res.status(500).json({ error: 'Erro ao atualizar campanha' });
  }
}

// DELETE /api/operations/:operationId/campaigns/:id
async function remove(req, res) {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, operationId: req.params.operationId },
    });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    await campaign.destroy();
    return res.json({ message: 'Campanha removida com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao remover campanha' });
  }
}

// Builds a Sequelize "where" clause for Lead based on campaign filters
function buildLeadWhereClause(operationId, filters = {}) {
  const where = { operationId, optedOut: false };

  if (filters.segment) where.segment = filters.segment;
  if (filters.region) where.region = filters.region;
  if (filters.status) where.status = filters.status;
  if (filters.tags && filters.tags.length > 0) {
    where.tags = { [Op.overlap]: filters.tags };
  }

  return where;
}

// GET /api/operations/:operationId/campaigns/:id/preview
// Returns count of leads that match the campaign filters + a sample rendered message
async function preview(req, res) {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, operationId: req.params.operationId },
    });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    const where = buildLeadWhereClause(req.params.operationId, campaign.filters);

    // Only consider leads that have the contact info needed for this channel
    if (campaign.channel === 'email') where.email = { [Op.ne]: null };
    if (campaign.channel === 'whatsapp') where.phone = { [Op.ne]: null };

    const count = await Lead.count({ where });
    const sampleLead = await Lead.findOne({ where });

    const samplePreview = sampleLead
      ? renderTemplate(campaign.messageTemplate, sampleLead)
      : null;

    return res.json({
      matchingLeads: count,
      sampleLead: sampleLead ? { name: sampleLead.name, company: sampleLead.company } : null,
      samplePreview,
    });
  } catch (err) {
    console.error('Erro ao gerar preview da campanha:', err);
    return res.status(500).json({ error: 'Erro ao gerar preview da campanha' });
  }
}

// POST /api/operations/:operationId/campaigns/:id/dispatch
// Sends the campaign immediately to all matching leads
async function dispatch(req, res) {
  try {
    const operation = await Operation.findByPk(req.params.operationId);
    if (!operation) return res.status(404).json({ error: 'Operação não encontrada' });

    const campaign = await Campaign.findOne({
      where: { id: req.params.id, operationId: req.params.operationId },
    });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return res.status(400).json({ error: 'Esta campanha já foi enviada ou está em andamento' });
    }

    if (campaign.channel === 'whatsapp' && (!operation.whatsappInstanceId || !operation.whatsappToken)) {
      return res.status(400).json({ error: 'Configure a instância do WhatsApp (Z-API) nesta operação antes de disparar' });
    }
    if (campaign.channel === 'email' && !operation.emailFromAddress) {
      return res.status(400).json({ error: 'Configure o e-mail de envio nesta operação antes de disparar' });
    }

    const where = buildLeadWhereClause(req.params.operationId, campaign.filters);
    if (campaign.channel === 'email') where.email = { [Op.ne]: null };
    if (campaign.channel === 'whatsapp') where.phone = { [Op.ne]: null };

    const leads = await Lead.findAll({ where });

    if (leads.length === 0) {
      return res.status(400).json({ error: 'Nenhum lead corresponde aos filtros desta campanha' });
    }

    campaign.status = 'sending';
    campaign.totalRecipients = leads.length;
    await campaign.save();

    // Respond immediately, process dispatch in background
    res.json({
      message: `Disparo iniciado para ${leads.length} leads`,
      totalRecipients: leads.length,
    });

    // Async dispatch loop (fire and forget)
    processDispatch(campaign, operation, leads).catch((err) => {
      console.error('Erro no processamento do disparo:', err);
    });
  } catch (err) {
    console.error('Erro ao disparar campanha:', err);
    return res.status(500).json({ error: 'Erro ao disparar campanha' });
  }
}

// Background processing: iterates leads, sends messages, records results
async function processDispatch(campaign, operation, leads) {
  let sentCount = 0;
  let failedCount = 0;

  for (const lead of leads) {
    const renderedMessage = renderTemplate(campaign.messageTemplate, lead);

    const messageRecord = await CampaignMessage.create({
      campaignId: campaign.id,
      leadId: lead.id,
      channel: campaign.channel,
      renderedMessage,
      status: 'pending',
    });

    try {
      if (campaign.channel === 'email') {
        await sendEmail({
          to: lead.email,
          subject: campaign.emailSubject,
          html: renderedMessage.replace(/\n/g, '<br>'),
          fromName: operation.emailFromName,
          fromAddress: operation.emailFromAddress,
        });
      } else if (campaign.channel === 'whatsapp') {
        await sendWhatsappMessage({
          instanceId: operation.whatsappInstanceId,
          token: operation.whatsappToken,
          phone: lead.phone,
          message: renderedMessage,
        });
      }

      messageRecord.status = 'sent';
      messageRecord.sentAt = new Date();
      await messageRecord.save();

      // Update lead status if it's still "new"
      if (lead.status === 'new') {
        lead.status = 'contacted';
        await lead.save();
      }

      sentCount += 1;
    } catch (err) {
      messageRecord.status = 'failed';
      messageRecord.errorMessage = err.message ? err.message.slice(0, 250) : 'Erro desconhecido';
      await messageRecord.save();
      failedCount += 1;
    }

    // Basic rate limiting to avoid hitting API limits / spam flags
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  campaign.status = 'sent';
  campaign.sentAt = new Date();
  campaign.totalSent = sentCount;
  campaign.totalFailed = failedCount;
  await campaign.save();
}

// GET /api/operations/:operationId/campaigns/:id/messages
// Returns the delivery log for a campaign
async function listMessages(req, res) {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, operationId: req.params.operationId },
    });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    const messages = await CampaignMessage.findAll({
      where: { campaignId: campaign.id },
      include: [{ model: Lead, as: 'lead', attributes: ['id', 'name', 'email', 'phone'] }],
      order: [['createdAt', 'DESC']],
    });

    return res.json(messages);
  } catch (err) {
    console.error('Erro ao listar mensagens da campanha:', err);
    return res.status(500).json({ error: 'Erro ao listar mensagens da campanha' });
  }
}

module.exports = { list, getById, create, update, remove, preview, dispatch, listMessages };
