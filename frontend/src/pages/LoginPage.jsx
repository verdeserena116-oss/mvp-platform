import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink font-body px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-white font-display font-bold text-3xl tracking-tight">
            Disparo<span className="text-signal">+</span>
          </h1>
          <p className="text-white/40 text-sm mt-2">Entre na sua conta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-xl space-y-4">
          {error && (
            <div className="bg-ember/10 text-ember text-sm rounded px-3 py-2">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
              placeholder="voce@empresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-ink text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate transition disabled:opacity-50"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center text-sm text-slate">
            Não tem conta?{' '}
            <Link to="/register" className="text-signal font-medium hover:underline">
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
