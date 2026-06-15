import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

type Employee = {
  id: string;
  name: string;
  roleType?: string;
  school?: {
    id: string;
    name: string;
  } | null;
  assignments?: Array<{
    subject?: {
      id: string;
      name: string;
    } | null;
  }>;
};

type TimeSlot = {
  id: string;
  slotOrder: number;
  startTime: string;
  endTime: string;
  slotType: string;
};

type ClassItem = {
  id: string;
  name: string;
  shift?: string;
  school?: {
    id: string;
    name: string;
  } | null;
};

type WeeklySchedule = {
  id: string;
  weekday: string;
  type: string;
  timeSlotId: string;
  room?: string | null;
  subject?: string | null;
  class?: {
    id: string;
    name: string;
  } | null;
  timeSlot?: TimeSlot | null;
};

type EmployeePlanner = {
  employee: Employee;
  schedules: WeeklySchedule[];
};

type ClassPlanner = {
  classItem: ClassItem;
  schedules: Array<WeeklySchedule & { employee: Employee }>;
};

const WEEKDAYS = [
  { key: 'MONDAY', label: 'Segunda' },
  { key: 'TUESDAY', label: 'Terca' },
  { key: 'WEDNESDAY', label: 'Quarta' },
  { key: 'THURSDAY', label: 'Quinta' },
  { key: 'FRIDAY', label: 'Sexta' },
];

const TYPE_LABELS: Record<string, string> = {
  AULA: 'Aula',
  HORA_ATIVIDADE: 'Hora atividade',
  APOIO: 'Apoio',
  SUPERVISAO: 'Supervisao',
  ALMOCO_SONO: 'Almoco/Sono',
  ADMINISTRATIVO: 'Administrativo',
};

const TYPE_STYLES: Record<string, string> = {
  AULA: 'border-blue-300 bg-blue-100 text-blue-950',
  HORA_ATIVIDADE: 'border-amber-300 bg-amber-100 text-amber-950',
  APOIO: 'border-violet-300 bg-violet-100 text-violet-950',
  SUPERVISAO: 'border-pink-300 bg-pink-100 text-pink-950',
  ALMOCO_SONO: 'border-emerald-300 bg-emerald-100 text-emerald-950',
  ADMINISTRATIVO: 'border-slate-300 bg-slate-100 text-slate-950',
};

const SLOT_STYLES = [
  'bg-sky-50 text-sky-950',
  'bg-indigo-50 text-indigo-950',
  'bg-cyan-50 text-cyan-950',
  'bg-teal-50 text-teal-950',
  'bg-lime-50 text-lime-950',
  'bg-orange-50 text-orange-950',
  'bg-rose-50 text-rose-950',
  'bg-purple-50 text-purple-950',
];

async function getEmployees() {
  const response = await api.get<Employee[]>('/employees');
  return response.data;
}

async function getPlanner(employeeId: string) {
  const response = await api.get<WeeklySchedule[]>(
    `/employee-weekly-schedules/employee/${employeeId}`,
  );
  return response.data;
}

async function getClasses() {
  const response = await api.get<ClassItem[]>('/classes');
  return response.data;
}

function formatRole(roleType?: string) {
  return (roleType || 'SERVIDOR').replace(/_/g, ' ');
}

function formatType(type?: string) {
  return type ? TYPE_LABELS[type] ?? type.replace(/_/g, ' ') : 'Horario';
}

function getScheduleKey(schedule: WeeklySchedule) {
  if (schedule.timeSlot) {
    return `${schedule.weekday}:${getSlotTimeKey(schedule.timeSlot)}`;
  }

  return `${schedule.weekday}:${schedule.timeSlotId}`;
}

function getSlotLabel(slot: TimeSlot) {
  return `${slot.startTime} - ${slot.endTime}`;
}

function getSlotTimeKey(slot: TimeSlot) {
  return `${slot.startTime}-${slot.endTime}`;
}

function getTimeMinutes(time: string) {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

function getSlotDuration(slot?: TimeSlot | null) {
  if (!slot) return 0;
  return Math.max(0, getTimeMinutes(slot.endTime) - getTimeMinutes(slot.startTime));
}

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

function getSlotSortValue(slot?: TimeSlot | null) {
  if (!slot) return 9999;
  return getTimeMinutes(slot.startTime) * 10000 + getTimeMinutes(slot.endTime);
}

function getEmployeeSubject(employee: Employee) {
  return employee.assignments?.find((assignment) => assignment.subject)?.subject?.name ?? '';
}

function buildPlannerRows(schedules: WeeklySchedule[]) {
  const slotsById = new Map<string, TimeSlot>();

  schedules.forEach((schedule) => {
    if (schedule.timeSlot) {
      slotsById.set(getSlotTimeKey(schedule.timeSlot), schedule.timeSlot);
    }
  });

  return Array.from(slotsById.values()).sort(
    (a, b) => getSlotSortValue(a) - getSlotSortValue(b),
  );
}

function PlannerTable({ planner }: { planner: EmployeePlanner }) {
  const rows = buildPlannerRows(planner.schedules);
  const scheduleByKey = new Map(
    planner.schedules.map((schedule) => [getScheduleKey(schedule), schedule]),
  );

  return (
    <section className="break-inside-avoid rounded-lg border bg-white shadow-sm print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            {planner.employee.name}
          </h2>
          <p className="text-xs text-slate-500">
            {formatRole(planner.employee.roleType)} -{' '}
            {planner.employee.school?.name ?? 'Sem escola vinculada'}
          </p>
        </div>

        <div className="rounded-md border bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
          {planner.schedules.length} horarios
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-auto">
          <table className="w-full min-w-[920px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-36 border-b border-r bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700">
                  Horario
                </th>
                {WEEKDAYS.map((day) => (
                  <th
                    key={day.key}
                    className="border-b border-r bg-slate-100 px-3 py-2 text-center font-semibold text-slate-700 last:border-r-0"
                  >
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((slot, index) => (
                <tr key={slot.id}>
                  <td
                    className={`border-r border-t px-3 py-2 align-middle font-semibold ${
                      SLOT_STYLES[index % SLOT_STYLES.length]
                    }`}
                  >
                    <div>{getSlotLabel(slot)}</div>
                    <div className="mt-1 text-[11px] font-normal opacity-75">
                      {slot.slotType === 'BREAK' ? 'Intervalo' : 'Aula'}
                    </div>
                  </td>

                  {WEEKDAYS.map((day) => {
                    const schedule = scheduleByKey.get(`${day.key}:${getSlotTimeKey(slot)}`);
                    const typeStyle =
                      TYPE_STYLES[schedule?.type ?? ''] ??
                      'border-slate-200 bg-white text-slate-500';

                    return (
                      <td
                        key={day.key}
                        className="h-20 border-r border-t p-2 align-top last:border-r-0"
                      >
                        {schedule ? (
                          <div
                            className={`h-full rounded-md border px-2 py-2 ${typeStyle}`}
                          >
                            <div className="font-semibold">
                              {formatType(schedule.type)}
                            </div>
                            <div className="mt-1 text-[11px]">
                              {schedule.class?.name ?? 'Turma nao informada'}
                            </div>
                            <div className="mt-1 text-[11px]">
                              {schedule.subject || getEmployeeSubject(planner.employee) || 'Materia nao informada'}
                            </div>
                            {schedule.room && (
                              <div className="mt-1 text-[11px]">
                                Sala {schedule.room}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400">
                            Livre
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-6 text-sm text-slate-500">
          Nenhum horario cadastrado no planner deste servidor.
        </div>
      )}
    </section>
  );
}

function ClassPlannerTable({ planner }: { planner: ClassPlanner }) {
  const rows = buildPlannerRows(planner.schedules);
  const scheduleByKey = new Map(
    planner.schedules.map((schedule) => [getScheduleKey(schedule), schedule]),
  );

  return (
    <section className="break-inside-avoid rounded-lg border bg-white shadow-sm print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            {planner.classItem.name}
          </h2>
          <p className="text-xs text-slate-500">
            {planner.classItem.school?.name ?? 'Sem escola vinculada'}
          </p>
        </div>

        <div className="rounded-md border bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
          {planner.schedules.length} horários
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-auto">
          <table className="w-full min-w-[920px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-36 border-b border-r bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700">
                  Horário
                </th>
                {WEEKDAYS.map((day) => (
                  <th
                    key={day.key}
                    className="border-b border-r bg-slate-100 px-3 py-2 text-center font-semibold text-slate-700 last:border-r-0"
                  >
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((slot, index) => (
                <tr key={getSlotTimeKey(slot)}>
                  <td
                    className={`border-r border-t px-3 py-2 align-middle font-semibold ${
                      SLOT_STYLES[index % SLOT_STYLES.length]
                    }`}
                  >
                    <div>{getSlotLabel(slot)}</div>
                    <div className="mt-1 text-[11px] font-normal opacity-75">
                      {slot.slotType === 'BREAK' ? 'Intervalo' : 'Aula'}
                    </div>
                  </td>

                  {WEEKDAYS.map((day) => {
                    const schedule = scheduleByKey.get(`${day.key}:${getSlotTimeKey(slot)}`);
                    const typeStyle =
                      TYPE_STYLES[schedule?.type ?? ''] ??
                      'border-slate-200 bg-white text-slate-500';

                    return (
                      <td
                        key={day.key}
                        className="h-20 border-r border-t p-2 align-top last:border-r-0"
                      >
                        {schedule ? (
                          <div className={`h-full rounded-md border px-2 py-2 ${typeStyle}`}>
                            <div className="font-semibold">
                              {formatType(schedule.type)}
                            </div>
                            <div className="mt-1 text-[11px]">
                              {schedule.employee.name}
                            </div>
                            <div className="mt-1 text-[11px]">
                              {schedule.subject || getEmployeeSubject(schedule.employee) || 'Matéria não informada'}
                            </div>
                            {schedule.room && (
                              <div className="mt-1 text-[11px]">
                                Sala {schedule.room}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400">
                            Livre
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-6 text-sm text-slate-500">
          Nenhum horário cadastrado para esta turma.
        </div>
      )}
    </section>
  );
}

export default function ReportsPage() {
  const [schoolId, setSchoolId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [classId, setClassId] = useState('');
  const [reportType, setReportType] = useState<'employee' | 'class'>('employee');

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: getClasses,
  });

  const {
    data: planners = [],
    isLoading: loadingPlanners,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['reports', 'employee-planners', employees.map((item) => item.id)],
    queryFn: async () => {
      const results = await Promise.all(
        employees.map(async (employee) => ({
          employee,
          schedules: await getPlanner(employee.id),
        })),
      );

      return results;
    },
    enabled: employees.length > 0,
  });

  const schools = useMemo(() => {
    const schoolsById = new Map<string, { id: string; name: string }>();

    employees.forEach((employee) => {
      if (employee.school?.id) {
        schoolsById.set(employee.school.id, employee.school);
      }
    });

    return Array.from(schoolsById.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [employees]);

  const filteredPlanners = planners.filter((planner) => {
    if (schoolId && planner.employee.school?.id !== schoolId) return false;
    if (employeeId && planner.employee.id !== employeeId) return false;
    return true;
  });

  const filteredClasses = classes.filter((classItem) => {
    if (schoolId && classItem.school?.id !== schoolId) return false;
    return true;
  });

  const classPlanners = useMemo(() => {
    const classById = new Map(classes.map((classItem) => [classItem.id, classItem]));
    const schedulesByClassId = new Map<string, Array<WeeklySchedule & { employee: Employee }>>();

    planners.forEach((planner) => {
      if (schoolId && planner.employee.school?.id !== schoolId) return;
      if (employeeId && planner.employee.id !== employeeId) return;

      planner.schedules.forEach((schedule) => {
        const scheduleClassId = schedule.class?.id;

        if (!scheduleClassId) return;
        if (classId && scheduleClassId !== classId) return;

        const schedules = schedulesByClassId.get(scheduleClassId) ?? [];
        schedules.push({
          ...schedule,
          employee: planner.employee,
        });
        schedulesByClassId.set(scheduleClassId, schedules);
      });
    });

    return Array.from(schedulesByClassId.entries())
      .map(([scheduleClassId, schedules]) => {
        const classItem =
          classById.get(scheduleClassId) ??
          ({
            id: scheduleClassId,
            name: schedules[0]?.class?.name ?? 'Turma não informada',
            school: schedules[0]?.employee.school ?? null,
          } as ClassItem);

        return {
          classItem,
          schedules,
        };
      })
      .sort((a, b) => a.classItem.name.localeCompare(b.classItem.name));
  }, [classes, planners, schoolId, employeeId, classId]);

  const summaryRows = useMemo(() => {
    const rowsByKey = new Map<
      string,
      {
        employeeName: string;
        schoolName: string;
        subject: string;
        totalMinutes: number;
        scheduleCount: number;
      }
    >();

    filteredPlanners.forEach((planner) => {
      const defaultSubject = getEmployeeSubject(planner.employee) || 'Materia nao informada';

      planner.schedules.forEach((schedule) => {
        const subject = schedule.subject || defaultSubject;
        const key = `${planner.employee.id}:${subject}`;
        const current =
          rowsByKey.get(key) ??
          {
            employeeName: planner.employee.name,
            schoolName: planner.employee.school?.name ?? 'Sem escola vinculada',
            subject,
            totalMinutes: 0,
            scheduleCount: 0,
          };

        current.totalMinutes += getSlotDuration(schedule.timeSlot);
        current.scheduleCount += 1;
        rowsByKey.set(key, current);
      });
    });

    return Array.from(rowsByKey.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName) || a.subject.localeCompare(b.subject),
    );
  }, [filteredPlanners]);

  const loading = loadingEmployees || loadingClasses || loadingPlanners;

  return (
    <section className="p-5 print:bg-white print:p-0">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">
            Relatorio de horarios
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quadros semanais por professor ou por turma, conforme o planner cadastrado.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-4 print:hidden">
        <div>
          <label className="text-sm font-medium text-slate-700">Tipo</label>
          <select
            value={reportType}
            onChange={(event) => setReportType(event.target.value as 'employee' | 'class')}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="employee">Por professor</option>
            <option value="class">Por turma</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Escola</label>
          <select
            value={schoolId}
            onChange={(event) => setSchoolId(event.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Todas as escolas</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Servidor</label>
          <select
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Todos os servidores</option>
            {employees
              .filter((employee) => !schoolId || employee.school?.id === schoolId)
              .map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Turma</label>
          <select
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Todas as turmas</option>
            {filteredClasses.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 hidden print:block">
        <h1 className="text-lg font-bold">Relatorio de horarios</h1>
        <p className="text-xs text-slate-600">
          Gerado em {new Date().toLocaleDateString()} - SIGE
        </p>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">
          Carregando horarios...
        </div>
      ) : reportType === 'class' ? (
        classPlanners.length > 0 ? (
          <div className="grid gap-5">
            {classPlanners.map((planner) => (
              <ClassPlannerTable key={planner.classItem.id} planner={planner} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">
            Nenhum horário de turma encontrado para os filtros selecionados.
          </div>
        )
      ) : filteredPlanners.length > 0 ? (
        <div className="grid gap-5">
          <section className="rounded-lg border bg-white shadow-sm print:shadow-none">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold text-slate-950">
                Professor x horas x materia
              </h2>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[760px] border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-700">
                    <th className="border-b px-3 py-2">Professor</th>
                    <th className="border-b px-3 py-2">Escola</th>
                    <th className="border-b px-3 py-2">Materia</th>
                    <th className="border-b px-3 py-2 text-right">Horarios</th>
                    <th className="border-b px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row) => (
                    <tr key={`${row.employeeName}:${row.subject}`} className="border-b last:border-b-0">
                      <td className="px-3 py-2 font-medium text-slate-950">
                        {row.employeeName}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{row.schoolName}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-medium text-blue-950">
                          {row.subject}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {row.scheduleCount}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-950">
                        {formatMinutes(row.totalMinutes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {filteredPlanners.map((planner) => (
            <PlannerTable key={planner.employee.id} planner={planner} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">
          Nenhum planner encontrado para os filtros selecionados.
        </div>
      )}
    </section>
  );
}
