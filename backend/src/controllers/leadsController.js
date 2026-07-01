const { Lead, Operation } = require('../models');
const { Op } = require('sequelize');
const csv = require('csv-parser');
const fs = require('fs');

// GET /api/operations/:operationId/leads
// Supports filters via query params: segment, region, status, tag, search
async function list(req, res) {
  try {
    const { operationId } = req.params;
    const { segment, region, status, tag, search, page = 1, limit = 50 } = req.query;

    const where = { operationId };

    if (segment) where.segment = segment;
    if (region) where.region = region;
    if (status) where.status = status;
    if (tag) where.tags = { [Op.contains]: [tag] };

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Lead.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      leads: rows,
    });
  } catch (err) {
    console.error('Erro ao listar leads:', err);
    return res.status(500).json({ error: 'Erro ao listar leads' });
  }
}

// GET /api/operations/:operationId/leads/:id
async function getById(req, res) {
  try {
    const lead = await Lead.findOne({
      where: { id: req.params.id, operationId: req.params.operationId },
    });
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });
    return res.json(lead);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar lead' });
  }
}

// POST /api/operations/:operationId/leads
async function create(req, res) {
  try {
    const { operationId } = req.params;

    const operation = await Operation.findByPk(operationId);
    if (!operation) return res.status(404).json({ error: 'Operação não encontrada' });

    const { name, email, phone, company, jobTitle, segment, region, tags } = req.body;

    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    if (!email && !phone) {
      return res.status(400).json({ error: 'É necessário informar e-mail ou telefone' });
    }

    const lead = await Lead.create({
      operationId,
      name,
      email,
      phone,
      company,
      jobTitle,
      segment,
      region,
      tags: tags || [],
      source: 'manual',
    });

    return res.status(201).json(lead);
  } catch (err) {
    console.error('Erro ao criar lead:', err);
    return res.status(500).json({ error: 'Erro ao criar lead' });
  }
}

// PUT /api/operations/:operationId/leads/:id
async function update(req, res) {
  try {
    const lead = await Lead.findOne({
      where: { id: req.params.id, operationId: req.params.operationId },
    });
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

    const allowedFields = [
      'name', 'email', 'phone', 'company', 'jobTitle',
      'segment', 'region', 'tags', 'status', 'optedOut',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) lead[field] = req.body[field];
    });

    await lead.save();
    return res.json(lead);
  } catch (err) {
    console.error('Erro ao atualizar lead:', err);
    return res.status(500).json({ error: 'Erro ao atualizar lead' });
  }
}

// DELETE /api/operations/:operationId/leads/:id
async function remove(req, res) {
  try {
    const lead = await Lead.findOne({
      where: { id: req.params.id, operationId: req.params.operationId },
    });
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

    await lead.destroy();
    return res.json({ message: 'Lead removido com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao remover lead' });
  }
}

// POST /api/operations/:operationId/leads/import
// Expects a CSV file uploaded via multipart/form-data (field name: "file")
// Expected columns: name, email, phone, company, jobTitle, segment, region, tags (comma-separated)
async function importCsv(req, res) {
  try {
    const { operationId } = req.params;

    const operation = await Operation.findByPk(operationId);
    if (!operation) return res.status(404).json({ error: 'Operação não encontrada' });

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo CSV foi enviado' });
    }

    const results = [];
    const errors = [];
    let rowNumber = 0;

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          rowNumber += 1;

          const name = row.name || row.nome;
          const email = row.email || row['e-mail'];
          const phone = row.phone || row.telefone || row.whatsapp;

          if (!name || (!email && !phone)) {
            errors.push({ row: rowNumber, reason: 'Nome e (e-mail ou telefone) são obrigatórios' });
            return;
          }

          results.push({
            operationId,
            name,
            email: email || null,
            phone: phone || null,
            company: row.company || row.empresa || null,
            jobTitle: row.jobTitle || row.cargo || null,
            segment: row.segment || row.segmento || null,
            region: row.region || row.regiao || null,
            tags: row.tags ? row.tags.split(',').map((t) => t.trim()) : [],
            source: 'csv_import',
            status: 'new',
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Clean up uploaded file
    fs.unlink(req.file.path, () => {});

    if (results.length > 0) {
      await Lead.bulkCreate(results);
    }

    return res.json({
      imported: results.length,
      failed: errors.length,
      errors: errors.slice(0, 20), // limit error list returned
    });
  } catch (err) {
    console.error('Erro ao importar CSV:', err);
    return res.status(500).json({ error: 'Erro ao processar arquivo CSV' });
  }
}

// GET /api/operations/:operationId/leads/segments
// Returns distinct values for segment/region/status to help build campaign filters
async function getSegmentOptions(req, res) {
  try {
    const { operationId } = req.params;

    const segments = await Lead.findAll({
      where: { operationId },
      attributes: [[Lead.sequelize.fn('DISTINCT', Lead.sequelize.col('segment')), 'segment']],
      raw: true,
    });

    const regions = await Lead.findAll({
      where: { operationId },
      attributes: [[Lead.sequelize.fn('DISTINCT', Lead.sequelize.col('region')), 'region']],
      raw: true,
    });

    return res.json({
      segments: segments.map((s) => s.segment).filter(Boolean),
      regions: regions.map((r) => r.region).filter(Boolean),
      statuses: ['new', 'contacted', 'interested', 'proposal', 'won', 'lost'],
    });
  } catch (err) {
    console.error('Erro ao buscar opções de segmentação:', err);
    return res.status(500).json({ error: 'Erro ao buscar opções de segmentação' });
  }
}

module.exports = { list, getById, create, update, remove, importCsv, getSegmentOptions };
