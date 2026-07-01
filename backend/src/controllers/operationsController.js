const { Operation, Lead, Campaign } = require('../models');
const { Op } = require('sequelize');

// GET /api/operations
async function list(req, res) {
  try {
    const operations = await Operation.findAll({
      order: [['createdAt', 'DESC']],
    });

    // Add lead and campaign counts for each operation
    const withCounts = await Promise.all(
      operations.map(async (op) => {
        const leadCount = await Lead.count({ where: { operationId: op.id } });
        const campaignCount = await Campaign.count({ where: { operationId: op.id } });
        return { ...op.toJSON(), leadCount, campaignCount };
      })
    );

    return res.json(withCounts);
  } catch (err) {
    console.error('Erro ao listar operações:', err);
    return res.status(500).json({ error: 'Erro ao listar operações' });
  }
}

// GET /api/operations/:id
async function getById(req, res) {
  try {
    const operation = await Operation.findByPk(req.params.id);
    if (!operation) return res.status(404).json({ error: 'Operação não encontrada' });
    return res.json(operation);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar operação' });
  }
}

// POST /api/operations
async function create(req, res) {
  try {
    const {
      name, description, audienceType,
      emailEnabled, whatsappEnabled,
      emailFromName, emailFromAddress,
      whatsappInstanceId, whatsappToken,
    } = req.body;

    if (!name || !audienceType) {
      return res.status(400).json({ error: 'Nome e tipo de público (B2B/B2C) são obrigatórios' });
    }

    if (!['B2B', 'B2C'].includes(audienceType)) {
      return res.status(400).json({ error: 'Tipo de público deve ser B2B ou B2C' });
    }

    const operation = await Operation.create({
      name,
      description,
      audienceType,
      emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
      whatsappEnabled: whatsappEnabled !== undefined ? whatsappEnabled : true,
      emailFromName,
      emailFromAddress,
      whatsappInstanceId,
      whatsappToken,
    });

    return res.status(201).json(operation);
  } catch (err) {
    console.error('Erro ao criar operação:', err);
    return res.status(500).json({ error: 'Erro ao criar operação' });
  }
}

// PUT /api/operations/:id
async function update(req, res) {
  try {
    const operation = await Operation.findByPk(req.params.id);
    if (!operation) return res.status(404).json({ error: 'Operação não encontrada' });

    const allowedFields = [
      'name', 'description', 'audienceType', 'active',
      'emailEnabled', 'whatsappEnabled',
      'emailFromName', 'emailFromAddress',
      'whatsappInstanceId', 'whatsappToken',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) operation[field] = req.body[field];
    });

    await operation.save();
    return res.json(operation);
  } catch (err) {
    console.error('Erro ao atualizar operação:', err);
    return res.status(500).json({ error: 'Erro ao atualizar operação' });
  }
}

// DELETE /api/operations/:id
async function remove(req, res) {
  try {
    const operation = await Operation.findByPk(req.params.id);
    if (!operation) return res.status(404).json({ error: 'Operação não encontrada' });

    await operation.destroy();
    return res.json({ message: 'Operação removida com sucesso' });
  } catch (err) {
    console.error('Erro ao remover operação:', err);
    return res.status(500).json({ error: 'Erro ao remover operação' });
  }
}

module.exports = { list, getById, create, update, remove };
