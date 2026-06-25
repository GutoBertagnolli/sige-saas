import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CHANGELOG } from '../changelog';
import { api } from '../services/api';
import { APP_VERSION } from '../version';

type AuditUser = {
  name: string;
  email: string;
  role?: {
    name: string;
  } | null;
  employee?: {
    roleType?: string;
  } | null;
};

type AuditLog = {
  id: string;
  entity: string;
  entityId?: string | null;
  action: string;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string | null;
  createdAt: string;
  user?: AuditUser | null;
};

type OnlineSession = {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  lastSeenAt: string;
  createdAt: string;
  isCurrentSession: boolean;
  user: AuditUser;
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Login',
  CREATE: 'Cadastro',
  UPDATE: 'Edicao',
  DELETE: 'Exclusao',
  GENERATE_ACCESS: 'Acesso gerado',
  BULK_REPLACE: 'Planner salvo',
  ACCEPT: 'Aceite',
  DECLINE: 'Recusa',
  FORCE_LOGOFF: 'Logoff forcado',
  FORCE_LOGOFF_ALL: 'Logoff geral',
};

async function getAuditLogs() {
  const response = await api.get<AuditLog[]>('/audit-logs');
  return response.data;
}

async function getOnlineSessions() {
  const response = await api.get<OnlineSession[]>('/audit-logs/sessions');
  return response.data;
}

async function forceLogoutSession(id: string) {
  const response = await api.put<OnlineSession[]>(`/audit-logs/sessions/${id}/logout`);
  return response.data;
}

async function forceLogoutAll() {
  const response = await api.put<OnlineSession[]>('/audit-logs/sessions/logout-all');
  return response.data;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function summarizeData(value: unknown) {
  if (!value || typeof value !== 'object') return '-';

  const data = value as Record<string, any>;
  const summary = [
    data.name,
    data.title,
    data.email,
    data.loginEmail,
    data.type,
    data.status,
    data.ipAddress,
    data.totalItems !== undefined ? `${data.totalItems} itens` : null,
  ].filter(Boolean);

  return summary.length > 0 ? summary.join(' | ') : 'Registro atualizado';
}

export default function AuditLogsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'sessions' | 'history' | 'updates'>('updates');

  const { data: logs = [], isLoading, isError } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: getAuditLogs,
    enabled: activeTab === 'history',
  });
  const {
    data: sessions = [],
    isLoading: sessionsLoading,
    isError: sessionsError,
  } = useQuery({
    queryKey: ['audit-log-sessions'],
    queryFn: getOnlineSessions,
    refetchInterval: 60_000,
  });
  const forceLogoutMutation = useMutation({
    mutationFn: forceLogoutSession,
    onSuccess: (updatedSessions) => {
      queryClient.setQueryData(['audit-log-sessions'], updatedSessions);
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message ?? 'Erro ao forcar logoff.');
    },
  });
  const forceLogoutAllMutation = useMutation({
    mutationFn: forceLogoutAll,
    onSuccess: (updatedSessions) => {
      queryClient.setQueryData(['audit-log-sessions'], updatedSessions);
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message ?? 'Erro ao forcar logoff geral.');
    },
  });

  return (
    <section className="p-5">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Logs do sistema</h2>
          <p className="text-sm text-slate-500">
            Sessoes online, historico de acoes e atualizacoes do SIGE.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border bg-slate-50 p-1">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                activeTab === 'sessions' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                activeTab === 'updates' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Atualizacoes
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                activeTab === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Historico
            </button>
          </div>

          {activeTab === 'sessions' && sessions.length > 1 && (
            <button
              onClick={() => {
                if (confirm('Forcar logoff de todos os outros usuarios online?')) {
                  forceLogoutAllMutation.mutate();
                }
              }}
              disabled={forceLogoutAllMutation.isPending}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {forceLogoutAllMutation.isPending ? 'Derrubando...' : 'Forcar logoff de todos'}
            </button>
          )}
        </div>

        {activeTab === 'sessions' ? (
          sessionsLoading ? (
            <div className="text-sm text-slate-500">Carregando sessoes online...</div>
          ) : sessionsError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Nao foi possivel carregar as sessoes. O acesso e restrito a Secretaria e Administradores.
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-slate-700">
                    <th className="px-3 py-3">Usuario</th>
                    <th className="px-3 py-3">Perfil</th>
                    <th className="px-3 py-3">IP</th>
                    <th className="px-3 py-3">Online desde</th>
                    <th className="px-3 py-3">Ultimo sinal</th>
                    <th className="px-3 py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b last:border-b-0">
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-950">
                          {session.user.name}
                          {session.isCurrentSession && (
                            <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                              Voce
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{session.user.email}</div>
                      </td>
                      <td className="px-3 py-3">
                        {session.user.role?.name ?? session.user.employee?.roleType ?? '-'}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{session.ipAddress ?? '-'}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(session.createdAt)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(session.lastSeenAt)}</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Forcar logoff de ${session.user.name}?`)) {
                              forceLogoutMutation.mutate(session.id);
                            }
                          }}
                          disabled={session.isCurrentSession || forceLogoutMutation.isPending}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Forcar logoff
                        </button>
                      </td>
                    </tr>
                  ))}

                  {sessions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        Nenhuma sessao online nos ultimos 5 minutos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'updates' ? (
          <div className="space-y-5">
            <div className="rounded-2xl border bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Versao atual instalada</p>
              <div className="mt-1 flex flex-wrap items-end gap-3">
                <h3 className="text-3xl font-semibold text-slate-950">{APP_VERSION}</h3>
                <span className="pb-1 text-sm text-slate-500">
                  Consulte abaixo as principais modificacoes e melhorias.
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {CHANGELOG.map((entry) => (
                <article key={entry.version} className="rounded-2xl border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          v{entry.version}
                        </span>
                        {entry.version === APP_VERSION && (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            Atual
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-slate-950">
                        {entry.title}
                      </h3>
                    </div>
                    <span className="text-sm text-slate-500">{entry.date}</span>
                  </div>

                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {entry.changes.map((change) => (
                      <li key={change} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-sm text-slate-500">Carregando logs...</div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Nao foi possivel carregar os logs. O acesso e restrito a Secretaria e Administradores.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-700">
                  <th className="px-3 py-3">Data / horario</th>
                  <th className="px-3 py-3">Usuario</th>
                  <th className="px-3 py-3">Acao</th>
                  <th className="px-3 py-3">Cadastro</th>
                  <th className="px-3 py-3">Resumo</th>
                  <th className="px-3 py-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-b-0">
                    <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-950">{log.user?.name ?? 'Sistema'}</div>
                      <div className="text-xs text-slate-500">{log.user?.email ?? '-'}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-md border bg-slate-50 px-2 py-1 text-xs font-medium">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-3 py-3">{log.entity}</td>
                    <td className="px-3 py-3 text-slate-600">{summarizeData(log.newData)}</td>
                    <td className="px-3 py-3 text-slate-500">{log.ipAddress ?? '-'}</td>
                  </tr>
                ))}

                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      Nenhum log registrado ate o momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
