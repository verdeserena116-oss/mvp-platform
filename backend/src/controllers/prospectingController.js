const axios = require('axios');
const { Lead, Operation } = require('../models');

// GET /api/operations/:operationId/prospecting/search
// Params: cnae, municipio, uf, porte, capital_social_min, page
async function searchCnpj(req, res) {
  try {
    const { cnae, municipio, uf, porte, capital_social_min, page = 1 } = req.query;

    if (!uf && !municipio && !cnae) {
      return res.status(400).json({ error: 'Informe ao menos UF, município ou CNAE para buscar' });
    }

    // Monta query para a API pública da Casa dos Dados
    const params = {
      page,
      extras: 'contatos',
    };

    if (cnae) params.cnae = cnae;
    if (municipio) params.municipio = municipio;
    if (uf) params.uf = uf;
    if (porte) params.porte = porte;
    if (capital_social_min) params.capital_social_min = capital_social_min;

    const response = await axios.get('https://api.casadosdados.com.br/v2/public/cnpj/pesquisa', {
      params,
      headers: {
        'Accept': 'application/json',
      },
      timeout: 15000,
    });

    return res.json(response.data);
  } catch (err) {
    if (err.response?.status === 429) {
      return res.status(429).json({ error: 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.' });
    }
    console.error('Erro ao buscar CNPJ:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar dados. Tente novamente.' });
  }
}

// POST /api/operations/:operationId/prospecting/import
// Body: { cnpjs: [...] } — array de objetos retornados pela busca
async function importFromProspecting(req, res) {
  try {
    const { operationId } = req.params;
    const { companies } = req.body;

    const operation = await Operation.findByPk(operationId);
    if (!operation) return res.status(404).json({ error: 'Operação não encontrada' });

    if (!companies || companies.length === 0) {
      return res.status(400).json({ error: 'Nenhuma empresa selecionada' });
    }

    const leads = companies.map((c) => {
      // Extrai telefone e e-mail dos contatos se disponível
      const telefone = c.contatos?.telefones?.[0] || null;
      const email = c.contatos?.emails?.[0] || null;

      // Nome do sócio principal (primeiro da lista)
      const socio = c.socios?.[0];
      const nomeSocio = socio?.nome || c.razao_social;

      return {
        operationId,
        name: nomeSocio,
        email: email || null,
        phone: telefone ? telefone.replace(/\D/g, '') : null,
        company: c.razao_social,
        jobTitle: socio ? 'Sócio' : null,
        segment: c.cnae_fiscal_descricao || null,
        region: c.municipio ? `${c.municipio} - ${c.uf}` : c.uf || null,
        tags: ['prospecção-cnpj'],
        source: 'cnpj_prospecting',
        status: 'new',
      };
    });

    // Filtra leads sem nenhum contato
    const leadsComContato = leads.filter((l) => l.email || l.phone);
    const semContato = leads.length - leadsComContato.length;

    await Lead.bulkCreate(leadsComContato);

    return res.json({
      imported: leadsComContato.length,
      skipped: semContato,
      message: semContato > 0
        ? `${leadsComContato.length} leads importados. ${semContato} ignorados por não terem e-mail nem telefone.`
        : `${leadsComContato.length} leads importados com sucesso.`,
    });
  } catch (err) {
    console.error('Erro ao importar prospecção:', err);
    return res.status(500).json({ error: 'Erro ao importar leads' });
  }
}

// GET /api/prospecting/cnaes?term=xxx — busca CNAEs por termo
async function searchCnaes(req, res) {
  try {
    const { term } = req.query;
    if (!term || term.length < 3) {
      return res.status(400).json({ error: 'Informe ao menos 3 caracteres' });
    }

    const response = await axios.get('https://api.casadosdados.com.br/v2/public/cnae', {
      params: { termo: term },
      timeout: 10000,
    });

    return res.json(response.data);
  } catch (err) {
    console.error('Erro ao buscar CNAEs:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar CNAEs' });
  }
}

module.exports = { searchCnpj, importFromProspecting, searchCnaes };