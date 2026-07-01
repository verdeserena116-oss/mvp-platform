import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageCircle } from 'lucide-react';
import api from '../api/client';
import { useOperation } from '../context/OperationContext';

export default function NewCampaignPage() {
  const { activeOperation } = useOperation();
  const navigate = useNavigate();

  const [segmentOptions, setSegmentOptions] = useState({ segments: [], regions: [], statuses: [] });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    objective: '',
    channel: 'whatsapp',
    emailSubject: '',
    messageTemplate: '',
    filters: { segment: '', region: '', status: '' },
  });

  useEffect(() => {
    if (!activeOperation) return;
    api.get(`/operations/${activeOperation.id}/leads/segments`)
      .then(({ data }) => setSegmentOptions(data))
      .catch((err) => console.error(err));
  }, [activeOperation]);

  function updateFilter(key, value) {
    setForm((f) => ({ ...f, filters: { ...f.filters, [key]: value } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      // Strip empty filter values
      const cleanFilters = Object.fromEntries(
        Object.entries(form.filters).filter(([, v]) => v !== '')
      );

      const { data } = await api.post(`/operations/${activeOperation.id}/campaigns`, {
        ...form,
        filters: cleanFilters,
      });

      navigate(`/campaigns/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar campanha');
    } finally {
      setSaving(false);
    }
  }

  if (!activeOperation) {
    return <div className="p-8 text-center text-slate text-sm">Selecione uma operação primeiro.</div>;
  }

  const availableChannels = [];
  if (activeOperation.emailEnabled) availableChannels.push({ value: 'email', label: 'E-mail', icon: Mail });
  if (activeOperation.whatsappEnabled) availableChannels.push({ value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle });

  const variables = ['{{name}}', '{{company}}', '{{jobTitle}}', '{{segment}}', '{{region}}'];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Nova campanha</h1>
        <p className="text-slate text-sm mt-1">{activeOperation.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-line p-6 space-y-5">
        {error && <div className="bg-ember/10 text-ember text-sm rounded px-3 py-2">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Nome da campanha</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Oferta Home Equity - Junho"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Objetivo (opcional)</label>
          <input
            value={form.objective}
            onChange={(e) => setForm({ ...form, objective: e.target.value })}
            placeholder="Ex: Gerar interesse em financiamento de veículos"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-2">Canal de envio</label>
          <div className="flex gap-2">
            {availableChannels.map(({ value, label, icon: Icon }) => (
              <button
                type="button"
                key={value}
                onClick={() => setForm({ ...form, channel: value })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                  form.channel === value
                    ? 'border-signal bg-signal/10 text-signal'
                    : 'border-line text-slate hover:border-slate'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          {availableChannels.length === 0 && (
            <p className="text-xs text-ember mt-1">Nenhum canal habilitado para esta operação.</p>
          )}
        </div>

        {form.channel === 'email' && (
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Assunto do e-mail</label>
            <input
              required
              value={form.emailSubject}
              onChange={(e) => setForm({ ...form, emailSubject: e.target.value })}
              placeholder="Ex: {{name}}, uma oportunidade para sua empresa"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Mensagem</label>
          <textarea
            required
            rows={6}
            value={form.messageTemplate}
            onChange={(e) => setForm({ ...form, messageTemplate: e.target.value })}
            placeholder="Ex: Olá {{name}}, tudo bem? Temos uma oferta especial para {{company}}..."
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal font-mono"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {variables.map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setForm({ ...form, messageTemplate: form.messageTemplate + ' ' + v })}
                className="text-xs font-mono bg-cloud text-slate px-2 py-1 rounded hover:bg-line transition"
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Segmentation filters */}
        <div className="border-t border-line pt-5">
          <p className="text-sm font-medium text-ink mb-3">Segmentação do público (opcional)</p>
          <div className="grid grid-cols-3 gap-3">
            <select
              value={form.filters.segment}
              onChange={(e) => updateFilter('segment', e.target.value)}
              className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal bg-white"
            >
              <option value="">Todos os segmentos</option>
              {segmentOptions.segments.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={form.filters.region}
              onChange={(e) => updateFilter('region', e.target.value)}
              className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal bg-white"
            >
              <option value="">Todas as regiões</option>
              {segmentOptions.regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={form.filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal bg-white"
            >
              <option value="">Todos os status</option>
              {segmentOptions.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || availableChannels.length === 0}
          className="bg-signal text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar campanha'}
        </button>
      </form>
    </div>
  );
}
