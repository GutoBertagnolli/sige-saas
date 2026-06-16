import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

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

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Login',
  CREATE: 'Cadastro',
  UPDATE: 'Edição',
  DELETE: 'Exclusão',
  GENERATE_ACCESS: 'Acesso gerado',
  BULK_REPLACE: 'Planner salvo',
  ACCEPT: 'Aceite',
  DECLINE: 'Recusa',
};

async function getAuditLogs() {
  const response = await api.get<AuditLog[]>('/audit-logs');
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
    data.totalItems !== undefined ? `${data.totalItems} itens` : null,
  ].filter(Boolean);

  return summary.length > 0 ? summary.join(' | ') : 'Registro atualizado';
}

export default function AuditLogsPage() {
  const { data: logs = [], isLoading, isError } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: getAuditLogs,
  });

  return (
    <section className="p-5">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Logs do sistema</h2>
          <p className="text-sm text-slate-500">
            Cadastros, edições, exclusões, alterações de planner e horários de login.
          </p>
        </div>

        {isLoading ? (
          <div className="text-sm text-slate-500">Carregando logs...</div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Não foi possível carregar os logs. O acesso é restrito à Secretaria e Administradores.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-700">
                  <th className="px-3 py-3">Data / horário</th>
                  <th className="px-3 py-3">Usuário</th>
                  <th className="px-3 py-3">Ação</th>
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
                      Nenhum log registrado até o momento.
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
