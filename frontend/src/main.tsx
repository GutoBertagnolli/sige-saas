import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import AbsencesPage from './pages/AbsencesPage';
import SubstitutionsPage from './pages/SubstitutionsPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeePlannerPage from './pages/EmployeePlannerPage';
import TimeTemplatesPage from './pages/TimeTemplatesPage';
import ClassesPage from './pages/ClassesPage';
import SchoolsPage from './pages/SchoolsPage';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  CalendarDays,
  Clock,
  GraduationCap,
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

function Layout() {
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
            <div>Versão {APP_VERSION}</div>
          </div>
        </header>

        <Routes>
          <Route path="/servidores/:employeeId/planner" element={<EmployeePlannerPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mensagens" element={<SimplePage title="Mensagens" />} />
  	  <Route path="/escolas" element={<SchoolsPage />} />          
          <Route path="/turmas" element={<ClassesPage />} />
          <Route path="/horarios" element={<TimeTemplatesPage />} />
          <Route path="/servidores" element={<EmployeesPage />} />
	  <Route path="/afastamentos" element={<AbsencesPage />} />          
          <Route path="/substituicoes" element={<SubstitutionsPage />} />
          <Route path="/relatorios" element={<SimplePage title="Relatórios" />} />
          <Route path="/configuracoes" element={<SimplePage title="Configurações" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Dashboard() {
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
          <div className="rounded-xl bg-slate-50 border p-4 text-sm text-slate-600">
            Nenhum aviso publicado. Este será o mural inicial para secretaria,
            direção e orientação.
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
      <Layout />
    </BrowserRouter>
  </QueryClientProvider>
</React.StrictMode>

);
