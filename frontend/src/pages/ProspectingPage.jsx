import { useState } from 'react';
import { Search, Plus, Building2, Phone, Mail, MapPin, CheckSquare, Square } from 'lucide-react';
import api from '../api/client';
import { useOperation } from '../context/OperationContext';

const PORTES = [
  { value: '', label: 'Todos os portes' },
  { value: 'ME', label: 'Microempresa (ME)' },
  { value: 'EPP', label: 'Pequeno Porte (EPP)' },
  { value: 'DEMAIS', label: 'Demais' },
];

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

export default function ProspectingPage() {
  const { activeOperation } = useOperation();
  const [filters, setFilters] = useState({ cnae: '', municipio: '', uf: '', porte: '', capital_social_min: '' });
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  async function handleSearch(p = 1) {
    setError('');
    setImportResult(null);
    setLoading(true);
    setSelected(new Set());
    try {
      const { data } = await api.get(`/operations/${activeOperation.id}/prospecting/search`, {
        params: { ...filters, page: p },
      });
      setResults(data.data || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao buscar empresas');
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(cnpj) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(cnpj) ? next.delete(cnpj) : next.add(cnpj);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((r) => r.cnpj)));
    }
  }

  async function handleImport() {
    setImporting(true);
    setImportResult(null);
    try {
      const companies = results.filter((r) => selected.has(r.cnpj));
      const { data } = await api.post(`/operations/${activeOperation.id}/prospecting/import`, { companies });
      setImportResult(data);
      setSelected(new Set());
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao importar');
    } finally {
      setImporting(false);
    }
  }

  if (!activeOperation) {
    return <div className="p-8 text-center text-slate text-sm">Selecione uma operação primeiro.</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Prospecção por CNPJ</h1>
        <p className="text-slate text-sm mt-1">Encontre empresas por ramo, região e porte e importe direto para {activeOperation.name}</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-line p-5 mb-5">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-ink mb-1">CNAE / Ramo de atividade</label>
            <input
              value={filters.cnae}
              onChange={(e) => updateFilter('cnae', e.target.value)}
              placeholder="Ex: 6422100, imobiliária, construção..."
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Município</label>
            <input
              value={filters.municipio}
              onChange={(e) => updateFilter('municipio', e.target.value)}
              placeholder="Ex: São Paulo, Curitiba..."
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink mb-1">UF</label>
            <select
              value={filters.uf}
              onChange={(e) => updateFilter('uf', e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal bg-white"
            >
              <option value="">Todos os estados</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Porte</label>
            <select
              value={filters.porte}
              onChange={(e) => updateFilter('porte', e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal bg-white"
            >
              {PORTES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Capital social mínimo (R$)</label>
            <input
              type="number"
              value={filters.capital_social_min}
              onChange={(e) => updateFilter('capital_social_min', e.target.value)}
              placeholder="Ex: 100000"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>
        </div>
        <button
          onClick={() => handleSearch(1)}
          disabled={loading}
          className="flex items-center gap-2 bg-ink text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-slate transition disabled:opacity-50"
        >
          <Search size={16} />
          {loading ? 'Buscando...' : 'Buscar empresas'}
        </button>
      </div>

      {error && <div className="bg-ember/10 text-ember text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      {importResult && (
        <div className="bg-signal/10 text-ink text-sm rounded-lg px-4 py-3 mb-4">
          ✅ {importResult.message}
        </div>
      )}

      {/* Resultados */}
      {results.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate">{total.toLocaleString('pt-BR')} empresas encontradas</p>
            <div className="flex items-center gap-3">
              {selected.size > 0 && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-2 bg-signal text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  <Plus size={15} />
                  {importing ? 'Importando...' : `Importar ${selected.size} selecionados`}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-line overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate border-b border-line bg-cloud">
                  <th className="px-4 py-2.5">
                    <button onClick={toggleAll} className="text-slate hover:text-ink">
                      {selected.size === results.length ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </th>
                  <th className="px-4 py-2.5 font-medium">Empresa</th>
                  <th className="px-4 py-2.5 font-medium">CNAE</th>
                  <th className="px-4 py-2.5 font-medium">Localização</th>
                  <th className="px-4 py-2.5 font-medium">Contato</th>
                  <th className="px-4 py-2.5 font-medium">Capital Social</th>
                </tr>
              </thead>
              <tbody>
                {results.map((company) => {
                  const isSelected = selected.has(company.cnpj);
                  const tel = company.contatos?.telefones?.[0];
                  const email = company.contatos?.emails?.[0];
                  return (
                    <tr
                      key={company.cnpj}
                      onClick={() => toggleSelect(company.cnpj)}
                      className={`border-b border-line last:border-0 cursor-pointer transition ${isSelected ? 'bg-signal/5' : 'hover:bg-cloud/50'}`}
                    >
                      <td className="px-4 py-3">
                        {isSelected ? <CheckSquare size={16} className="text-signal" /> : <Square size={16} className="text-slate" />}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink text-xs">{company.razao_social}</p>
                        <p className="text-slate text-xs font-mono">{company.cnpj}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate max-w-[200px]">
                        <p className="truncate">{company.cnae_fiscal_descricao}</p>
                        <p className="text-slate/60">{company.cnae_fiscal}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate">
                        <div className="flex items-center gap-1">
                          <MapPin size={11} />
                          {company.municipio} - {company.uf}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {tel && <div className="flex items-center gap-1 text-slate"><Phone size={11} />{tel}</div>}
                        {email && <div className="flex items-center gap-1 text-slate"><Mail size={11} />{email}</div>}
                        {!tel && !email && <span className="text-slate/40">Sem contato</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate">
                        {company.capital_social
                          ? `R$ ${Number(company.capital_social).toLocaleString('pt-BR')}`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => handleSearch(page - 1)}
              disabled={page === 1 || loading}
              className="px-4 py-2 text-sm border border-line rounded-lg hover:bg-cloud disabled:opacity-40 transition"
            >
              ← Anterior
            </button>
            <span className="text-sm text-slate">Página {page}</span>
            <button
              onClick={() => handleSearch(page + 1)}
              disabled={results.length < 20 || loading}
              className="px-4 py-2 text-sm border border-line rounded-lg hover:bg-cloud disabled:opacity-40 transition"
            >
              Próxima →
            </button>
          </div>
        </>
      )}
    </div>
  );
}