import { useEffect, useState, useCallback } from 'react';
import { Plus, Mail, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useOperation } from '../context/OperationContext';

const STATUS_STYLES = {
  draft: 'bg-slate/10 text-slate',
  scheduled: 'bg-slate/10 text-slate',
  sending: 'bg-signal/10 text-signal',
  sent: 'bg-ink/10 text-ink',
  paused: 'bg-ember/10 text-ember',
};
const STATUS_LABELS = {
  draft: 'Rascunho', scheduled: 'Agendada', sending: 'Enviando', sent: 'Enviada', paused: 'Pausada',
};

export default function CampaignsPage() {
  const { activeOperation } = useOperation();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeOperation) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/operations/${activeOperation.id}/campaigns`);
      setCampaigns(data);
    } catch (err) {
      console.error('Erro ao carregar campanhas:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOperation]);

  useEffect(() => { load(); }, [load]);

  if (!activeOperation) {
    return <div className="p-8 text-center text-slate text-sm">Selecione uma operação primeiro.</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Campanhas</h1>
          <p className="text-slate text-sm mt-1">{activeOperation.name}</p>
        </div>
        <Link
          to="/campaigns/new"
          className="flex items-center gap-2 bg-ink text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate transition"
        >
          <Plus size={16} />
          Nova campanha
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate text-sm">Carregando...</div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-lg border border-line text-center py-16">
          <p className="text-slate text-sm mb-4">Nenhuma campanha criada ainda nesta operação.</p>
          <Link to="/campaigns/new" className="text-signal font-medium text-sm hover:underline">
            Criar primeira campanha
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              to={`/campaigns/${c.id}`}
              className="bg-white rounded-lg border border-line p-5 hover:border-signal transition block"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {c.channel === 'email' ? <Mail size={16} className="text-slate" /> : <MessageCircle size={16} className="text-slate" />}
                  <span className="text-xs text-slate uppercase font-medium">{c.channel === 'email' ? 'E-mail' : 'WhatsApp'}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${STATUS_STYLES[c.status] || STATUS_STYLES.draft}`}>
                  {STATUS_LABELS[c.status] || c.status}
                </span>
              </div>
              <h3 className="font-display font-semibold text-ink mb-1">{c.name}</h3>
              <p className="text-sm text-slate line-clamp-2">{c.objective || c.messageTemplate}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate">
                <span>{c.totalRecipients} destinatários</span>
                <span>{c.totalSent} enviados</span>
                {c.totalFailed > 0 && <span className="text-ember">{c.totalFailed} falhas</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
