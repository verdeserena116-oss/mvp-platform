import { useEffect, useState } from 'react';
import { Users, Megaphone, Send, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { useOperation } from '../context/OperationContext';

export default function DashboardPage() {
  const { activeOperation } = useOperation();
  const [leadCount, setLeadCount] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeOperation) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const [leadsRes, campaignsRes] = await Promise.all([
          api.get(`/operations/${activeOperation.id}/leads`, { params: { limit: 1 } }),
          api.get(`/operations/${activeOperation.id}/campaigns`),
        ]);
        setLeadCount(leadsRes.data.total);
        setCampaigns(campaignsRes.data);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [activeOperation]);

  if (!activeOperation) {
    return (
      <div className="p-8">
        <div className="text-center py-20 text-slate text-sm">
          Nenhuma operação selecionada. Vá em "Gerenciar operações" para criar a primeira.
        </div>
      </div>
    );
  }

  const totalSent = campaigns.reduce((sum, c) => sum + (c.totalSent || 0), 0);
  const totalFailed = campaigns.reduce((sum, c) => sum + (c.totalFailed || 0), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === 'sending' || c.status === 'scheduled').length;

  const stats = [
    { label: 'Leads cadastrados', value: leadCount, icon: Users, color: 'text-slate' },
    { label: 'Campanhas criadas', value: campaigns.length, icon: Megaphone, color: 'text-signal' },
    { label: 'Mensagens enviadas', value: totalSent, icon: Send, color: 'text-ink' },
    { label: 'Falhas de envio', value: totalFailed, icon: AlertCircle, color: 'text-ember' },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">{activeOperation.name}</h1>
        <p className="text-slate text-sm mt-1">
          {activeOperation.audienceType === 'B2B' ? 'Operação B2B' : 'Operação B2C'}
          {activeOperation.description ? ` · ${activeOperation.description}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-lg border border-line p-5">
            <div className="flex items-center justify-between mb-2">
              <Icon size={18} className={color} />
            </div>
            <p className="font-display font-bold text-2xl text-ink">{loading ? '—' : value}</p>
            <p className="text-xs text-slate mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-line">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-display font-semibold text-ink">Campanhas recentes</h2>
        </div>
        {campaigns.length === 0 ? (
          <div className="text-center py-12 text-slate text-sm">
            Nenhuma campanha criada ainda nesta operação.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate border-b border-line">
                <th className="px-5 py-2.5 font-medium">Nome</th>
                <th className="px-5 py-2.5 font-medium">Canal</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Destinatários</th>
                <th className="px-5 py-2.5 font-medium">Enviados</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.slice(0, 5).map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-5 py-3 capitalize text-slate">{c.channel}</td>
                  <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3 text-slate">{c.totalRecipients}</td>
                  <td className="px-5 py-3 text-slate">{c.totalSent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-slate/10 text-slate',
    scheduled: 'bg-slate/10 text-slate',
    sending: 'bg-signal/10 text-signal',
    sent: 'bg-ink/10 text-ink',
    paused: 'bg-ember/10 text-ember',
  };
  const labels = {
    draft: 'Rascunho',
    scheduled: 'Agendada',
    sending: 'Enviando',
    sent: 'Enviada',
    paused: 'Pausada',
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
}
