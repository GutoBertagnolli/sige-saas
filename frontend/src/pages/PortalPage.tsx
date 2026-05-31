import { useMemo, useState } from 'react';
import { api } from '../services/api';

type PortalEmployee = {
  id: string;
  name: string;
  roleType?: string;
  schoolId?: string | null;
  school?: {
    id: string;
    name: string;
  } | null;
};

type PortalUser = {
  id: string;
  name: string;
  email: string;
  employee?: PortalEmployee | null;
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  priority: number;
  school?: {
    name: string;
  } | null;
};

type Substitution = {
  id: string;
  weekday?: string | null;
  status: string;
  timeSlot?: {
    startTime: string;
    endTime: string;
  } | null;
  absence?: {
    employee?: {
      name: string;
    } | null;
  } | null;
};

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terça-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_DIRECTOR: 'Aguardando aceite',
  SENT_TO_TEACHER: 'Enviado ao professor',
  ACCEPTED: 'Aceito',
  DECLINED: 'Recusado',
};

async function login(data: { email: string; password: string }) {
  const response = await api.post<{
    token: string;
    user: PortalUser;
  }>('/auth/login', {
    ...data,
    tenantSlug: 'suportiva',
  });

  return response.data;
}

async function getAnnouncements(employee: PortalEmployee) {
  const response = await api.get<Announcement[]>('/announcements/active', {
    params: {
      roleType: employee.roleType,
      schoolId: employee.schoolId,
    },
  });
  return response.data;
}

async function getSubstitutions(employeeId: string) {
  const response = await api.get<Substitution[]>(`/substitutions/substitute/${employeeId}`);
  return response.data;
}

function formatSchedule(substitution: Substitution) {
  const weekday = substitution.weekday
    ? WEEKDAY_LABELS[substitution.weekday] ?? substitution.weekday
    : 'Dia não informado';
  const time = substitution.timeSlot
    ? `${substitution.timeSlot.startTime} - ${substitution.timeSlot.endTime}`
    : 'Horário não informado';

  return `${weekday} • ${time}`;
}

export default function PortalPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<PortalUser | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [loading, setLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState('');
  const [substitutionsError, setSubstitutionsError] = useState('');

  const employee = user?.employee ?? null;
  const pendingSubstitutions = useMemo(
    () => substitutions.filter((item) => item.status !== 'DECLINED'),
    [substitutions],
  );

  async function loadPortalData(currentEmployee: PortalEmployee) {
    setAnnouncementsError('');
    setSubstitutionsError('');

    try {
      const loadedAnnouncements = await getAnnouncements(currentEmployee);
      setAnnouncements(loadedAnnouncements);
    } catch (error: any) {
      setAnnouncements([]);
      setAnnouncementsError(
        error?.response?.data?.message ?? 'Erro ao carregar mensagens.',
      );
    }

    try {
      const loadedSubstitutions = await getSubstitutions(currentEmployee.id);
      setSubstitutions(loadedSubstitutions);
    } catch (error: any) {
      setSubstitutions([]);
      setSubstitutionsError(
        error?.response?.data?.message ?? 'Erro ao carregar substituições.',
      );
    }
  }

  async function handleLogin() {
    setLoading(true);

    try {
      const result = await login({ email, password });
      setUser(result.user);

      if (result.user.employee) {
        await loadPortalData(result.user.employee);
      }
    } catch (error: any) {
      alert(error?.response?.data?.message ?? 'Erro ao entrar no portal.');
    } finally {
      setLoading(false);
    }
  }

  async function updateSubstitution(id: string, action: 'accept' | 'decline') {
    await api.put(`/substitutions/${id}/${action}`);

    if (employee) {
      await loadPortalData(employee);
    }
  }

  if (!user) {
    return (
      <section className="min-h-screen bg-slate-100 p-5 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Portal do servidor</h1>
          <p className="mt-1 text-sm text-slate-500">
            Acesse com o login e senha gerados no cadastro.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Login</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-100 p-5">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold">Portal do servidor</h1>
          <p className="text-sm text-slate-500">
            {employee?.name ?? user.name} • {employee?.school?.name ?? 'Sem escola vinculada'}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Quadro de mensagens</h2>
          <div className="mt-4 grid gap-3">
            {announcementsError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {announcementsError}
              </div>
            )}

            {announcements.map((announcement) => (
              <article
                key={announcement.id}
                className={`rounded-xl border p-4 ${
                  announcement.priority === 1
                    ? 'bg-red-50 border-red-200'
                    : announcement.priority === 2
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-slate-50'
                }`}
              >
                <h3 className="font-semibold">{announcement.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {announcement.message}
                </p>
                <div className="mt-2 text-xs text-slate-500">
                  {announcement.school?.name ?? 'Todas as escolas'}
                </div>
              </article>
            ))}

            {!announcementsError && announcements.length === 0 && (
              <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
                Nenhuma mensagem disponível.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Substituições</h2>
          <div className="mt-4 grid gap-3">
            {substitutionsError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {substitutionsError}
              </div>
            )}

            {pendingSubstitutions.map((substitution) => (
              <div key={substitution.id} className="rounded-xl border bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      Substituir {substitution.absence?.employee?.name ?? 'servidor'}
                    </div>
                    <div className="text-sm text-slate-500">
                      {formatSchedule(substitution)} • {STATUS_LABELS[substitution.status] ?? substitution.status}
                    </div>
                  </div>

                  {substitution.status !== 'ACCEPTED' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSubstitution(substitution.id, 'accept')}
                        className="rounded-lg border border-green-200 bg-white px-3 py-1 text-xs text-green-700 hover:bg-green-50"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => updateSubstitution(substitution.id, 'decline')}
                        className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Recusar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!substitutionsError && pendingSubstitutions.length === 0 && (
              <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
                Nenhuma substituição atribuída.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
