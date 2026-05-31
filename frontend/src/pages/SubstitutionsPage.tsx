import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

type Employee = {
  id: string;
  name: string;
  roleType?: string;
  school?: {
    id: string;
    name: string;
  } | null;
};

type Substitution = {
  id: string;
  weekday?: string | null;
  status: string;
  score: number;
  createdAt: string;
  acceptedAt?: string | null;
  approvedBy?: string | null;
  originalTeacher?: Employee | null;
  substituteTeacher?: Employee | null;
  absence?: {
    startDate: string;
    endDate: string;
    employee?: Employee | null;
  } | null;
  classSchedule?: {
    class?: {
      name: string;
    } | null;
  } | null;
  timeSlot?: {
    startTime: string;
    endTime: string;
  } | null;
};

type SystemSettings = {
  substitutionAcceptanceTimeoutMinutes: number;
};

async function getSubstitutions() {
  const response = await api.get<Substitution[]>('/substitutions');
  return response.data;
}

async function deleteSubstitution(id: string) {
  const response = await api.delete(`/substitutions/${id}`);
  return response.data;
}

async function acceptSubstitution(id: string) {
  const response = await api.put<Substitution>(`/substitutions/${id}/accept`);
  return response.data;
}

async function getSettings() {
  const response = await api.get<SystemSettings>('/settings');
  return response.data;
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString();
}

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terça-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_DIRECTOR: 'Aguardando aceite',
  SENT_TO_TEACHER: 'Enviado ao professor',
  ACCEPTED: 'Aceito',
  DECLINED: 'Recusado',
  CANCELLED: 'Cancelado',
};

const ROLE_LABELS: Record<string, string> = {
  PROFESSOR: 'Professor',
  AUXILIAR: 'Auxiliar',
  ORIENTADOR: 'Orientador',
  DIRETOR: 'Diretor',
  COORDENADOR: 'Coordenador',
  SECRETARIA: 'Secretaria',
  SERVICOS_GERAIS: 'Serviços gerais',
};

const SUBSTITUTE_ROW_COLORS = [
  'bg-blue-50 border-l-4 border-l-blue-500',
  'bg-emerald-50 border-l-4 border-l-emerald-500',
  'bg-amber-50 border-l-4 border-l-amber-500',
  'bg-violet-50 border-l-4 border-l-violet-500',
  'bg-rose-50 border-l-4 border-l-rose-500',
  'bg-cyan-50 border-l-4 border-l-cyan-500',
];

function translateWeekday(value?: string | null) {
  return value ? WEEKDAY_LABELS[value] ?? value : 'Dia não informado';
}

function translateStatus(value?: string | null) {
  return value ? STATUS_LABELS[value] ?? value : '-';
}

function translateRole(value?: string | null) {
  return value ? ROLE_LABELS[value] ?? value.replace(/_/g, ' ') : '-';
}

function formatSchedule(substitution: Substitution) {
  const time = substitution.timeSlot
    ? `${substitution.timeSlot.startTime} - ${substitution.timeSlot.endTime}`
    : 'Horário não informado';

  const weekday = translateWeekday(substitution.weekday);
  const className = substitution.classSchedule?.class?.name;

  return [weekday, time, className].filter(Boolean).join(' • ');
}

function getSubstituteColorMap(substitutions: Substitution[]) {
  const colorBySubstitute = new Map<string, string>();

  substitutions.forEach((substitution) => {
    const substituteKey =
      substitution.substituteTeacher?.id ??
      substitution.substituteTeacher?.name ??
      substitution.id;

    if (!colorBySubstitute.has(substituteKey)) {
      colorBySubstitute.set(
        substituteKey,
        SUBSTITUTE_ROW_COLORS[colorBySubstitute.size % SUBSTITUTE_ROW_COLORS.length],
      );
    }
  });

  return colorBySubstitute;
}

function getAcceptanceDeadline(substitution: Substitution, timeoutMinutes: number) {
  if (!substitution.createdAt) {
    return null;
  }

  return new Date(
    new Date(substitution.createdAt).getTime() +
      timeoutMinutes * 60 * 1000,
  );
}

function formatAcceptanceTimer(
  substitution: Substitution,
  now: number,
  timeoutMinutes: number,
) {
  if (substitution.status === 'ACCEPTED') {
    return substitution.approvedBy === 'AUTO'
      ? 'Aceita automaticamente'
      : 'Aceita pela direção';
  }

  const deadline = getAcceptanceDeadline(substitution, timeoutMinutes);

  if (!deadline) {
    return 'Aguardando aceite';
  }

  const remainingMs = deadline.getTime() - now;

  if (remainingMs <= 0) {
    return 'Aceite automático pendente';
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function canAcceptSubstitution(substitution: Substitution) {
  return substitution.status !== 'ACCEPTED' && substitution.status !== 'CANCELLED';
}

export default function SubstitutionsPage() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const { data: substitutions = [], isLoading, isError } = useQuery({
    queryKey: ['substitutions'],
    queryFn: getSubstitutions,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const acceptanceTimeoutMinutes =
    settings?.substitutionAcceptanceTimeoutMinutes ?? 30;

  const substitutionRowColors = getSubstituteColorMap(substitutions);

  const deleteMutation = useMutation({
    mutationFn: deleteSubstitution,
    onSuccess: async () => {
      alert('Substituição apagada com sucesso.');
      await queryClient.invalidateQueries({ queryKey: ['substitutions'] });
      await queryClient.invalidateQueries({ queryKey: ['absences'] });
    },
    onError: () => {
      alert('Erro ao apagar substituição.');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptSubstitution,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['substitutions'] });
      await queryClient.invalidateQueries({ queryKey: ['absences'] });
    },
    onError: () => {
      alert('Erro ao aceitar substituição.');
    },
  });

  function handleDelete(substitution: Substitution) {
    if (!confirm(`Apagar a substituição de ${substitution.substituteTeacher?.name ?? 'substituto'}?`)) {
      return;
    }

    deleteMutation.mutate(substitution.id);
  }

  return (
    <section className="p-5">
      <div className="bg-white border rounded-2xl shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Substituições</h1>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhe os substitutos selecionados para cada afastamento.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
            Carregando substituições...
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Não foi possível carregar as substituições.
          </div>
        )}

        {!isLoading && !isError && (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Substituto</th>
                  <th className="text-left py-3">Servidor original</th>
                  <th className="text-left py-3">Horário</th>
                  <th className="text-left py-3">Período do afastamento</th>
                  <th className="text-left py-3">Situação</th>
                  <th className="text-left py-3">Tempo para aceite</th>
                  <th className="text-left py-3">Pontuação</th>
                  <th className="text-left py-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {substitutions.map((substitution) => {
                  const substituteKey =
                    substitution.substituteTeacher?.id ??
                    substitution.substituteTeacher?.name ??
                    substitution.id;
                  const rowColor =
                    substitutionRowColors.get(substituteKey) ??
                    'bg-white border-l-4 border-l-transparent';

                  return (
                  <tr key={substitution.id} className={`border-b ${rowColor}`}>
                    <td className="py-3 px-2">
                      <div className="font-medium">
                        {substitution.substituteTeacher?.name ?? 'Não definido'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {translateRole(substitution.substituteTeacher?.roleType)}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="font-medium">
                        {substitution.originalTeacher?.name ?? substitution.absence?.employee?.name ?? '-'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {substitution.originalTeacher?.school?.name ?? substitution.absence?.employee?.school?.name ?? '-'}
                      </div>
                    </td>
                    <td className="py-3">{formatSchedule(substitution)}</td>
                    <td className="py-3">
                      {formatDate(substitution.absence?.startDate)} até {formatDate(substitution.absence?.endDate)}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">
                        {translateStatus(substitution.status)}
                      </span>
                    </td>
                    <td className="py-3">
                      {formatAcceptanceTimer(
                        substitution,
                        now,
                        acceptanceTimeoutMinutes,
                      )}
                    </td>
                    <td className="py-3">{substitution.score}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {canAcceptSubstitution(substitution) && (
                          <button
                            onClick={() => acceptMutation.mutate(substitution.id)}
                            disabled={acceptMutation.isPending}
                            className="px-3 py-1 rounded-lg border border-green-200 bg-white text-xs text-green-700 hover:bg-green-50 disabled:opacity-60"
                          >
                            Aceitar
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(substitution)}
                          disabled={deleteMutation.isPending}
                          className="px-3 py-1 rounded-lg border border-red-200 bg-white text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          Apagar
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}

                {substitutions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      Nenhuma substituição registrada.
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
