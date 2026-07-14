import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, Megaphone, ChevronDown, LogOut, Building2, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOperation } from '../context/OperationContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { operations, activeOperation, selectOperation, loading } = useOperation();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navItems = [
    { to: '/', label: 'Visão geral', icon: LayoutGrid },
    { to: '/leads', label: 'Leads', icon: Users },
    { to: '/campaigns', label: 'Campanhas', icon: Megaphone },
    { to: '/prospecting', label: 'Prospecção', icon: Search }, // NOVO
  ];

  return (
    <div className="flex h-screen bg-cloud font-body">
      {/* Sidebar */}
      <aside className="w-64 bg-ink flex flex-col flex-shrink-0">
        <div className="px-6 py-6 border-b border-white/10">
          <h1 className="text-white font-display font-bold text-lg tracking-tight">
            Disparo<span className="text-signal">+</span>
          </h1>
          <p className="text-white/40 text-xs mt-1">Painel de operações</p>
        </div>

        {/* Operation switcher */}
        <div className="px-4 py-4 border-b border-white/10 relative">
          <button
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 transition rounded-lg px-3 py-2.5 text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 size={16} className="text-signal flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {loading ? 'Carregando...' : activeOperation?.name || 'Nenhuma operação'}
                </p>
                {activeOperation && (
                  <p className="text-white/40 text-xs">{activeOperation.audienceType}</p>
                )}
              </div>
            </div>
            <ChevronDown size={16} className="text-white/50 flex-shrink-0" />
          </button>

          {switcherOpen && (
            <div className="absolute left-4 right-4 mt-2 bg-white rounded-lg shadow-xl py-1.5 z-20 max-h-64 overflow-y-auto">
              {operations.map((op) => (
                <button
                  key={op.id}
                  onClick={() => { selectOperation(op); setSwitcherOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-cloud transition ${
                    activeOperation?.id === op.id ? 'text-signal font-medium' : 'text-ink'
                  }`}
                >
                  {op.name}
                  <span className="text-xs text-slate ml-2">{op.audienceType}</span>
                </button>
              ))}
              <NavLink
                to="/operations"
                onClick={() => setSwitcherOpen(false)}
                className="block px-3 py-2 text-sm text-slate hover:bg-cloud border-t border-line mt-1"
              >
                Gerenciar operações
              </NavLink>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-signal/15 text-signal'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/40 hover:text-ember transition p-1.5"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
