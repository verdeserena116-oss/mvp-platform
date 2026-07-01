import { useEffect, useState, useCallback } from 'react';
import { Upload, Plus, Search, X } from 'lucide-react';
import api from '../api/client';
import { useOperation } from '../context/OperationContext';

const STATUS_LABELS = {
  new: 'Novo',
  contacted: 'Contatado',
  interested: 'Interessado',
  proposal: 'Proposta',
  won: 'Ganho',
  lost: 'Perdido',
};

export default function LeadsPage() {
  const { activeOperation } = useOperation();
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', jobTitle: '', segment: '', region: '',
  });

  const loadLeads = useCallback(async () => {
    if (!activeOperation) return;
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get(`/operations/${activeOperation.id}/leads`, { params });
      setLeads(data.leads);
      setTotal(data.total);
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOperation, search, statusFilter]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/operations/${activeOperation.id}/leads`, form);
      setForm({ name: '', email: '', phone: '', company: '', jobTitle: '', segment: '', region: '' });
      setShowForm(false);
      loadLeads();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar lead');
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/operations/${activeOperation.id}/leads/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(data);
      loadLeads();
    } catch (err) {
      setImportResult({ error: err.response?.data?.error || 'Erro ao importar arquivo' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  if (!activeOperation) {
    return <div className="p-8 text-center text-slate text-sm">Selecione uma operação primeiro.</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Leads</h1>
          <p className="text-slate text-sm mt-1">{total} contatos em {activeOperation.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 bg-white border border-line text-ink rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-cloud transition cursor-pointer">
            <Upload size={16} />
            {importing ? 'Importando...' : 'Importar CSV'}
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={importing} />
          </label>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-ink text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate transition"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancelar' : 'Novo lead'}
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`mb-4 text-sm rounded-lg px-4 py-3 ${importResult.error ? 'bg-ember/10 text-ember' : 'bg-signal/10 text-ink'}`}>
          {importResult.error
            ? importResult.error
            : `Importação concluída: ${importResult.imported} leads adicionados, ${importResult.failed} falharam.`}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-sm border border-line p-6 mb-6">
          {error && <div className="bg-ember/10 text-ember text-sm rounded px-3 py-2 mb-4">{error}</div>}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input required placeholder="Nome *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal" />
            <input type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal" />
            <input placeholder="Telefone (WhatsApp)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal" />
            {activeOperation.audienceType === 'B2B' && (
              <>
                <input placeholder="Empresa" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal" />
                <input placeholder="Cargo" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal" />
              </>
            )}
            <input placeholder="Segmento" value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })}
              className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal" />
            <input placeholder="Região" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal" />
          </div>
          <button type="submit" className="bg-signal text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition">
            Salvar lead
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input
            placeholder="Buscar por nome, e-mail, empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-line rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal bg-white"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-line overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate text-sm">Carregando...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-slate text-sm">
            Nenhum lead encontrado. Importe um CSV ou cadastre manualmente.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate border-b border-line bg-cloud">
                <th className="px-5 py-2.5 font-medium">Nome</th>
                <th className="px-5 py-2.5 font-medium">Contato</th>
                {activeOperation.audienceType === 'B2B' && <th className="px-5 py-2.5 font-medium">Empresa</th>}
                <th className="px-5 py-2.5 font-medium">Segmento</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-line last:border-0 hover:bg-cloud/50">
                  <td className="px-5 py-3 font-medium text-ink">{lead.name}</td>
                  <td className="px-5 py-3 text-slate">
                    {lead.email && <div>{lead.email}</div>}
                    {lead.phone && <div className="font-mono text-xs">{lead.phone}</div>}
                  </td>
                  {activeOperation.audienceType === 'B2B' && (
                    <td className="px-5 py-3 text-slate">
                      {lead.company}{lead.jobTitle ? ` · ${lead.jobTitle}` : ''}
                    </td>
                  )}
                  <td className="px-5 py-3 text-slate">{lead.segment || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded bg-cloud text-ink">
                      {STATUS_LABELS[lead.status] || lead.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
