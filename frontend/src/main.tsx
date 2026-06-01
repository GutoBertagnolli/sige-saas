import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import AbsencesPage from './pages/AbsencesPage';
import SubstitutionsPage from './pages/SubstitutionsPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeePlannerPage from './pages/EmployeePlannerPage';
import TimeTemplatesPage from './pages/TimeTemplatesPage';
import ClassesPage from './pages/ClassesPage';
import SchoolsPage from './pages/SchoolsPage';
import SettingsPage from './pages/SettingsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import PortalPage from './pages/PortalPage';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  CalendarDays,
  Clock,
  GraduationCap,
  LogOut,
  Megaphone,
  School,
  Users,
} from 'lucide-react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import './index.css';
import { APP_VERSION } from './version';
import { api, clearAuthToken, setAuthToken } from './services/api';

const menu = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Mensagens', path: '/mensagens' },
  { label: 'Escolas', path: '/escolas' },
  { label: 'Turmas', path: '/turmas' },
  { label: 'Horários', path: '/horarios' },
  { label: 'Servidores', path: '/servidores' },
  { label: 'Afastamentos', path: '/afastamentos' },
  { label: 'Substituições', path: '/substituicoes' },
  { label: 'Relatórios', path: '/relatorios' },
  { label: 'Configurações', path: '/configuracoes' },
];

const cards = [
  { title: 'Substituições pendentes', value: '0', icon: Clock },
  { title: 'Afastamentos hoje', value: '0', icon: CalendarDays },
  { title: 'Escolas ativas', value: '1', icon: School },
  { title: 'Servidores cadastrados', value: '0', icon: Users },
];

type DashboardAnnouncement = {
  id: string;
  title: string;
  message: string;
  createdBy?: string | null;
  school?: {
    name: string;
  } | null;
};

type AuthEmployee = {
  id: string;
  name: string;
  roleType?: string;
  school?: {
    name: string;
  } | null;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  employee?: AuthEmployee | null;
};

type AuthSession = {
  token: string;
  user: AuthUser;
};

const ADMIN_SESSION_KEY = 'sige_admin_session';
const ADMIN_ROLES = ['SECRETARIA', 'DIRETOR', 'ORIENTADOR', 'ADMIN', 'ADMINISTRADOR'];

async function getActiveAnnouncements() {
  const response = await api.get<DashboardAnnouncement[]>('/announcements/active');
  return response.data;
}

async function authenticate(data: { email: string; password: string }) {
  const response = await api.post<AuthSession>('/auth/login', {
    ...data,
    tenantSlug: 'suportiva',
  });

  return response.data;
}

async function getCurrentSession() {
  const response = await api.get<Omit<AuthSession, 'token'>>('/auth/me');
  return response.data;
}

function normalizeRole(user: AuthUser) {
  return String(user.role || user.employee?.roleType || '').toUpperCase();
}

function canAccessAdmin(user: AuthUser) {
  return ADMIN_ROLES.includes(normalizeRole(user));
}

function Layout({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const location = useLocation();
  const current = menu.find((item) => item.path === location.pathname);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-col p-5">
        <div className="mb-8">
          <div className="text-xl font-bold">SIGE</div>
          <div className="text-xs text-slate-300">by SUPORTIVA</div>
        </div>

        <nav className="space-y-1">
          {menu.map((item) => {
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                  active
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1">
        <header className="bg-white border-b px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {current?.label || 'SIGE'}
            </h1>
            <p className="text-sm text-slate-500">
              Fundação inicial do SIGE by SUPORTIVA
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>sige.suportiva.org</div>
            <div className="mt-1">{user.name}</div>
            <button
              onClick={onLogout}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-3 w-3" />
              Sair
            </button>
            <div>Versão {APP_VERSION}</div>
          </div>
        </header>

        <Routes>
          <Route path="/servidores/:employeeId/planner" element={<EmployeePlannerPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mensagens" element={<AnnouncementsPage />} />
  	  <Route path="/escolas" element={<SchoolsPage />} />          
          <Route path="/turmas" element={<ClassesPage />} />
          <Route path="/horarios" element={<TimeTemplatesPage />} />
          <Route path="/servidores" element={<EmployeesPage />} />
	  <Route path="/afastamentos" element={<AbsencesPage />} />          
          <Route path="/substituicoes" element={<SubstitutionsPage />} />
          <Route path="/relatorios" element={<SimplePage title="Relatórios" />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = React.useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored).user ?? null;
    } catch {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
  });
  const [checkingSession, setCheckingSession] = React.useState(Boolean(user));

  React.useEffect(() => {
    if (!user) return;

    getCurrentSession()
      .then((session) => {
        if (!canAccessAdmin(session.user)) {
          handleLogout();
          return;
        }

        setUser(session.user);
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ user: session.user }));
      })
      .catch(() => {
        handleLogout();
      })
      .finally(() => setCheckingSession(false));
  }, []);

  function handleLogin(session: AuthSession) {
    setAuthToken(session.token);
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ user: session.user }));
    setUser(session.user);
  }

  function handleLogout() {
    clearAuthToken();
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setUser(null);
    queryClient.clear();
  }

  if (checkingSession) {
    return (
      <section className="min-h-screen bg-slate-100 p-5 flex items-center justify-center">
        <div className="rounded-2xl border bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Restaurando sessao...
        </div>
      </section>
    );
  }

  return (
    <Routes>
      <Route path="/portal" element={<PortalPage />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />}
      />
      <Route
        path="/*"
        element={
          user ? (
            <Layout user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function LoginPage({ onLogin }: { onLogin: (session: AuthSession) => void }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const session = await authenticate({ email, password });

      if (!canAccessAdmin(session.user)) {
        clearAuthToken();
        setError('Este usuario deve acessar pelo Portal do servidor.');
        return;
      }

      onLogin(session);
    } catch (error: any) {
      setError(error?.response?.data?.message ?? 'Usuario ou senha invalidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen bg-slate-100 p-5 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Entrar no SIGE</h1>
        <p className="mt-1 text-sm text-slate-500">
          Use o login e senha gerados no cadastro do servidor.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Login</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </section>
  );
}

function Dashboard() {
  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: getActiveAnnouncements,
  });

  return (
    <>
      <section className="p-5 grid gap-4 md:grid-cols-4">
        {cards.map((Card) => (
          <div
            key={Card.title}
            className="bg-white rounded-2xl shadow-sm border p-5"
          >
            <Card.icon className="w-5 h-5 text-slate-600" />
            <div className="mt-4 text-2xl font-bold">{Card.value}</div>
            <div className="text-sm text-slate-500">{Card.title}</div>
          </div>
        ))}
      </section>

      <section className="p-5 grid gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-5 h-5" />
            <h2 className="font-semibold">Quadro de mensagens</h2>
          </div>
          <div className="grid gap-3">
            {announcements.slice(0, 3).map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-xl bg-slate-50 border p-4 text-sm text-slate-600"
              >
                <div className="font-semibold text-slate-900">
                  {announcement.title}
                </div>
                <div className="mt-1 line-clamp-3">{announcement.message}</div>
                <div className="mt-2 text-xs text-slate-500">
                  {announcement.school?.name ?? 'Todas as escolas'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Publicado por {announcement.createdBy || 'Direcao'}
                </div>
              </div>
            ))}

            {announcements.length === 0 && (
              <div className="rounded-xl bg-slate-50 border p-4 text-sm text-slate-600">
                Nenhum aviso publicado.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5" />
            <h2 className="font-semibold">Horários padrão</h2>
          </div>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>Matutino - Anos Iniciais</li>
            <li>Matutino - Anos Finais</li>
            <li>Vespertino - Anos Iniciais</li>
            <li>Vespertino - Anos Finais</li>
          </ul>
        </div>
      </section>
    </>
  );
}

function SimplePage({ title }: { title: string }) {
  return (
    <section className="p-5">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-slate-500">
          Módulo em construção. A próxima etapa será conectar esta tela à API.
        </p>
      </div>
    </section>
  );
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(

<React.StrictMode>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
</React.StrictMode>

);
