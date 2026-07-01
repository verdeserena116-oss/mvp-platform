import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Mail, MessageCircle, Send, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../api/client';
import { useOperation } from '../context/OperationContext';

const STATUS_LABELS = {
  draft: 'Rascunho', scheduled: 'Agendada', sending: 'Enviando', sent: 'Enviada', paused: 'Pausada',
};

export default function CampaignDetailPage() {
  const { id } = useParams();
  const { activeOperation } = useOperation();
  const [campaign, setCampaign] = useState(null);
  const [preview, setPreview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    if (!activeOperation) return;
    try {
      const { data } = await api.get(`/operations/${activeOperation.id}/campaigns/${id}`);
      setCampaign(data);

      if (data.status === 'draft' || data.status === 'scheduled') {
        const { data: prev } = await api.get(`/operations/${activeOperation.id}/campaigns/${id}/preview`);
        setPreview(prev);
      } else {
        const { data: msgs } = await api.get(`/operations/${activeOperation.id}/campaigns/${id}/messages`);
        setMessages(msgs);
      }
    } catch (err) {
      console.error('Erro ao carregar campanha:', err);
    }
  }, [activeOperation, id]);

  useEffect(() => { load(); }, [load]);

  // Poll for updates while sending
  useEffect(() => {
    if (campaign?.status !== 'sending') return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [campaign, load]);

  async function handleDispatch() {
    setError('');
    setDispatching(true);
    try {
      await api.post(`/operations/${activeOperation.id}/campaigns/${id}/dispatch`);
      setConfirming(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao disparar campanha');
    } finally {
      setDispatching(false);
    }
  }

  if (!campaign) return <div className="p-8 text-center text-slate text-sm">Carregando...</div>;

  const Icon = campaign.channel === 'email' ? Mail : MessageCircle;
  const isDraft = campaign.status === 'draft' || campaign.status === 'scheduled';

  return (
    <div className="p-8 max-w-2xl">
      <Link to="/campaigns" className="flex items-center gap-1.5 text-sm text-slate hover:text-ink transition mb-4">
        <ArrowLeft size={14} /> Voltar para campanhas
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Icon size={16} className="text-slate" />
            <span className="text-xs text-slate uppercase font-medium">{campaign.channel === 'email' ? 'E-mail' : 'WhatsApp'}</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-ink">{campaign.name}</h1>
          {campaign.objective && <p className="text-slate text-sm mt-1">{campaign.objective}</p>}
        </div>
        <span className="text-xs font-medium px-3 py-1.5 rounded bg-cloud text-ink">
          {STATUS_LABELS[campaign.status] || campaign.status}
        </span>
      </div>

      {error && <div className="bg-ember/10 text-ember text-sm rounded px-3 py-2 mb-4">{error}</div>}

      {/* Message content */}
      <div className="bg-white rounded-lg border border-line p-5 mb-4">
        {campaign.channel === 'email' && (
          <p className="text-sm mb-2"><span className="font-medium text-ink">Assunto: </span><span className="text-slate">{campaign.emailSubject}</span></p>
        )}
        <p className="text-sm font-medium text-ink mb-1">Mensagem:</p>
        <p className="text-sm text-slate whitespace-pre-wrap font-mono bg-cloud rounded-lg p-3">{campaign.messageTemplate}</p>
      </div>

      {isDraft && preview && (
        <div className="bg-white rounded-lg border border-line p-5 mb-4">
          <p className="text-sm font-medium text-ink mb-2">Pré-visualização do disparo</p>
          <p className="text-sm text-slate mb-3">
            Esta campanha alcançará <span className="font-semibold text-ink">{preview.matchingLeads} leads</span> com os filtros aplicados.
          </p>
          {preview.samplePreview && (
            <div className="bg-cloud rounded-lg p-3">
              <p className="text-xs text-slate mb-1">Exemplo de mensagem (para {preview.sampleLead?.name}):</p>
              <p className="text-sm text-ink whitespace-pre-wrap">{preview.samplePreview}</p>
            </div>
          )}

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              disabled={preview.matchingLeads === 0}
              className="flex items-center gap-2 bg-signal text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 mt-4"
            >
              <Send size={16} />
              Disparar campanha
            </button>
          ) : (
            <div className="mt-4 bg-ember/5 border border-ember/20 rounded-lg p-4">
              <p className="text-sm text-ink mb-3">
                Confirma o disparo para <strong>{preview.matchingLeads} leads</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDispatch}
                  disabled={dispatching}
                  className="bg-ember text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {dispatching ? 'Disparando...' : 'Sim, disparar agora'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="bg-white border border-line text-ink rounded-lg px-4 py-2 text-sm font-medium hover:bg-cloud transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sending / sent: delivery log */}
      {!isDraft && (
        <div className="bg-white rounded-lg border border-line">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink">Log de envio</h2>
            <p className="text-sm text-slate">
              {campaign.totalSent} enviados · {campaign.totalFailed} falhas · {campaign.totalRecipients} total
            </p>
          </div>
          {campaign.status === 'sending' && (
            <div className="px-5 py-2 bg-signal/5 text-signal text-xs font-medium flex items-center gap-2">
              <Clock size={12} className="animate-pulse" /> Disparo em andamento...
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate border-b border-line bg-cloud">
                <th className="px-5 py-2.5 font-medium">Lead</th>
                <th className="px-5 py-2.5 font-medium">Contato</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{m.lead?.name}</td>
                  <td className="px-5 py-3 text-slate font-mono text-xs">{m.lead?.email || m.lead?.phone}</td>
                  <td className="px-5 py-3">
                    <MessageStatus status={m.status} error={m.errorMessage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MessageStatus({ status, error }) {
  if (status === 'sent' || status === 'delivered') {
    return <span className="flex items-center gap-1 text-signal text-xs font-medium"><CheckCircle size={13} /> Enviado</span>;
  }
  if (status === 'failed') {
    return <span className="flex items-center gap-1 text-ember text-xs font-medium" title={error}><XCircle size={13} /> Falhou</span>;
  }
  return <span className="flex items-center gap-1 text-slate text-xs font-medium"><Clock size={13} /> Pendente</span>;
}
