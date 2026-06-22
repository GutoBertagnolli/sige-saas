import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

type Employee = {
  id: string;
  name: string;
  school?: { id: string; name: string } | null;
  assignments?: Array<{
    subject?: { id: string; name: string } | null;
    function?: { name: string } | null;
    school?: { id: string; name: string } | null;
  }>;
};

type Slot = {
  id: string;
  templateId?: string | null;
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

type ClassItem = {
  id: string;
  name: string;
  shift: string;
  school?: { id: string; name: string } | null;
  template?: { id: string; name: string } | null;
};

type WeeklySchedule = {
  id: string;
  weekday: string;
  type: string;
  timeSlotId: string;
  classId?: string | null;
  class?: { id: string; name: string } | null;
  room?: string | null;
  subject?: string | null;
  requiresSubstitution?: boolean;
  timeSlot?: {
    id: string;
    templateId?: string | null;
    startTime?: string | null;
    endTime?: string | null;
  } | null;
};

type LocalCell = {
  weekday: string;
  timeSlotId: string;
  slotTimeKey: string;
  classId: string;
  room: string;
  type: string;
  subject: string;
  requiresSubstitution: boolean;
};

const TENANT_ID = 'd48a9959-685e-4dc7-8af4-a156e9cfa9ac';
const ALL_TEMPLATES_ID = '__ALL_TEMPLATES__';

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

function getEmployeeSubject(employee?: Employee) {
  return employee?.assignments?.find((assignment) => assignment.subject)?.subject ?? null;
}

function getEmployeeSchools(employee?: Employee) {
  if (!employee) return [];

  const schools = new Map<string, { id: string; name: string }>();

  if (employee.school?.id) {
    schools.set(employee.school.id, employee.school);
  }

  employee.assignments?.forEach((assignment) => {
    if (assignment.school?.id) {
      schools.set(assignment.school.id, assignment.school);
    }
  });

  return Array.from(schools.values()).sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

function getSlotTimeKey(slot?: { startTime?: string | null; endTime?: string | null } | null) {
  return slot?.startTime && slot.endTime ? `${slot.startTime}-${slot.endTime}` : '';
}

function sortSlotsByTime(slots: Slot[]) {
  return [...slots].sort(
    (first, second) =>
      getSlotMinutes(first.startTime) - getSlotMinutes(second.startTime) ||
      getSlotMinutes(first.endTime) - getSlotMinutes(second.endTime) ||
      first.slotOrder - second.slotOrder,
  );
}

function getSlotMinutes(time: string) {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

async function getEmployees() {
  const response = await api.get<Employee[]>('/employees');
  return response.data;
}

async function getTemplates() {
  const response = await api.get<TimeTemplate[]>('/time-templates');
  return response.data;
}

async function getClasses() {
  const response = await api.get<ClassItem[]>('/classes');
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

  const [selectedTemplateId, setSelectedTemplateId] = useState(ALL_TEMPLATES_ID);
  const [defaultClassId, setDefaultClassId] = useState('');
  const [defaultType, setDefaultType] = useState('AULA');
  const [localCells, setLocalCells] = useState<LocalCell[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove'>('add');

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const { data: templates = [] } = useQuery<TimeTemplate[]>({
    queryKey: ['time-templates'],
    queryFn: getTemplates,
  });

  const { data: classes = [] } = useQuery<ClassItem[]>({
    queryKey: ['classes'],
    queryFn: getClasses,
  });

  const { data: planner = [], isLoading } = useQuery<WeeklySchedule[]>({
    queryKey: ['employee-planner', employeeId],
    queryFn: () => getPlanner(employeeId),
    enabled: Boolean(employeeId),
  });

  const employee = employees.find((item) => item.id === employeeId);
  const employeeSubject = getEmployeeSubject(employee);
  const employeeSchools = useMemo(() => getEmployeeSchools(employee), [employee]);
  const employeeSchoolIds = useMemo(
    () => new Set(employeeSchools.map((school) => school.id)),
    [employeeSchools],
  );

  const isAllTemplatesSelected = selectedTemplateId === ALL_TEMPLATES_ID;

  const selectedTemplate = useMemo(() => {
    if (selectedTemplateId && selectedTemplateId !== ALL_TEMPLATES_ID) {
      return templates.find((item) => item.id === selectedTemplateId);
    }

    return undefined;
  }, [templates, selectedTemplateId]);

  const allSlotsById = useMemo(() => {
    const map = new Map<string, Slot>();

    templates.forEach((template) => {
      template.slots.forEach((slot) => {
        map.set(slot.id, slot);
      });
    });

    return map;
  }, [templates]);
  const allTemplateSlots = useMemo(() => {
    const slotsByTime = new Map<string, Slot>();

    templates.forEach((template) => {
      template.slots.forEach((slot) => {
        const key = getSlotTimeKey(slot) || slot.id;
        const current = slotsByTime.get(key);

        if (!current || slot.slotOrder < current.slotOrder) {
          slotsByTime.set(key, slot);
        }
      });
    });

    return sortSlotsByTime(Array.from(slotsByTime.values()));
  }, [templates]);
  const savedPlannerSlots = useMemo(() => {
    const slotsByTime = new Map<string, Slot>();

    localCells.forEach((cell) => {
      const existingSlot = allSlotsById.get(cell.timeSlotId);
      const [startTime = '', endTime = ''] = cell.slotTimeKey.split('-');
      const fallbackSlot: Slot = {
        id: cell.timeSlotId,
        startTime,
        endTime,
        slotOrder: getSlotMinutes(startTime),
        slotType: 'CLASS',
        requiresSubstitution: cell.requiresSubstitution,
      };
      const slot = existingSlot ?? fallbackSlot;
      const key = getSlotTimeKey(slot) || cell.timeSlotId;
      const current = slotsByTime.get(key);

      if (!current || slot.slotOrder < current.slotOrder) {
        slotsByTime.set(key, slot);
      }
    });

    return sortSlotsByTime(Array.from(slotsByTime.values()));
  }, [allSlotsById, localCells]);
  const slots = isAllTemplatesSelected
    ? savedPlannerSlots.length > 0
      ? savedPlannerSlots
      : allTemplateSlots
    : selectedTemplate?.slots || [];
  const visibleSlotIds = useMemo(() => new Set(slots.map((slot) => slot.id)), [slots]);
  const visibleSlotTimeKeys = useMemo(
    () => new Set(slots.map((slot) => getSlotTimeKey(slot)).filter(Boolean)),
    [slots],
  );
  const availableClasses = classes.filter((item) => {
    if (employeeSchoolIds.size > 0 && (!item.school?.id || !employeeSchoolIds.has(item.school.id))) {
      return false;
    }

    if (!isAllTemplatesSelected && selectedTemplate?.id && item.template?.id !== selectedTemplate.id) {
      return false;
    }

    return true;
  });
  const classById = useMemo<Map<string, ClassItem>>(
    () => new Map(classes.map((item: ClassItem) => [item.id, item])),
    [classes],
  );
  const visibleCells = useMemo(
    () =>
      localCells.filter(
        (cell) =>
          visibleSlotIds.has(cell.timeSlotId) ||
          Boolean(cell.slotTimeKey && visibleSlotTimeKeys.has(cell.slotTimeKey)),
      ),
    [localCells, visibleSlotIds, visibleSlotTimeKeys],
  );
  const visibleClassOptions = useMemo(() => {
    const options = new Map(availableClasses.map((item) => [item.id, item]));

    visibleCells.forEach((cell) => {
      const classItem = classById.get(cell.classId);
      if (classItem) {
        options.set(classItem.id, classItem);
      }
    });

    return Array.from(options.values()).sort((first, second) =>
      first.name.localeCompare(second.name),
    );
  }, [availableClasses, classById, visibleCells]);
  const firstVisibleClassId = useMemo(
    () => visibleCells.find((cell) => cell.classId)?.classId ?? '',
    [visibleCells],
  );

  useEffect(() => {
    setSelectedTemplateId(ALL_TEMPLATES_ID);
    setDefaultClassId('');
    setLocalCells([]);
  }, [employeeId]);

  useEffect(() => {
    const mapped = planner.map((item) => ({
      weekday: item.weekday,
      timeSlotId: item.timeSlotId,
      slotTimeKey: getSlotTimeKey(item.timeSlot) || getSlotTimeKey(allSlotsById.get(item.timeSlotId)),
      classId: item.classId ?? item.class?.id ?? '',
      room: item.room ?? '',
      type: item.type,
      subject: item.subject ?? employeeSubject?.name ?? '',
      requiresSubstitution: item.requiresSubstitution ?? true,
    }));

    setLocalCells(mapped);
  }, [allSlotsById, planner, employeeSubject?.name]);

  useEffect(() => {
    if (
      defaultClassId &&
      availableClasses.some((item) => item.id === defaultClassId)
    ) {
      return;
    }

    if (
      firstVisibleClassId &&
      availableClasses.some((item) => item.id === firstVisibleClassId)
    ) {
      setDefaultClassId(firstVisibleClassId);
      return;
    }

    setDefaultClassId(availableClasses[0]?.id ?? '');
  }, [availableClasses, defaultClassId, firstVisibleClassId]);

  const saveMutation = useMutation({
    mutationFn: savePlannerBulk,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['employee-planner', employeeId],
      });

      alert('Planner salvo com sucesso.');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message ?? 'Erro ao salvar planner.');
    },
  });

  function findCell(weekday: string, slot: Slot) {
    const exactCell = localCells.find(
      (item) => item.weekday === weekday && item.timeSlotId === slot.id,
    );

    if (exactCell) {
      return exactCell;
    }

    const slotTimeKey = getSlotTimeKey(slot);

    return localCells.find(
      (item) =>
        item.weekday === weekday &&
        Boolean(slotTimeKey) &&
        item.slotTimeKey === slotTimeKey,
    );
  }

  function paintCell(
    weekday: string,
    slot: Slot,
    mode: 'add' | 'remove',
  ) {
    const existing = findCell(weekday, slot);

    if (mode === 'remove') {
      if (!existing) return;

      setLocalCells((prev) =>
        prev.filter(
          (item) =>
            !(item.weekday === existing.weekday && item.timeSlotId === existing.timeSlotId),
        ),
      );

      return;
    }

    if (existing) return;

    if (!defaultClassId) {
      alert('Selecione uma turma padrao antes de marcar horarios.');
      return;
    }

    setLocalCells((prev) => [
      ...prev,
      {
        weekday,
        timeSlotId: slot.id,
        slotTimeKey: getSlotTimeKey(slot),
        classId: defaultClassId,
        room: '',
        type: defaultType,
        subject: employeeSubject?.name ?? '',
        requiresSubstitution: slot.requiresSubstitution,
      },
    ]);
  }

  function startPaint(weekday: string, slot: Slot) {
    const existing = findCell(weekday, slot);
    const mode = existing ? 'remove' : 'add';

    setDragMode(mode);
    setIsDragging(true);
    paintCell(weekday, slot, mode);
  }

  function updateCellType(weekday: string, slot: Slot, type: string) {
    const existing = findCell(weekday, slot);
    if (!existing) return;

    setLocalCells((prev) =>
      prev.map((item) =>
        item.weekday === existing.weekday && item.timeSlotId === existing.timeSlotId
          ? { ...item, type }
          : item,
      ),
    );
  }

  function updateCellClass(weekday: string, slot: Slot, classId: string) {
    const existing = findCell(weekday, slot);
    if (!existing) return;

    setLocalCells((prev) =>
      prev.map((item) =>
        item.weekday === existing.weekday && item.timeSlotId === existing.timeSlotId
          ? { ...item, classId }
          : item,
      ),
    );
  }

  function updateCellRoom(weekday: string, slot: Slot, room: string) {
    const existing = findCell(weekday, slot);
    if (!existing) return;

    setLocalCells((prev) =>
      prev.map((item) =>
        item.weekday === existing.weekday && item.timeSlotId === existing.timeSlotId
          ? { ...item, room }
          : item,
      ),
    );
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

    if (!defaultClassId) {
      alert('Selecione uma turma padrao antes de preencher horarios.');
      return newCells;
    }

    slotsToFill.forEach((slot) => {
      WEEKDAYS.forEach((day) => {
        newCells.push({
          weekday: day.key,
          timeSlotId: slot.id,
          slotTimeKey: getSlotTimeKey(slot),
          classId: defaultClassId,
          room: '',
          type: defaultType,
          subject: employeeSubject?.name ?? '',
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
    const slotTimeKeys = new Set(slotsToFill.map((slot) => getSlotTimeKey(slot)).filter(Boolean));
    const withoutTemplateSlots = prev.filter(
      (item) =>
        !slotIds.has(item.timeSlotId) &&
        !Boolean(item.slotTimeKey && slotTimeKeys.has(item.slotTimeKey)),
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
    if (employeeSchoolIds.size === 0) {
      alert('Este servidor precisa ter escola cadastrada.');
      return;
    }

    if (localCells.some((cell) => !cell.classId)) {
      alert('Todos os horarios marcados precisam estar vinculados a uma turma.');
      return;
    }

    const cellWithoutSchool = localCells.find((cell) => !classById.get(cell.classId)?.school?.id);
    if (cellWithoutSchool) {
      alert('Todas as turmas do planner precisam estar vinculadas a uma escola.');
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
      schoolId: classById.get(cell.classId)?.school?.id,
      classId: cell.classId,
      timeSlotId: cell.timeSlotId,
      weekday: cell.weekday,
      type: cell.type,
      subjectId: employeeSubject?.id ?? null,
      subject: cell.subject || employeeSubject?.name || null,
      functionName: cell.type === 'AULA' ? 'Professor' : cell.type,
      room: cell.room || null,
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
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Planner semanal</h2>
            <p className="text-sm text-slate-500">
              {employee?.name || 'Servidor'} •{' '}
              {employeeSchools.map((school) => school.name).join(', ') || 'Sem escola vinculada'} •{' '}
              {employeeSubject?.name || 'Sem disciplina cadastrada'}
            </p>
          </div>

          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 xl:justify-end">
            <button onClick={() => fillShift('MATUTINO')} title="Preencher matutino" className="shrink-0 whitespace-nowrap rounded-xl border px-2.5 py-2 text-xs lg:text-sm">
              Matutino
            </button>

            <button onClick={() => fillShift('VESPERTINO')} title="Preencher vespertino" className="shrink-0 whitespace-nowrap rounded-xl border px-2.5 py-2 text-xs lg:text-sm">
              Vespertino
            </button>

            <button onClick={fillIntegral} title="Preencher integral" className="shrink-0 whitespace-nowrap rounded-xl border px-2.5 py-2 text-xs lg:text-sm">
              Integral
            </button>

            <button
              onClick={copyMondayToAllDays}
              title="Copiar segunda para todos"
              className="shrink-0 whitespace-nowrap rounded-xl border px-2.5 py-2 text-xs lg:text-sm"
            >
              Copiar segunda
            </button>

            <button onClick={clearPlanner} className="shrink-0 whitespace-nowrap rounded-xl border border-red-200 px-2.5 py-2 text-xs text-red-700 lg:text-sm">
              Limpar
            </button>

            <button
              onClick={savePlanner}
              disabled={saveMutation.isPending}
              className="shrink-0 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-xs text-white disabled:opacity-60 lg:text-sm"
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div>
            <label className="text-sm font-medium">Modelo de horário</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            >
              <option value={ALL_TEMPLATES_ID}>
                Todos os modelos / aulas cadastradas
              </option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Turma padrao</label>
            <select
              value={defaultClassId}
              onChange={(e) => setDefaultClassId(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {availableClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
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
                      const cell = findCell(day.key, slot);
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
                                ? [
                                    TYPES.find((type) => type.value === cell?.type)?.label ||
                                      cell?.type,
                                    cell?.classId
                                      ? classById.get(cell.classId)?.name
                                      : null,
                                    cell?.subject || employeeSubject?.name || null,
                                    cell?.room ? `Sala ${cell.room}` : null,
                                  ]
                                    .filter(Boolean)
                                    .join(' - ')
                                : 'Livre'}
                            </button>

                            {active && (
                              <>
                                <select
                                  value={cell?.classId}
                                  onChange={(e) =>
                                    updateCellClass(day.key, slot, e.target.value)
                                  }
                                  className="w-full border rounded-lg px-1 py-1 text-[10px]"
                                >
                                  <option value="">Turma</option>
                                  {visibleClassOptions.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.name}
                                    </option>
                                  ))}
                                </select>

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

                                <input
                                  value={cell?.room ?? ''}
                                  onChange={(e) =>
                                    updateCellRoom(day.key, slot, e.target.value)
                                  }
                                  className="w-full border rounded-lg px-1 py-1 text-[10px]"
                                  placeholder="Sala"
                                />
                              </>
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

