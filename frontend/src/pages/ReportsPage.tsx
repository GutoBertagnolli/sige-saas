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

type Absence = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  employee?: Employee | null;
};

type Substitution = {
  id: string;
  status: string;
  originalTeacher?: Employee | null;
  substituteTeacher?: Employee | null;
  absence?: {
    employee?: Employee | null;
  } | null;
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

type RankingRow = {
  key: string;
  label: string;
  schoolName?: string;
  count: number;
  days?: number;
};

type ReportType = 'employee' | 'class' | 'absences' | 'substitutions';

type ReportUser = {
  name: string;
  email: string;
};

const REPORT_SECTIONS: Array<{
  id: ReportType;
  label: string;
  description: string;
}> = [
  {
    id: 'employee',
    label: 'Professores',
    description: 'Planner semanal e total de horas por disciplina.',
  },
  {
    id: 'class',
    label: 'Turmas',
    description: 'Horários por turma, professor e disciplina.',
  },
  {
    id: 'absences',
    label: 'Afastamentos',
    description: 'Ranking geral, por escola e por servidor.',
  },
  {
    id: 'substitutions',
    label: 'Substituições',
    description: 'Ranking dos servidores que mais substituem.',
  },
];

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

async function getAbsences() {
  const response = await api.get<Absence[]>('/absences');
  return response.data;
}

async function getSubstitutions() {
  const response = await api.get<Substitution[]>('/substitutions');
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

function getDateDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
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
                              {schedule.subject || getEmployeeSubject(planner.employee) || 'Disciplina nao informada'}
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

function RankingTable({
  title,
  description,
  rows,
  countLabel,
  showDays = false,
}: {
  title: string;
  description: string;
  rows: RankingRow[];
  countLabel: string;
  showDays?: boolean;
}) {
  return (
    <section className="rounded-lg border bg-white shadow-sm print:shadow-none">
      <div className="border-b px-4 py-3">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[680px] border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-700">
              <th className="w-16 border-b px-3 py-2 text-right">Rank</th>
              <th className="border-b px-3 py-2">Nome</th>
              <th className="border-b px-3 py-2">Escola</th>
              <th className="border-b px-3 py-2 text-right">{countLabel}</th>
              {showDays && (
                <th className="border-b px-3 py-2 text-right">Dias</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key} className="border-b last:border-b-0">
                <td className="px-3 py-2 text-right font-semibold text-slate-500">
                  {index + 1}
                </td>
                <td className="px-3 py-2 font-medium text-slate-950">{row.label}</td>
                <td className="px-3 py-2 text-slate-600">{row.schoolName || '-'}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-950">
                  {row.count}
                </td>
                {showDays && (
                  <td className="px-3 py-2 text-right font-semibold text-slate-950">
                    {row.days ?? 0}
                  </td>
                )}
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={showDays ? 5 : 4}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  Nenhum registro encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
                              {schedule.subject || getEmployeeSubject(schedule.employee) || 'Disciplina não informada'}
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

export default function ReportsPage({ user }: { user: ReportUser }) {
  const [schoolId, setSchoolId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [classId, setClassId] = useState('');
  const [reportType, setReportType] = useState<ReportType>('employee');
  const [generatedAt, setGeneratedAt] = useState(() => new Date());

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: getClasses,
  });

  const { data: absences = [], isLoading: loadingAbsences } = useQuery({
    queryKey: ['absences'],
    queryFn: getAbsences,
  });

  const { data: substitutions = [], isLoading: loadingSubstitutions } = useQuery({
    queryKey: ['substitutions'],
    queryFn: getSubstitutions,
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

  const activeAbsences = useMemo(
    () => absences.filter((absence) => absence.status !== 'CANCELLED'),
    [absences],
  );

  const absenceRowsByEmployee = useMemo(() => {
    const rowsByEmployee = new Map<string, RankingRow>();

    activeAbsences.forEach((absence) => {
      const employee = absence.employee;

      if (!employee?.id) return;
      if (schoolId && employee.school?.id !== schoolId) return;
      if (employeeId && employee.id !== employeeId) return;

      const current =
        rowsByEmployee.get(employee.id) ??
        {
          key: employee.id,
          label: employee.name,
          schoolName: employee.school?.name ?? 'Sem escola vinculada',
          count: 0,
          days: 0,
        };

      current.count += 1;
      current.days = (current.days ?? 0) + getDateDays(absence.startDate, absence.endDate);
      rowsByEmployee.set(employee.id, current);
    });

    return Array.from(rowsByEmployee.values()).sort(
      (a, b) => b.count - a.count || (b.days ?? 0) - (a.days ?? 0) || a.label.localeCompare(b.label),
    );
  }, [activeAbsences, schoolId, employeeId]);

  const absenceRowsBySchool = useMemo(() => {
    const rowsBySchool = new Map<string, RankingRow>();

    activeAbsences.forEach((absence) => {
      const school = absence.employee?.school;
      const key = school?.id ?? 'no-school';

      if (schoolId && key !== schoolId) return;

      const current =
        rowsBySchool.get(key) ??
        {
          key,
          label: school?.name ?? 'Sem escola vinculada',
          schoolName: school?.name ?? 'Sem escola vinculada',
          count: 0,
          days: 0,
        };

      current.count += 1;
      current.days = (current.days ?? 0) + getDateDays(absence.startDate, absence.endDate);
      rowsBySchool.set(key, current);
    });

    return Array.from(rowsBySchool.values()).sort(
      (a, b) => b.count - a.count || (b.days ?? 0) - (a.days ?? 0) || a.label.localeCompare(b.label),
    );
  }, [activeAbsences, schoolId]);

  const activeSubstitutions = useMemo(
    () => substitutions.filter((substitution) => substitution.status !== 'CANCELLED'),
    [substitutions],
  );

  const substitutionRowsByEmployee = useMemo(() => {
    const rowsByEmployee = new Map<string, RankingRow>();

    activeSubstitutions.forEach((substitution) => {
      const employee = substitution.substituteTeacher;

      if (!employee?.id) return;
      if (schoolId && employee.school?.id !== schoolId) return;
      if (employeeId && employee.id !== employeeId) return;

      const current =
        rowsByEmployee.get(employee.id) ??
        {
          key: employee.id,
          label: employee.name,
          schoolName: employee.school?.name ?? 'Sem escola vinculada',
          count: 0,
        };

      current.count += 1;
      rowsByEmployee.set(employee.id, current);
    });

    return Array.from(rowsByEmployee.values()).sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label),
    );
  }, [activeSubstitutions, schoolId, employeeId]);

  const substitutionRowsBySchool = useMemo(() => {
    const rowsBySchool = new Map<string, RankingRow>();

    activeSubstitutions.forEach((substitution) => {
      const school = substitution.substituteTeacher?.school;
      const key = school?.id ?? 'no-school';

      if (schoolId && key !== schoolId) return;

      const current =
        rowsBySchool.get(key) ??
        {
          key,
          label: school?.name ?? 'Sem escola vinculada',
          schoolName: school?.name ?? 'Sem escola vinculada',
          count: 0,
        };

      current.count += 1;
      rowsBySchool.set(key, current);
    });

    return Array.from(rowsBySchool.values()).sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label),
    );
  }, [activeSubstitutions, schoolId]);

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
      const defaultSubject = getEmployeeSubject(planner.employee) || 'Disciplina nao informada';

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

  const loading =
    loadingEmployees ||
    loadingClasses ||
    loadingPlanners ||
    loadingAbsences ||
    loadingSubstitutions;

  const currentReport =
    REPORT_SECTIONS.find((section) => section.id === reportType) ??
    REPORT_SECTIONS[0];
  const generatedDate = generatedAt.toLocaleDateString('pt-BR');
  const generatedTime = generatedAt.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  function selectReportType(nextReportType: ReportType) {
    setReportType(nextReportType);

    if (nextReportType === 'class') {
      setEmployeeId('');
    } else {
      setClassId('');
    }
  }

  return (
    <section className="p-5 print:bg-white print:p-0">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">
            Relatorio de horarios
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quadros semanais e rankings de afastamentos e substituições.
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
            onClick={() => {
              setGeneratedAt(new Date());
              window.setTimeout(() => window.print(), 0);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto print:hidden">
        <div className="inline-flex min-w-full gap-1 rounded-lg border bg-white p-1 shadow-sm md:min-w-0">
          {REPORT_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => selectReportType(section.id)}
              className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium transition ${
                reportType === section.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 rounded-lg border bg-white p-4 shadow-sm print:hidden">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-950">
            {currentReport.label}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {currentReport.description}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
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

          {reportType === 'class' ? (
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
          ) : (
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
          )}
        </div>
      </div>

      <div className="mb-4 hidden border-b pb-3 print:block">
        <h1 className="text-lg font-bold">{currentReport.label}</h1>
        <p className="text-xs text-slate-600">
          Relatorio gerado por {user.name} ({user.email}) em {generatedDate} as {generatedTime}
        </p>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-white p-5 text-sm text-slate-500">
          Carregando horarios...
        </div>
      ) : reportType === 'absences' ? (
        <div className="grid gap-5">
          <section className="rounded-lg border bg-white p-4 shadow-sm print:shadow-none">
            <h2 className="text-base font-semibold text-slate-950">
              Geral de afastamentos
            </h2>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-lg border bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Afastamentos</div>
                <div className="text-2xl font-semibold">{absenceRowsByEmployee.reduce((sum, row) => sum + row.count, 0)}</div>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Dias afastados</div>
                <div className="text-2xl font-semibold">{absenceRowsByEmployee.reduce((sum, row) => sum + (row.days ?? 0), 0)}</div>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Servidores no ranking</div>
                <div className="text-2xl font-semibold">{absenceRowsByEmployee.length}</div>
              </div>
            </div>
          </section>

          <RankingTable
            title="Afastamentos por servidor"
            description="Servidores ordenados de quem mais faltou para quem menos faltou."
            rows={absenceRowsByEmployee}
            countLabel="Afastamentos"
            showDays
          />

          <RankingTable
            title="Afastamentos por escola"
            description="Escolas ordenadas pelo total de afastamentos."
            rows={absenceRowsBySchool}
            countLabel="Afastamentos"
            showDays
          />
        </div>
      ) : reportType === 'substitutions' ? (
        <div className="grid gap-5">
          <section className="rounded-lg border bg-white p-4 shadow-sm print:shadow-none">
            <h2 className="text-base font-semibold text-slate-950">
              Geral de substituições
            </h2>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-lg border bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Substituições</div>
                <div className="text-2xl font-semibold">{substitutionRowsByEmployee.reduce((sum, row) => sum + row.count, 0)}</div>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Substitutos no ranking</div>
                <div className="text-2xl font-semibold">{substitutionRowsByEmployee.length}</div>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Escolas no ranking</div>
                <div className="text-2xl font-semibold">{substitutionRowsBySchool.length}</div>
              </div>
            </div>
          </section>

          <RankingTable
            title="Substituições por servidor"
            description="Servidores ordenados de quem mais substituiu para quem menos substituiu."
            rows={substitutionRowsByEmployee}
            countLabel="Substituições"
          />

          <RankingTable
            title="Substituições por escola"
            description="Escolas ordenadas pelo total de substituições realizadas."
            rows={substitutionRowsBySchool}
            countLabel="Substituições"
          />
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
                Professor x horas x disciplina
              </h2>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[760px] border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-700">
                    <th className="border-b px-3 py-2">Professor</th>
                    <th className="border-b px-3 py-2">Escola</th>
                    <th className="border-b px-3 py-2">Disciplina</th>
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
