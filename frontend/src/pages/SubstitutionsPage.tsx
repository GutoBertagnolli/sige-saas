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

async function getSubstitutions() {
  const response = await api.get<Substitution[]>('/substitutions');
  return response.data;
}

async function deleteSubstitution(id: string) {
  const response = await api.delete(`/substitutions/${id}`);
  return response.data;
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString();
}

function formatSchedule(substitution: Substitution) {
  const time = substitution.timeSlot
    ? `${substitution.timeSlot.startTime} - ${substitution.timeSlot.endTime}`
    : 'Horário não informado';

  const weekday = substitution.weekday ?? 'Dia não informado';
  const className = substitution.classSchedule?.class?.name;

  return [weekday, time, className].filter(Boolean).join(' • ');
}

export default function SubstitutionsPage() {
  const queryClient = useQueryClient();

  const { data: substitutions = [], isLoading, isError } = useQuery({
    queryKey: ['substitutions'],
    queryFn: getSubstitutions,
  });

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
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Pontuação</th>
                  <th className="text-left py-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {substitutions.map((substitution) => (
                  <tr key={substitution.id} className="border-b">
                    <td className="py-3">
                      <div className="font-medium">
                        {substitution.substituteTeacher?.name ?? 'Não definido'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {substitution.substituteTeacher?.roleType?.replace(/_/g, ' ') ?? '-'}
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
                        {substitution.status}
                      </span>
                    </td>
                    <td className="py-3">{substitution.score}</td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDelete(substitution)}
                        disabled={deleteMutation.isPending}
                        className="px-3 py-1 rounded-lg border border-red-200 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        Apagar
                      </button>
                    </td>
                  </tr>
                ))}

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
