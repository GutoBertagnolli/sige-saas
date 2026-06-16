import { useEffect, useMemo, useState } from 'react';
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
  absenceId: string;
  weekday?: string | null;
  classScheduleId?: string | null;
  timeSlotId?: string | null;
  status: string;
  score?: number;
  createdAt?: string;
  acceptedAt?: string | null;
  approvedBy?: string | null;
  originalTeacher?: Employee | null;
  substituteTeacher?: Employee | null;
  timeSlot?: {
    id?: string;
    startTime: string;
    endTime: string;
  } | null;
  classSchedule?: {
    class?: {
      name: string;
    } | null;
  } | null;
};

type Absence = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  documentUrl?: string | null;
  status: string;
  type?: string;
  employeeId?: string;
  employee?: Employee;
  substitutions?: Substitution[];
};

type ReplacementSuggestion = {
  absenceId: string;
  originalTeacherId: string;
  weekday: string;
  classScheduleId?: string | null;
  className?: string | null;
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

type SystemSettings = {
  substitutionAcceptanceTimeoutMinutes: number;
};

async function getEmployees() {
  const response = await api.get<Employee[]>('/employees');
  return response.data;
}

async function getAbsences() {
  const response = await api.get<Absence[]>('/absences');
  return response.data;
}

async function saveAbsence(data: any) {
  if (data.id) {
    const { id, ...payload } = data;
    const response = await api.put(`/absences/${id}`, payload);
    return response.data;
  }

  const response = await api.post('/absences', data);
  return response.data;
}

async function deleteAbsence(id: string) {
  const response = await api.delete(`/absences/${id}`);
  return response.data;
}

async function createSubstitution(data: any) {
  const response = await api.post<Substitution>('/substitutions', data);
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

async function getReplacementSuggestions(absenceId: string) {
  const response = await api.get<ReplacementSuggestion[]>(`/absences/${absenceId}/replacements`);
  return response.data;
}

async function getSettings() {
  const response = await api.get<SystemSettings>('/settings');
  return response.data;
}

function getSuggestionKey(slot: ReplacementSuggestion) {
  return [
    slot.absenceId,
    slot.weekday,
    slot.timeSlot?.id ?? '',
    slot.classScheduleId ?? '',
  ].join('|');
}

function getSubstitutionKey(substitution: Substitution) {
  return [
    substitution.absenceId,
    substitution.weekday ?? '',
    substitution.timeSlotId ?? substitution.timeSlot?.id ?? '',
    substitution.classScheduleId ?? '',
  ].join('|');
}

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terca-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sabado',
  SUNDAY: 'Domingo',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto',
  SUBSTITUTIONS_GENERATED: 'Substituicoes geradas',
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
  SECRETARIA: 'Secretaria',
  SERVICOS_GERAIS: 'Servicos gerais',
};

const SUBSTITUTE_ROW_COLORS = [
  'bg-blue-50 border-l-4 border-l-blue-500',
  'bg-emerald-50 border-l-4 border-l-emerald-500',
  'bg-amber-50 border-l-4 border-l-amber-500',
  'bg-violet-50 border-l-4 border-l-violet-500',
  'bg-rose-50 border-l-4 border-l-rose-500',
  'bg-cyan-50 border-l-4 border-l-cyan-500',
];

type AbsenceTab = 'cadastro' | 'sugestoes' | 'substituicoes' | 'historico';

const tabs: Array<{ id: AbsenceTab; label: string }> = [
  { id: 'cadastro', label: 'Cadastro de afastamento' },
  { id: 'sugestoes', label: 'Sugestao de substituicao' },
  { id: 'substituicoes', label: 'Substituicoes efetuadas' },
  { id: 'historico', label: 'Consulta por servidor' },
];

function translateWeekday(value?: string | null) {
  return value ? WEEKDAY_LABELS[value] ?? value : 'Dia nao informado';
}

function translateStatus(value?: string | null) {
  return value ? STATUS_LABELS[value] ?? value : '-';
}

function translateRole(value?: string | null) {
  return value ? ROLE_LABELS[value] ?? value.replace(/_/g, ' ') : '-';
}

function formatSubstitutionSchedule(substitution: Substitution) {
  const weekday = translateWeekday(substitution.weekday);
  const time = substitution.timeSlot
    ? `${substitution.timeSlot.startTime} - ${substitution.timeSlot.endTime}`
    : 'Horario nao informado';
  const className = substitution.classSchedule?.class?.name;

  return [weekday, time, className].filter(Boolean).join(' - ');
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
      : 'Aceita pela direcao';
  }

  const deadline = getAcceptanceDeadline(substitution, timeoutMinutes);

  if (!deadline) {
    return 'Aguardando aceite';
  }

  const remainingMs = deadline.getTime() - now;

  if (remainingMs <= 0) {
    return 'Aceite automatico pendente';
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function canAcceptSubstitution(substitution: Substitution) {
  return substitution.status !== 'ACCEPTED' && substitution.status !== 'CANCELLED';
}

function toInputDate(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export default function AbsencesPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<AbsenceTab>('cadastro');
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('ATESTADO');
  const [description, setDescription] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [replacementSuggestions, setReplacementSuggestions] = useState<ReplacementSuggestion[]>([]);
  const [selectedSubstitutions, setSelectedSubstitutions] = useState<Substitution[]>([]);
  const [now, setNow] = useState(Date.now());
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [substitutionEmployeeFilter, setSubstitutionEmployeeFilter] = useState('');
  const [historyEmployeeId, setHistoryEmployeeId] = useState('');

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const { data: absences = [] } = useQuery({
    queryKey: ['absences'],
    queryFn: getAbsences,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const acceptanceTimeoutMinutes =
    settings?.substitutionAcceptanceTimeoutMinutes ?? 30;

  const selectedSlotKeys = useMemo(() => {
    const keys = new Set<string>();

    for (const absence of absences) {
      for (const substitution of absence.substitutions ?? []) {
        keys.add(getSubstitutionKey(substitution));
      }
    }

    for (const substitution of selectedSubstitutions) {
      keys.add(getSubstitutionKey(substitution));
    }

    return keys;
  }, [absences, selectedSubstitutions]);

  const allSubstitutions = useMemo(() => {
    const substitutionsById = new Map<string, Substitution>();

    for (const absence of absences) {
      for (const substitution of absence.substitutions ?? []) {
        substitutionsById.set(substitution.id, substitution);
      }
    }

    for (const substitution of selectedSubstitutions) {
      substitutionsById.set(substitution.id, substitution);
    }

    return Array.from(substitutionsById.values());
  }, [absences, selectedSubstitutions]);

  const filteredSubstitutions = useMemo(() => {
    if (!substitutionEmployeeFilter) {
      return allSubstitutions;
    }

    return allSubstitutions.filter(
      (substitution) =>
        substitution.substituteTeacher?.id === substitutionEmployeeFilter,
    );
  }, [allSubstitutions, substitutionEmployeeFilter]);

  const substitutionRowColors = useMemo(
    () => getSubstituteColorMap(filteredSubstitutions),
    [filteredSubstitutions],
  );

  const substituteOptions = useMemo(() => {
    const options = new Map<string, string>();

    allSubstitutions.forEach((substitution) => {
      if (substitution.substituteTeacher?.id) {
        options.set(
          substitution.substituteTeacher.id,
          substitution.substituteTeacher.name,
        );
      }
    });

    return Array.from(options.entries()).map(([id, name]) => ({ id, name }));
  }, [allSubstitutions]);

  const historyAbsences = useMemo(() => {
    if (!historyEmployeeId) {
      return absences;
    }

    return absences.filter(
      (absence) =>
        (absence.employeeId || absence.employee?.id) === historyEmployeeId,
    );
  }, [absences, historyEmployeeId]);

  const selectedHistoryEmployee = employees.find(
    (employee) => employee.id === historyEmployeeId,
  );

  const historyDocumentCount = historyAbsences.filter(
    (absence) => Boolean(absence.documentUrl),
  ).length;

  const substitutionMutation = useMutation({
    mutationFn: createSubstitution,
    onSuccess: async (substitution) => {
      setSelectedSubstitutions((current) => [
        substitution,
        ...current.filter((item) => item.id !== substitution.id),
      ]);
      setActiveTab('substituicoes');

      await queryClient.invalidateQueries({ queryKey: ['absences'] });
      await queryClient.invalidateQueries({ queryKey: ['substitutions'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message ?? 'Erro ao registrar substituicao.');
    },
  });

  const deleteSubstitutionMutation = useMutation({
    mutationFn: deleteSubstitution,
    onSuccess: async (_deleted, id) => {
      setSelectedSubstitutions((current) => current.filter((item) => item.id !== id));
      await queryClient.invalidateQueries({ queryKey: ['absences'] });
      await queryClient.invalidateQueries({ queryKey: ['substitutions'] });
    },
    onError: () => {
      alert('Erro ao apagar substituicao.');
    },
  });

  const acceptSubstitutionMutation = useMutation({
    mutationFn: acceptSubstitution,
    onSuccess: async (accepted) => {
      setSelectedSubstitutions((current) => [
        accepted,
        ...current.filter((item) => item.id !== accepted.id),
      ]);
      await queryClient.invalidateQueries({ queryKey: ['absences'] });
      await queryClient.invalidateQueries({ queryKey: ['substitutions'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message ?? 'Erro ao aceitar substituicao.');
    },
  });

  const deleteAbsenceMutation = useMutation({
    mutationFn: deleteAbsence,
    onSuccess: async (_deleted, id) => {
      setReplacementSuggestions((current) => current.filter((slot) => slot.absenceId !== id));
      setSelectedSubstitutions((current) => current.filter((item) => item.absenceId !== id));
      await queryClient.invalidateQueries({ queryKey: ['absences'] });
      await queryClient.invalidateQueries({ queryKey: ['substitutions'] });
    },
    onError: () => {
      alert('Erro ao apagar afastamento.');
    },
  });

  const saveAbsenceMutation = useMutation({
    mutationFn: saveAbsence,
    onSuccess: async (savedAbsence: Absence) => {
      if (!editingAbsence) {
        await loadReplacementSuggestions(savedAbsence);
        setActiveTab('sugestoes');
      }

      await queryClient.invalidateQueries({ queryKey: ['absences'] });
      resetAbsenceForm();
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message ?? 'Erro ao salvar afastamento.');
    },
  });

  async function loadReplacementSuggestions(absence: Absence) {
    const suggestions = await getReplacementSuggestions(absence.id);
    const normalizedSuggestions = suggestions.map((slot) => ({
      ...slot,
      absenceId: absence.id,
      originalTeacherId: slot.originalTeacherId || absence.employeeId || absence.employee?.id || employeeId,
    }));

    setReplacementSuggestions(normalizedSuggestions);
    setActiveTab('sugestoes');
  }

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

    saveAbsenceMutation.mutate({
      id: editingAbsence?.id,
      employeeId,
      startDate: `${startDate}T00:00:00.000Z`,
      endDate: `${endDate}T23:59:59.000Z`,
      reason,
      documentUrl: documentUrl || null,
      status: 'OPEN',
      type: reason,
    });
  }

  function resetAbsenceForm() {
    setEditingAbsence(null);
    setEmployeeId('');
    setStartDate('');
    setEndDate('');
    setReason('ATESTADO');
    setDescription('');
    setDocumentUrl('');
    setDocumentName('');
  }

  function handleEditAbsence(absence: Absence) {
    setEditingAbsence(absence);
    setEmployeeId(absence.employeeId || absence.employee?.id || '');
    setStartDate(toInputDate(absence.startDate));
    setEndDate(toInputDate(absence.endDate));
    setReason(absence.reason || absence.type || 'ATESTADO');
    setDocumentUrl(absence.documentUrl || '');
    setDocumentName(absence.documentUrl ? 'Documento anexado' : '');
    setDescription('');
    setActiveTab('cadastro');
  }

  function handleDocumentChange(file?: File) {
    if (!file) {
      setDocumentUrl('');
      setDocumentName('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDocumentUrl(String(reader.result || ''));
      setDocumentName(file.name);
    };
    reader.readAsDataURL(file);
  }

  function handleSelectSubstitute(slot: ReplacementSuggestion, replacement: ReplacementSuggestion['replacements'][number]) {
    if (!slot.absenceId || !slot.originalTeacherId || !slot.timeSlot?.id) {
      alert('Dados insuficientes para registrar a substituicao.');
      return;
    }

    if (selectedSlotKeys.has(getSuggestionKey(slot))) {
      alert('Este horario ja tem um professor substituto selecionado. Apague a substituicao atual antes de selecionar outro.');
      return;
    }

    substitutionMutation.mutate({
      absenceId: slot.absenceId,
      classScheduleId: slot.classScheduleId ?? null,
      timeSlotId: slot.timeSlot.id,
      weekday: slot.weekday,
      originalTeacherId: slot.originalTeacherId,
      substituteTeacherId: replacement.employeeId,
      score: replacement.priority,
      status: 'PENDING_DIRECTOR',
    });
  }

  function handleDeleteAbsence(absence: Absence) {
    if (!confirm(`Apagar o afastamento de ${absence.employee?.name ?? 'servidor'}? As substituicoes vinculadas tambem serao apagadas.`)) {
      return;
    }

    deleteAbsenceMutation.mutate(absence.id);
  }

  function handleDeleteSubstitution(substitution: Substitution) {
    if (!confirm(`Apagar a substituicao de ${substitution.substituteTeacher?.name ?? 'substituto'}?`)) {
      return;
    }

    deleteSubstitutionMutation.mutate(substitution.id);
  }

  return (
    <section className="p-5">
      <div className="bg-white border rounded-2xl shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Afastamentos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre afastamentos, gere sugestoes e acompanhe substituicoes em abas separadas.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'border bg-white hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'cadastro' && (
          <div>
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
                  <option value="LICENCA">Licenca</option>
                  <option value="FERIAS">Ferias</option>
                  <option value="CURSO">Curso</option>
                  <option value="REUNIAO">Reuniao</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSubmit}
                  disabled={saveAbsenceMutation.isPending}
                  className="w-full bg-slate-900 text-white rounded-xl px-4 py-2 text-sm disabled:opacity-60"
                >
                  {saveAbsenceMutation.isPending
                    ? 'Salvando...'
                    : editingAbsence
                      ? 'Salvar alteracoes'
                      : 'Salvar afastamento'}
                </button>
              </div>
            </div>

            {editingAbsence && (
              <div className="mb-6">
                <button
                  onClick={resetAbsenceForm}
                  className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Cancelar edicao
                </button>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Observacoes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                placeholder="Campo apenas informativo nesta versao."
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Atestado / documento</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => handleDocumentChange(event.target.files?.[0])}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>{documentName || 'Nenhum documento anexado.'}</span>
                {documentUrl && (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-slate-900 underline"
                  >
                    Visualizar documento
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sugestoes' && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
              Para gerar sugestoes, selecione um afastamento no Historico e clique em Gerar sugestoes.
            </div>

            {replacementSuggestions.length > 0 ? (
              replacementSuggestions.map((slot, index) => {
                const alreadySelected = selectedSlotKeys.has(getSuggestionKey(slot));

                return (
                  <div
                    key={`${slot.weekday}-${slot.timeSlot?.id || index}`}
                    className="bg-white border rounded-xl p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="font-medium">
                        {translateWeekday(slot.weekday)} - {slot.timeSlot?.startTime} - {slot.timeSlot?.endTime}
                        {slot.className ? ` - ${slot.className}` : ''}
                      </div>

                      {alreadySelected && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Professor ja selecionado
                        </span>
                      )}
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
                                {translateRole(replacement.roleType)} - {replacement.reason}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <div className="text-xs font-semibold">
                                Prioridade {replacement.priority}
                              </div>

                              <button
                                onClick={() => handleSelectSubstitute(slot, replacement)}
                                disabled={substitutionMutation.isPending || alreadySelected}
                                className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs disabled:opacity-60"
                              >
                                {alreadySelected ? 'Selecionado' : 'Selecionar'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        Nenhum substituto sugerido para este horario.
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border p-5 text-sm text-slate-500">
                Nenhuma sugestao carregada.
              </div>
            )}
          </div>
        )}

        {activeTab === 'substituicoes' && (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Substituicoes efetuadas</h2>
                <p className="text-sm text-slate-500">
                  Filtre por professor substituto para conferir o quadro individual.
                </p>
              </div>
              <select
                value={substitutionEmployeeFilter}
                onChange={(event) => setSubstitutionEmployeeFilter(event.target.value)}
                className="w-full max-w-sm rounded-xl border px-3 py-2 text-sm"
              >
                <option value="">Todos os substitutos</option>
                {substituteOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <SubstitutionTable
              substitutions={filteredSubstitutions}
              substitutionRowColors={substitutionRowColors}
              now={now}
              acceptanceTimeoutMinutes={acceptanceTimeoutMinutes}
              onAccept={(id) => acceptSubstitutionMutation.mutate(id)}
              onDelete={handleDeleteSubstitution}
              accepting={acceptSubstitutionMutation.isPending}
              deleting={deleteSubstitutionMutation.isPending}
            />
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="space-y-5">
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div>
                  <label className="text-sm font-medium">Servidor</label>
                  <select
                    value={historyEmployeeId}
                    onChange={(event) => setHistoryEmployeeId(event.target.value)}
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Todos os servidores</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setHistoryEmployeeId('')}
                  className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Limpar filtro
                </button>
              </div>

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                <div className="rounded-xl border bg-white p-3">
                  <div className="text-xs text-slate-500">Servidor consultado</div>
                  <div className="mt-1 font-semibold text-slate-950">
                    {selectedHistoryEmployee?.name ?? 'Todos'}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <div className="text-xs text-slate-500">Afastamentos encontrados</div>
                  <div className="mt-1 text-xl font-semibold text-slate-950">
                    {historyAbsences.length}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <div className="text-xs text-slate-500">Documentos anexados</div>
                  <div className="mt-1 text-xl font-semibold text-slate-950">
                    {historyDocumentCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-3 px-3">Servidor</th>
                    <th className="text-left py-3 px-3">Funcao</th>
                    <th className="text-left py-3 px-3">Escola</th>
                    <th className="text-left py-3 px-3">Inicio</th>
                    <th className="text-left py-3 px-3">Fim</th>
                    <th className="text-left py-3 px-3">Motivo</th>
                    <th className="text-left py-3 px-3">Documento</th>
                    <th className="text-left py-3 px-3">Situacao</th>
                    <th className="text-left py-3 px-3">Substituicoes</th>
                    <th className="text-left py-3 px-3">Acoes</th>
                  </tr>
                </thead>

                <tbody>
                  {historyAbsences.map((absence) => (
                    <tr key={absence.id} className="border-b last:border-b-0">
                      <td className="py-3 px-3 font-medium">{absence.employee?.name}</td>
                      <td className="py-3 px-3">{translateRole(absence.employee?.roleType)}</td>
                      <td className="py-3 px-3">{absence.employee?.school?.name || '-'}</td>
                      <td className="py-3 px-3">{new Date(absence.startDate).toLocaleDateString()}</td>
                      <td className="py-3 px-3">{new Date(absence.endDate).toLocaleDateString()}</td>
                      <td className="py-3 px-3">{absence.reason}</td>
                      <td className="py-3 px-3">
                        {absence.documentUrl ? (
                          <a
                            href={absence.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50"
                          >
                            Visualizar documento
                          </a>
                        ) : (
                          <span className="text-slate-400">Sem documento</span>
                        )}
                      </td>
                      <td className="py-3 px-3">{translateStatus(absence.status)}</td>
                      <td className="py-3 px-3">{absence.substitutions?.length ?? 0}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEditAbsence(absence)}
                            className="px-3 py-1 rounded-lg border text-xs hover:bg-slate-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => loadReplacementSuggestions(absence)}
                            className="px-3 py-1 rounded-lg border text-xs hover:bg-slate-50"
                          >
                            Gerar sugestoes
                          </button>
                          <button
                            onClick={() => handleDeleteAbsence(absence)}
                            disabled={deleteAbsenceMutation.isPending}
                            className="px-3 py-1 rounded-lg border border-red-200 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            Apagar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {historyAbsences.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-slate-500">
                        Nenhum afastamento encontrado para a consulta.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SubstitutionTable({
  substitutions,
  substitutionRowColors,
  now,
  acceptanceTimeoutMinutes,
  onAccept,
  onDelete,
  accepting,
  deleting,
}: {
  substitutions: Substitution[];
  substitutionRowColors: Map<string, string>;
  now: number;
  acceptanceTimeoutMinutes: number;
  onAccept: (id: string) => void;
  onDelete: (substitution: Substitution) => void;
  accepting: boolean;
  deleting: boolean;
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3">Substituto</th>
            <th className="text-left py-3">Servidor original</th>
            <th className="text-left py-3">Horario</th>
            <th className="text-left py-3">Situacao</th>
            <th className="text-left py-3">Tempo para aceite</th>
            <th className="text-left py-3">Acoes</th>
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
                  {substitution.substituteTeacher?.name ?? '-'}
                </td>
                <td className="py-3">{substitution.originalTeacher?.name ?? '-'}</td>
                <td className="py-3">{formatSubstitutionSchedule(substitution)}</td>
                <td className="py-3">{translateStatus(substitution.status)}</td>
                <td className="py-3">
                  <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-medium">
                    {formatAcceptanceTimer(
                      substitution,
                      now,
                      acceptanceTimeoutMinutes,
                    )}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    {canAcceptSubstitution(substitution) && (
                      <button
                        onClick={() => onAccept(substitution.id)}
                        disabled={accepting}
                        className="px-3 py-1 rounded-lg border border-green-200 bg-white text-xs text-green-700 hover:bg-green-50 disabled:opacity-60"
                      >
                        Aceitar
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(substitution)}
                      disabled={deleting}
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
              <td colSpan={6} className="py-6 text-center text-slate-500">
                Nenhuma substituicao encontrada para o filtro selecionado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
