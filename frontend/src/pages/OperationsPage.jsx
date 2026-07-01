import { useState } from 'react';
import { Plus, Mail, MessageCircle, X, Building2 } from 'lucide-react';
import api from '../api/client';
import { useOperation } from '../context/OperationContext';

export default function OperationsPage() {
  const { operations, refresh, selectOperation } = useOperation();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    audienceType: 'B2C',
    emailEnabled: true,
    whatsappEnabled: true,
    emailFromName: '',
    emailFromAddress: '',
    whatsappInstanceId: '',
    whatsappToken: '',
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post('/operations', form);
      await refresh();
      selectOperation(data);
      setShowForm(false);
      setForm({
        name: '', description: '', audienceType: 'B2C',
        emailEnabled: true, whatsappEnabled: true,
        emailFromName: '', emailFromAddress: '',
        whatsappInstanceId: '', whatsappToken: '',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar operação');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Operações</h1>
          <p className="text-slate text-sm mt-1">Cada operação é um ambiente isolado com seus próprios leads, campanhas e canais.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-ink text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate transition"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancelar' : 'Nova operação'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-line p-6 mb-6 space-y-5">
          {error && <div className="bg-ember/10 text-ember text-sm rounded px-3 py-2">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Nome da operação</label>
              <input
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ex: Vitrax, Limpeza de Nome..."
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Tipo de público</label>
              <select
                value={form.audienceType}
                onChange={(e) => update('audienceType', e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
              >
                <option value="B2C">B2C – Pessoa Física</option>
                <option value="B2B">B2B – Pessoa Jurídica</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Ex: Campanhas de negociação de dívidas para CPF negativado"
              rows={2}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>

          {/* Email config */}
          <div className="border border-line rounded-lg p-4">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={form.emailEnabled}
                onChange={(e) => update('emailEnabled', e.target.checked)}
                className="rounded text-signal"
              />
              <Mail size={16} className="text-slate" />
              <span className="text-sm font-medium text-ink">Canal de E-mail</span>
            </label>
            {form.emailEnabled && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <input
                  value={form.emailFromName}
                  onChange={(e) => update('emailFromName', e.target.value)}
                  placeholder="Nome do remetente"
                  className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
                />
                <input
                  type="email"
                  value={form.emailFromAddress}
                  onChange={(e) => update('emailFromAddress', e.target.value)}
                  placeholder="email@operacao.com"
                  className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
                />
              </div>
            )}
          </div>

          {/* WhatsApp config */}
          <div className="border border-line rounded-lg p-4">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={form.whatsappEnabled}
                onChange={(e) => update('whatsappEnabled', e.target.checked)}
                className="rounded text-signal"
              />
              <MessageCircle size={16} className="text-slate" />
              <span className="text-sm font-medium text-ink">Canal de WhatsApp (Z-API)</span>
            </label>
            {form.whatsappEnabled && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <input
                  value={form.whatsappInstanceId}
                  onChange={(e) => update('whatsappInstanceId', e.target.value)}
                  placeholder="ID da instância Z-API"
                  className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal font-mono"
                />
                <input
                  value={form.whatsappToken}
                  onChange={(e) => update('whatsappToken', e.target.value)}
                  placeholder="Token da instância"
                  className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal font-mono"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-signal text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Criar operação'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {operations.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate text-sm">
            Nenhuma operação cadastrada ainda. Crie a primeira para começar.
          </div>
        )}
        {operations.map((op) => (
          <div key={op.id} className="bg-white rounded-lg border border-line p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-ink/5 flex items-center justify-center">
                <Building2 size={18} className="text-ink" />
              </div>
              <div>
                <p className="font-medium text-ink text-sm">{op.name}</p>
                <p className="text-xs text-slate">{op.audienceType} · {op.leadCount} leads · {op.campaignCount} campanhas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {op.emailEnabled && <Mail size={15} className="text-slate" />}
              {op.whatsappEnabled && <MessageCircle size={15} className="text-slate" />}
              <button
                onClick={() => selectOperation(op)}
                className="text-xs font-medium text-signal hover:underline ml-2"
              >
                Selecionar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
