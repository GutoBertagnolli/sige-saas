import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Megaphone,
  RefreshCw,
  School,
  TrendingUp,
  UserX,
  Users,
} from 'lucide-react';
import { api } from '../services/api';

type DashboardSummary = {
  cards: {
    substituicoesPendentes: number;
    substituicoesSemProfessor: number;
    afastamentosAtivos: number;
    afastamentosVencendo: number;
    escolasComPendencia: number;
    servidoresIndisponiveisHoje: number;
  };
  alertas: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
  }>;
  agendaHoje: Array<{
    id: string;
    horario: string;
    escola: string;
    turma: string;
    disciplina: string;
    servidorTitular: string;
    substituto: string;
    situacao: string;
    status: string;
  }>;
  rankingEscolas: Array<{
    schoolId: string;
    escola: string;
    afastamentos: number;
    substituicoes: number;
    pendencias: number;
    status: string;
  }>;
  mensagens: Array<{
    id: string;
    title: string;
    createdBy?: string | null;
    createdAt: string;
  }>;
  atividadesRecentes: Array<{
    id: string;
    action: string;
    entity: string;
    userName: string;
    createdAt: string;
    description: string;
  }>;
  fluxoSubstituicoes: {
    criadas: number;
    aguardandoDiretor: number;
    aguardandoOrientacao: number;
    aprovadas: number;
    recusadas: number;
    canceladas: number;
  };
};

const dashboardCards = [
  {
    key: 'substituicoesPendentes',
    label: 'Substituicoes pendentes',
    hint: 'Aguardando aprovacao ou retorno',
    icon: Clock,
    tone: 'text-amber-700 bg-amber-50',
  },
  {
    key: 'substituicoesSemProfessor',
    label: 'Sem professor',
    hint: 'Aulas que ainda precisam de substituto',
    icon: UserX,
    tone: 'text-red-700 bg-red-50',
  },
  {
    key: 'afastamentosAtivos',
    label: 'Afastamentos ativos',
    hint: 'Servidores afastados hoje',
    icon: CalendarDays,
    tone: 'text-sky-700 bg-sky-50',
  },
  {
    key: 'afastamentosVencendo',
    label: 'Afastamentos vencendo',
    hint: 'Terminam hoje ou nos proximos dias',
    icon: FileText,
    tone: 'text-indigo-700 bg-indigo-50',
  },
  {
    key: 'escolasComPendencia',
    label: 'Escolas com pendencia',
    hint: 'Unidades que precisam de atencao',
    icon: School,
    tone: 'text-orange-700 bg-orange-50',
  },
  {
    key: 'servidoresIndisponiveisHoje',
    label: 'Indisponiveis hoje',
    hint: 'Servidores sem disponibilidade no dia',
    icon: Users,
    tone: 'text-slate-700 bg-slate-100',
  },
] as const;

const alertStyles = {
  critical: 'border-red-200 bg-red-50 text-red-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  info: 'border-sky-200 bg-sky-50 text-sky-950',
};

async function getDashboardSummary() {
  const response = await api.get<DashboardSummary>('/dashboard/summary');
  return response.data;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === 'Substituido' || status === 'Normal') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (status === 'Sem substituto' || status === 'Atencao') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (status === 'Cancelado' || status === 'Recusado') {
    return 'border-slate-200 bg-slate-100 text-slate-600';
  }

  return 'border-amber-200 bg-amber-50 text-amber-700';
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary,
  });

  if (isLoading) {
    return (
      <section className="grid gap-4 p-5">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="h-5 w-52 animate-pulse rounded bg-slate-200" />
          <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="p-5">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
          <div className="font-semibold">Nao foi possivel carregar o dashboard.</div>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  const flowItems = [
    ['Criadas', data.fluxoSubstituicoes.criadas],
    ['Aguardando diretor', data.fluxoSubstituicoes.aguardandoDiretor],
    ['Aguardando orientacao', data.fluxoSubstituicoes.aguardandoOrientacao],
    ['Aprovadas', data.fluxoSubstituicoes.aprovadas],
    ['Recusadas', data.fluxoSubstituicoes.recusadas],
    ['Canceladas', data.fluxoSubstituicoes.canceladas],
  ];

  return (
    <section className="grid gap-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Painel operacional</h2>
          <p className="text-sm text-slate-500">Situacao do dia, pendencias e pontos que exigem acao.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          const value = data.cards[card.key];

          return (
            <div key={card.key} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-3xl font-bold text-slate-950">{value}</div>
              <div className="mt-1 font-semibold text-slate-900">{card.label}</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">{card.hint}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-slate-950">Atencao necessaria</h3>
        </div>
        {data.alertas.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />
            Nenhuma pendencia critica encontrada no momento.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {data.alertas.map((alerta) => (
              <div key={alerta.id} className={`rounded-xl border p-4 ${alertStyles[alerta.severity]}`}>
                <div className="font-semibold">{alerta.title}</div>
                <div className="mt-1 text-sm leading-5 opacity-90">{alerta.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-950">Agenda do dia</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3 font-semibold">Horario</th>
                <th className="px-3 py-3 font-semibold">Escola</th>
                <th className="px-3 py-3 font-semibold">Turma</th>
                <th className="px-3 py-3 font-semibold">Disciplina</th>
                <th className="px-3 py-3 font-semibold">Servidor titular</th>
                <th className="px-3 py-3 font-semibold">Substituto</th>
                <th className="px-3 py-3 font-semibold">Situacao</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.agendaHoje.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-3 font-semibold text-slate-950">{item.horario}</td>
                  <td className="px-3 py-3 text-slate-700">{item.escola}</td>
                  <td className="px-3 py-3 text-slate-700">{item.turma}</td>
                  <td className="px-3 py-3 text-slate-700">{item.disciplina}</td>
                  <td className="px-3 py-3 text-slate-700">{item.servidorTitular}</td>
                  <td className="px-3 py-3 text-slate-700">{item.substituto}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(item.situacao)}`}>
                      {item.situacao}
                    </span>
                  </td>
                </tr>
              ))}
              {data.agendaHoje.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    Nenhuma ocorrencia operacional para hoje.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <School className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-950">Escolas com mais ocorrencias</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Escola</th>
                  <th className="px-3 py-3 font-semibold">Afastamentos</th>
                  <th className="px-3 py-3 font-semibold">Substituicoes</th>
                  <th className="px-3 py-3 font-semibold">Pendencias</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.rankingEscolas.map((school) => (
                  <tr key={school.schoolId}>
                    <td className="px-3 py-3 font-semibold text-slate-950">{school.escola}</td>
                    <td className="px-3 py-3 text-slate-700">{school.afastamentos}</td>
                    <td className="px-3 py-3 text-slate-700">{school.substituicoes}</td>
                    <td className="px-3 py-3 text-slate-700">{school.pendencias}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(school.status)}`}>
                        {school.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.rankingEscolas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      Nenhuma escola encontrada no escopo atual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-950">Fluxo de substituicoes</h3>
          </div>
          <div className="grid gap-2">
            {flowItems.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">{label}</span>
                <span className="text-lg font-bold text-slate-950">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-950">Comunicados recentes</h3>
          </div>
          <div className="grid gap-3">
            {data.mensagens.map((message) => (
              <div key={message.id} className="rounded-xl border bg-slate-50 p-4">
                <div className="font-semibold text-slate-950">{message.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {message.createdBy || 'Direcao'} - {formatDateTime(message.createdAt)}
                </div>
              </div>
            ))}
            {data.mensagens.length === 0 && (
              <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
                Nenhum aviso publicado hoje.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-950">Ultimas atividades</h3>
          </div>
          <div className="grid gap-3">
            {data.atividadesRecentes.map((activity) => (
              <div key={activity.id} className="rounded-xl border bg-slate-50 p-4">
                <div className="font-semibold text-slate-950">{activity.description}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {activity.userName} - {formatDateTime(activity.createdAt)}
                </div>
              </div>
            ))}
            {data.atividadesRecentes.length === 0 && (
              <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
                Nenhuma atividade recente encontrada.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
