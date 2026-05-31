import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

type Employee = {
  id: string;
  name: string;
  school?: { id: string; name: string } | null;
};

type Slot = {
  id: string;
  slotOrder: number;
  startTime: string;
  endTime: string;
  slotType: string;
  requiresSubstitution: boolean;
};

type TimeTemplate = {
  id: string;
  name: string;
  shift: string;
  educationStage: string;
  slots: Slot[];
};

type WeeklySchedule = {
  id: string;
  weekday: string;
  type: string;
  timeSlotId: string;
  requiresSubstitution?: boolean;
};

type LocalCell = {
  weekday: string;
  timeSlotId: string;
  type: string;
  requiresSubstitution: boolean;
};

const TENANT_ID = 'd48a9959-685e-4dc7-8af4-a156e9cfa9ac';

const WEEKDAYS = [
  { key: 'MONDAY', label: 'Segunda' },
  { key: 'TUESDAY', label: 'Terça' },
  { key: 'WEDNESDAY', label: 'Quarta' },
  { key: 'THURSDAY', label: 'Quinta' },
  { key: 'FRIDAY', label: 'Sexta' },
];

const TYPES = [
  { value: 'AULA', label: 'Aula' },
  { value: 'HORA_ATIVIDADE', label: 'Hora atividade' },
  { value: 'APOIO', label: 'Apoio' },
  { value: 'SUPERVISAO', label: 'Supervisão' },
  { value: 'ALMOCO_SONO', label: 'Almoço/Sono' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
];

const TYPE_COLORS: Record<string, string> = {
  AULA: 'bg-blue-600 text-white border-blue-700',
  HORA_ATIVIDADE: 'bg-yellow-400 text-black border-yellow-500',
  APOIO: 'bg-purple-600 text-white border-purple-700',
  SUPERVISAO: 'bg-pink-600 text-white border-pink-700',
  ALMOCO_SONO: 'bg-green-600 text-white border-green-700',
  ADMINISTRATIVO: 'bg-slate-700 text-white border-slate-800',
};

async function getEmployees() {
  const response = await api.get<Employee[]>('/employees');
  return response.data;
}

async function getTemplates() {
  const response = await api.get<TimeTemplate[]>('/time-templates');
  return response.data;
}

async function getPlanner(employeeId: string) {
  const response = await api.get<WeeklySchedule[]>(
    `/employee-weekly-schedules/employee/${employeeId}`,
  );
  return response.data;
}

async function savePlannerBulk(data: { employeeId: string; items: Array<any> }) {
  const response = await api.post('/employee-weekly-schedules/bulk', data);
  return response.data;
}

export default function EmployeePlannerPage() {
  const { employeeId = '' } = useParams();
  const queryClient = useQueryClient();

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [defaultType, setDefaultType] = useState('AULA');
  const [localCells, setLocalCells] = useState<LocalCell[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove'>('add');

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['time-templates'],
    queryFn: getTemplates,
  });

  const { data: planner = [], isLoading } = useQuery({
    queryKey: ['employee-planner', employeeId],
    queryFn: () => getPlanner(employeeId),
    enabled: Boolean(employeeId),
  });

  const employee = employees.find((item) => item.id === employeeId);

  const selectedTemplate = useMemo(() => {
    if (selectedTemplateId) {
      return templates.find((item) => item.id === selectedTemplateId);
    }

    const integralTemplate = templates.find((item) => item.shift === 'INTEGRAL');
    return integralTemplate || templates[0];
  }, [templates, selectedTemplateId]);

  const slots = selectedTemplate?.slots || [];

  useEffect(() => {
    const mapped = planner.map((item) => ({
      weekday: item.weekday,
      timeSlotId: item.timeSlotId,
      type: item.type,
      requiresSubstitution: item.requiresSubstitution ?? true,
    }));

    setLocalCells(mapped);
  }, [planner]);

  const saveMutation = useMutation({
    mutationFn: savePlannerBulk,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['employee-planner', employeeId],
      });

      alert('Planner salvo com sucesso.');
    },
    onError: () => {
      alert('Erro ao salvar planner.');
    },
  });

  function findCell(weekday: string, timeSlotId: string) {
    return localCells.find(
      (item) => item.weekday === weekday && item.timeSlotId === timeSlotId,
    );
  }

  function paintCell(
    weekday: string,
    slot: Slot,
    mode: 'add' | 'remove',
  ) {
    const existing = findCell(weekday, slot.id);

    if (mode === 'remove') {
      if (!existing) return;

      setLocalCells((prev) =>
        prev.filter(
          (item) =>
            !(item.weekday === weekday && item.timeSlotId === slot.id),
        ),
      );

      return;
    }

    if (existing) return;

    setLocalCells((prev) => [
      ...prev,
      {
        weekday,
        timeSlotId: slot.id,
        type: defaultType,
        requiresSubstitution: slot.requiresSubstitution,
      },
    ]);
  }

  function startPaint(weekday: string, slot: Slot) {
    const existing = findCell(weekday, slot.id);
    const mode = existing ? 'remove' : 'add';

    setDragMode(mode);
    setIsDragging(true);
    paintCell(weekday, slot, mode);
  }

  function updateCellType(weekday: string, slot: Slot, type: string) {
    setLocalCells((prev) =>
      prev.map((item) =>
        item.weekday === weekday && item.timeSlotId === slot.id
          ? { ...item, type }
          : item,
      ),
    );
  }

  function getSlotMinutes(time: string) {
    const [hours = '0', minutes = '0'] = time.split(':');
    return Number(hours) * 60 + Number(minutes);
  }

  function getSlotsForShift(template: TimeTemplate, shift: string) {
    if (template.shift !== 'INTEGRAL') {
      return template.slots;
    }

    if (shift === 'MATUTINO') {
      return template.slots.filter((slot) => getSlotMinutes(slot.startTime) < 12 * 60);
    }

    if (shift === 'VESPERTINO') {
      return template.slots.filter((slot) => getSlotMinutes(slot.startTime) >= 12 * 60);
    }

    return template.slots;
  }

  function buildCellsForSlots(slotsToFill: Slot[]) {
    const newCells: LocalCell[] = [];

    slotsToFill.forEach((slot) => {
      WEEKDAYS.forEach((day) => {
        newCells.push({
          weekday: day.key,
          timeSlotId: slot.id,
          type: defaultType,
          requiresSubstitution: slot.requiresSubstitution,
        });
      });
    });

    return newCells;
  }

  function buildCellsForTemplate(template: TimeTemplate) {
    return buildCellsForSlots(template.slots);
  }

  function mergeSlots(prev: LocalCell[], slotsToFill: Slot[]) {
    const slotIds = new Set(slotsToFill.map((slot) => slot.id));
    const withoutTemplateSlots = prev.filter(
      (item) => !slotIds.has(item.timeSlotId),
    );

    return [...withoutTemplateSlots, ...buildCellsForSlots(slotsToFill)];
  }

  function fillShift(shift: string) {
    const template =
      selectedTemplate?.shift === shift || selectedTemplate?.shift === 'INTEGRAL'
        ? selectedTemplate
        : templates.find((item) => item.shift === shift);

    if (!template) {
      alert(`Nenhum modelo encontrado para ${shift}.`);
      return;
    }

    const slotsToFill = getSlotsForShift(template, shift);

    if (slotsToFill.length === 0) {
      alert(`Nenhum horário encontrado para ${shift}.`);
      return;
    }

    setSelectedTemplateId(template.id);
    setLocalCells((prev) => mergeSlots(prev, slotsToFill));
  }

  function fillIntegral() {
    const integralTemplate = templates.find((item) => item.shift === 'INTEGRAL');

    if (!integralTemplate) {
      fillShift('MATUTINO');
      fillShift('VESPERTINO');
      return;
    }

    setSelectedTemplateId(integralTemplate.id);
    setLocalCells(buildCellsForTemplate(integralTemplate));
  }

  function copyMondayToAllDays() {
  const mondayCells = localCells.filter(
    (cell) => cell.weekday === 'MONDAY',
  );

  if (mondayCells.length === 0) {
    alert('A segunda-feira ainda não possui horários preenchidos.');
    return;
  }

  const otherDays = WEEKDAYS.filter((day) => day.key !== 'MONDAY');

  const copiedCells: LocalCell[] = [];

  otherDays.forEach((day) => {
    mondayCells.forEach((cell) => {
      copiedCells.push({
        ...cell,
        weekday: day.key,
      });
    });
  });

  const withoutOtherDays = localCells.filter(
    (cell) => cell.weekday === 'MONDAY',
  );

  setLocalCells([...withoutOtherDays, ...copiedCells]);
}

  function clearPlanner() {
    const confirmed = confirm('Deseja limpar o planner local?');

    if (!confirmed) return;

    setLocalCells([]);
  }

  function savePlanner() {
    if (!employee?.school?.id) {
      alert('Este servidor precisa ter escola principal cadastrada.');
      return;
    }

    const uniqueCells = Array.from(
      new Map(
        localCells.map((cell) => [`${cell.weekday}:${cell.timeSlotId}`, cell]),
      ).values(),
    );

    const items = uniqueCells.map((cell) => ({
      tenantId: TENANT_ID,
      employeeId,
      schoolId: employee.school!.id,
      timeSlotId: cell.timeSlotId,
      weekday: cell.weekday,
      type: cell.type,
      requiresSubstitution: cell.requiresSubstitution,
    }));

    saveMutation.mutate({
      employeeId,
      items,
    });
  }

  return (
    <section
      className="p-5"
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Planner semanal</h2>
            <p className="text-sm text-slate-500">
              {employee?.name || 'Servidor'} •{' '}
              {employee?.school?.name || 'Sem escola vinculada'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => fillShift('MATUTINO')} className="px-3 py-2 rounded-xl border text-sm">
              Preencher matutino
            </button>

            <button onClick={() => fillShift('VESPERTINO')} className="px-3 py-2 rounded-xl border text-sm">
              Preencher vespertino
            </button>

            <button onClick={fillIntegral} className="px-3 py-2 rounded-xl border text-sm">
              Preencher integral
            </button>

	   <button
  onClick={copyMondayToAllDays}
  className="px-3 py-2 rounded-xl border text-sm"
>
  Copiar segunda para todos
</button>

            <button onClick={clearPlanner} className="px-3 py-2 rounded-xl border border-red-200 text-red-700 text-sm">
              Limpar
            </button>

            <button
              onClick={savePlanner}
              disabled={saveMutation.isPending}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-60"
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar planner'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div>
            <label className="text-sm font-medium">Modelo de horário</label>
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Tipo padrão ao marcar</label>
            <select
              value={defaultType}
              onChange={(e) => setDefaultType(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            >
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-sm text-slate-500">Carregando planner...</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left p-3 border-r">Horário</th>

                  {WEEKDAYS.map((day) => (
                    <th key={day.key} className="text-center p-3 border-r">
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id} className="border-b">
                    <td className="p-3 border-r whitespace-nowrap">
                      <div className="font-medium">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="text-xs text-slate-500">
                        {slot.slotType === 'BREAK'
                          ? 'Intervalo / Sono'
                          : slot.slotType === 'ACTIVITY'
                            ? 'Atividade / Supervisão'
                            : 'Aula / Atividade'}
                      </div>
                    </td>

                    {WEEKDAYS.map((day) => {
                      const cell = findCell(day.key, slot.id);
                      const active = Boolean(cell);

                      return (
                        <td key={day.key} className="p-2 border-r text-center">
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onMouseDown={() => startPaint(day.key, slot)}
                              onMouseEnter={() => {
                                if (!isDragging) return;
                                paintCell(day.key, slot, dragMode);
                              }}
                              className={`w-full min-w-28 rounded-xl border px-2 py-3 text-xs transition-all select-none ${
                                active
                                  ? TYPE_COLORS[cell?.type || 'AULA']
                                  : 'bg-white hover:bg-slate-50'
                              }`}
                            >
                              {active
                                ? TYPES.find((type) => type.value === cell?.type)?.label ||
                                  cell?.type
                                : 'Livre'}
                            </button>

                            {active && (
                              <select
                                value={cell?.type}
                                onChange={(e) =>
                                  updateCellType(day.key, slot, e.target.value)
                                }
                                className="w-full border rounded-lg px-1 py-1 text-[10px]"
                              >
                                {TYPES.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {slots.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Nenhum horário encontrado no modelo selecionado.
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
