import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

type Employee = {
  id: string;
  name: string;
  roleType?: string;
  school?: {
    id: string;
    name: string;
  };
};

type Absence = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  type?: string;
  employeeId?: string;
  employee?: Employee;
};

type ReplacementSuggestion = {
  absenceId: string;
  originalTeacherId: string;
  weekday: string;
  timeSlot?: {
    id: string;
    startTime: string;
    endTime: string;
  };
  replacements: Array<{
    employeeId: string;
    name: string;
    roleType?: string;
    priority: number;
    reason: string;
  }>;
};

async function getEmployees() {
  const response = await api.get<Employee[]>('/employees');
  return response.data;
}

async function getAbsences() {
  const response = await api.get<Absence[]>('/absences');
  return response.data;
}

async function createAbsence(data: any) {
  const response = await api.post('/absences', data);
  return response.data;
}

async function createSubstitution(data: any) {
  const response = await api.post('/substitutions', data);
  return response.data;
}

async function getReplacementSuggestions(absenceId: string) {
  const response = await api.get(`/absences/${absenceId}/replacements`);
  return response.data;
}

export default function AbsencesPage() {
  const queryClient = useQueryClient();

  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('ATESTADO');
  const [description, setDescription] = useState('');
  const [replacementSuggestions, setReplacementSuggestions] = useState<ReplacementSuggestion[]>([]);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const { data: absences = [] } = useQuery({
    queryKey: ['absences'],
    queryFn: getAbsences,
  });

  const substitutionMutation = useMutation({
    mutationFn: createSubstitution,
    onSuccess: async () => {
      alert('Substituição registrada com sucesso.');
      await queryClient.invalidateQueries({ queryKey: ['absences'] });
    },
    onError: () => {
      alert('Erro ao registrar substituição.');
    },
  });

  const createMutation = useMutation({
    mutationFn: createAbsence,
    onSuccess: async (savedAbsence: Absence) => {
      alert('Afastamento salvo com sucesso.');

      const suggestions = await getReplacementSuggestions(savedAbsence.id);

      const normalizedSuggestions = suggestions.map((slot: any) => ({
        ...slot,
        absenceId: savedAbsence.id,
        originalTeacherId: savedAbsence.employeeId || employeeId,
      }));

      setReplacementSuggestions(normalizedSuggestions);

      await queryClient.invalidateQueries({ queryKey: ['absences'] });

      setEmployeeId('');
      setStartDate('');
      setEndDate('');
      setReason('ATESTADO');
      setDescription('');
    },
    onError: () => {
      alert('Erro ao salvar afastamento.');
    },
  });

  function handleSubmit() {
    const employee = employees.find((item) => item.id === employeeId);

    if (!employee) {
      alert('Selecione um servidor.');
      return;
    }

    if (!startDate || !endDate) {
      alert('Informe a data inicial e a data final.');
      return;
    }

    createMutation.mutate({
      employeeId,
      startDate: `${startDate}T00:00:00.000Z`,
      endDate: `${endDate}T23:59:59.000Z`,
      reason,
      status: 'OPEN',
      type: reason,
    });
  }

  function handleSelectSubstitute(slot: ReplacementSuggestion, replacement: ReplacementSuggestion['replacements'][number]) {
    if (!slot.absenceId || !slot.originalTeacherId || !slot.timeSlot?.id) {
      alert('Dados insuficientes para registrar a substituição.');
      return;
    }

    substitutionMutation.mutate({
      absenceId: slot.absenceId,
      timeSlotId: slot.timeSlot.id,
      weekday: slot.weekday,
      originalTeacherId: slot.originalTeacherId,
      substituteTeacherId: replacement.employeeId,
      score: replacement.priority,
      status: 'PENDING_DIRECTOR',
    });
  }

  return (
    <section className="p-5">
      <div className="bg-white border rounded-2xl shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Afastamentos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle de faltas, licenças e afastamentos.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium">Servidor</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Data inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Data final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Motivo</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            >
              <option value="ATESTADO">Atestado</option>
              <option value="LICENCA">Licença</option>
              <option value="FERIAS">Férias</option>
              <option value="CURSO">Curso</option>
              <option value="REUNIAO">Reunião</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="w-full bg-slate-900 text-white rounded-xl px-4 py-2 text-sm disabled:opacity-60"
            >
              {createMutation.isPending ? 'Salvando...' : 'Salvar afastamento'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium">Observações</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Campo apenas informativo nesta versão."
          />
        </div>

        {replacementSuggestions.length > 0 && (
          <div className="mb-6 border rounded-2xl p-5 bg-slate-50">
            <h2 className="font-semibold mb-3">Sugestões automáticas de substituição</h2>

            <div className="grid gap-4">
              {replacementSuggestions.map((slot, index) => (
                <div
                  key={`${slot.weekday}-${slot.timeSlot?.id || index}`}
                  className="bg-white border rounded-xl p-4"
                >
                  <div className="font-medium mb-2">
                    {slot.weekday} • {slot.timeSlot?.startTime} - {slot.timeSlot?.endTime}
                  </div>

                  {slot.replacements?.length > 0 ? (
                    <div className="grid gap-2">
                      {slot.replacements.map((replacement) => (
                        <div
                          key={replacement.employeeId}
                          className={`flex justify-between items-center gap-3 border rounded-lg px-3 py-2 text-sm ${
                            replacement.priority <= 2
                              ? 'bg-green-50'
                              : replacement.priority === 3
                                ? 'bg-yellow-50'
                                : replacement.priority <= 5
                                  ? 'bg-orange-50'
                                  : 'bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="font-medium">{replacement.name}</div>
                            <div className="text-xs text-slate-500">
                              {replacement.roleType?.replace(/_/g, ' ') || 'FUNÇÃO NÃO INFORMADA'} • {replacement.reason}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xs font-semibold">
                              Prioridade {replacement.priority}
                            </div>

                            <button
                              onClick={() => handleSelectSubstitute(slot, replacement)}
                              disabled={substitutionMutation.isPending}
                              className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs disabled:opacity-60"
                            >
                              Selecionar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      Nenhum substituto sugerido para este horário.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Servidor</th>
                <th className="text-left py-3">Função</th>
                <th className="text-left py-3">Escola</th>
                <th className="text-left py-3">Início</th>
                <th className="text-left py-3">Fim</th>
                <th className="text-left py-3">Motivo</th>
                <th className="text-left py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {absences.map((absence) => (
                <tr key={absence.id} className="border-b">
                  <td className="py-3">{absence.employee?.name}</td>
                  <td className="py-3">
                    {absence.employee?.roleType?.replace(/_/g, ' ') || '-'}
                  </td>
                  <td className="py-3">{absence.employee?.school?.name || '-'}</td>
                  <td className="py-3">
                    {new Date(absence.startDate).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    {new Date(absence.endDate).toLocaleDateString()}
                  </td>
                  <td className="py-3">{absence.reason}</td>
                  <td className="py-3">{absence.status}</td>
                </tr>
              ))}

              {absences.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    Nenhum afastamento cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
