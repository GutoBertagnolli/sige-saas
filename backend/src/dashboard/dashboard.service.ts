import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AbsenceStatus, Prisma, SubstitutionStatus, Weekday } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../common/prisma.service';
import { getSchoolScope } from '../common/school-scope';

const ACTIVE_SUBSTITUTION_STATUSES: SubstitutionStatus[] = [
  SubstitutionStatus.PENDING_DIRECTOR,
  SubstitutionStatus.SENT_TO_TEACHER,
  SubstitutionStatus.ACCEPTED,
];

const PENDING_SUBSTITUTION_STATUSES: SubstitutionStatus[] = [
  SubstitutionStatus.PENDING_DIRECTOR,
  SubstitutionStatus.SENT_TO_TEACHER,
];

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService,
  ) {}

  async getSummary(authorization?: string) {
    const actor = await this.audit.getActor(authorization);

    if (!actor) {
      throw new UnauthorizedException('Sessao expirada. Entre novamente.');
    }

    const schoolScope = getSchoolScope(actor);
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const soonEnd = new Date(todayEnd);
    soonEnd.setDate(soonEnd.getDate() + 3);
    const last7Days = new Date(todayStart);
    last7Days.setDate(last7Days.getDate() - 6);

    const schoolsWhere: Prisma.SchoolWhereInput = {
      tenantId: actor.tenantId,
      active: true,
      ...(schoolScope ? { id: { in: schoolScope } } : {}),
    };
    const employeeSchoolWhere = this.employeeSchoolWhere(actor.tenantId, schoolScope);
    const substitutionWhere = this.substitutionSchoolWhere(actor.tenantId, schoolScope);
    const operationalSubstitutionWhere: Prisma.SubstitutionWhereInput = {
      AND: [
        substitutionWhere,
        {
          OR: [
            { status: { in: PENDING_SUBSTITUTION_STATUSES } },
            { createdAt: { gte: last7Days } },
            { weekday: this.todayWeekday(now) },
          ],
        },
      ],
    };

    const [
      schools,
      activeAbsences,
      endingAbsences,
      substitutions,
      todaySchedules,
      announcements,
      activities,
    ] = await Promise.all([
      this.prisma.school.findMany({
        where: schoolsWhere,
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.absence.findMany({
        where: {
          status: { not: AbsenceStatus.CANCELLED },
          startDate: { lt: todayEnd },
          endDate: { gte: todayStart },
          employee: employeeSchoolWhere,
        },
        include: {
          employee: {
            include: {
              school: true,
              assignments: {
                where: { active: true },
                include: { school: true },
              },
            },
          },
        },
      }),
      this.prisma.absence.findMany({
        where: {
          status: { not: AbsenceStatus.CANCELLED },
          endDate: {
            gte: todayStart,
            lt: soonEnd,
          },
          employee: employeeSchoolWhere,
        },
        include: {
          employee: {
            include: {
              school: true,
              assignments: {
                where: { active: true },
                include: { school: true },
              },
            },
          },
        },
      }),
      this.prisma.substitution.findMany({
        where: operationalSubstitutionWhere,
        include: {
          absence: {
            include: {
              employee: {
                include: {
                  school: true,
                  assignments: {
                    where: { active: true },
                    include: { school: true },
                  },
                },
              },
            },
          },
          classSchedule: {
            include: {
              class: {
                include: { school: true },
              },
              subject: true,
              timeSlot: true,
            },
          },
          timeSlot: true,
        },
      }),
      this.prisma.substitution.findMany({
        where: {
          ...substitutionWhere,
          weekday: this.todayWeekday(now),
          status: { in: ACTIVE_SUBSTITUTION_STATUSES },
        },
        include: {
          absence: {
            include: {
              employee: {
                include: {
                  school: true,
                  assignments: {
                    where: { active: true },
                    include: { school: true },
                  },
                },
              },
            },
          },
          classSchedule: {
            include: {
              class: {
                include: { school: true },
              },
              subject: true,
              timeSlot: true,
            },
          },
          timeSlot: true,
        },
      }),
      this.prisma.announcement.findMany({
        where: {
          tenantId: actor.tenantId,
          ...(schoolScope ? { OR: [{ schoolId: null }, { schoolId: { in: schoolScope } }] } : {}),
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: now } }] },
            { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          ],
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        take: 5,
      }),
      this.prisma.auditLog.findMany({
        where: {
          user: {
            tenantId: actor.tenantId,
          },
        },
        select: {
          id: true,
          action: true,
          entity: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const teacherMap = await this.getTeacherMap([...substitutions, ...todaySchedules]);
    const rankingEscolas = this.buildSchoolRanking(schools, activeAbsences, substitutions);
    const flow = this.buildSubstitutionFlow(substitutions);
    const semProfessor = substitutions.filter(
      (substitution) =>
        PENDING_SUBSTITUTION_STATUSES.includes(substitution.status) && !substitution.substituteTeacherId,
    );
    const pendingOlderThan24h = substitutions.filter(
      (substitution) =>
        PENDING_SUBSTITUTION_STATUSES.includes(substitution.status) &&
        substitution.createdAt.getTime() <= Date.now() - 24 * 60 * 60 * 1000,
    );
    const missingDocuments = activeAbsences.filter((absence) => !absence.documentUrl);

    return {
      cards: {
        substituicoesPendentes: flow.aguardandoDiretor + flow.aguardandoOrientacao,
        substituicoesSemProfessor: semProfessor.length,
        afastamentosAtivos: activeAbsences.length,
        afastamentosVencendo: endingAbsences.length,
        escolasComPendencia: rankingEscolas.filter((school) => school.pendencias > 0).length,
        servidoresIndisponiveisHoje: new Set(activeAbsences.map((absence) => absence.employeeId)).size,
      },
      alertas: this.buildAlerts(semProfessor, pendingOlderThan24h, missingDocuments),
      agendaHoje: this.buildTodayAgenda(todaySchedules, teacherMap),
      graficos: {
        substituicoesUltimos7Dias: this.buildLast7Days(substitutions, last7Days),
        afastamentosPorTipo: this.buildAbsencesByType(activeAbsences),
        pendenciasPorStatus: this.buildPendingByStatus(substitutions),
      },
      rankingEscolas,
      mensagens: announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        createdBy: announcement.createdBy,
        createdAt: announcement.createdAt,
      })),
      atividadesRecentes: activities.map((activity) => ({
        id: activity.id,
        action: activity.action,
        entity: activity.entity,
        userName: activity.user?.name ?? activity.user?.email ?? 'Sistema',
        createdAt: activity.createdAt,
        description: this.describeActivity(activity),
      })),
      fluxoSubstituicoes: flow,
    };
  }

  private employeeSchoolWhere(tenantId: string, schoolScope?: string[]): Prisma.EmployeeWhereInput {
    return {
      tenantId,
      active: true,
      ...(schoolScope
        ? {
            OR: [
              { schoolId: { in: schoolScope } },
              { assignments: { some: { schoolId: { in: schoolScope }, active: true } } },
            ],
          }
        : {}),
    };
  }

  private substitutionSchoolWhere(tenantId: string, schoolScope?: string[]): Prisma.SubstitutionWhereInput {
    const tenantWhere: Prisma.SubstitutionWhereInput = {
      absence: {
        employee: {
          tenantId,
        },
      },
    };

    if (!schoolScope) {
      return tenantWhere;
    }

    return {
      AND: [
        tenantWhere,
        {
          OR: [
            { classSchedule: { class: { schoolId: { in: schoolScope } } } },
            {
              absence: {
                employee: {
                  OR: [
                    { schoolId: { in: schoolScope } },
                    { assignments: { some: { schoolId: { in: schoolScope }, active: true } } },
                  ],
                },
              },
            },
          ],
        },
      ],
    };
  }

  private todayWeekday(date: Date): Weekday {
    const weekdays: Weekday[] = [
      Weekday.SUNDAY,
      Weekday.MONDAY,
      Weekday.TUESDAY,
      Weekday.WEDNESDAY,
      Weekday.THURSDAY,
      Weekday.FRIDAY,
      Weekday.SATURDAY,
    ];

    return weekdays[date.getDay()];
  }

  private async getTeacherMap(substitutions: any[]) {
    const ids = Array.from(
      new Set(
        substitutions
          .flatMap((substitution) => [substitution.originalTeacherId, substitution.substituteTeacherId])
          .filter(Boolean),
      ),
    );

    if (ids.length === 0) {
      return new Map<string, string>();
    }

    const teachers = await this.prisma.employee.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });

    return new Map(teachers.map((teacher) => [teacher.id, teacher.name]));
  }

  private buildSchoolRanking(schools: { id: string; name: string }[], absences: any[], substitutions: any[]) {
    const map = new Map(
      schools.map((school) => [
        school.id,
        {
          schoolId: school.id,
          escola: school.name,
          afastamentos: 0,
          substituicoes: 0,
          pendencias: 0,
          status: 'Normal',
        },
      ]),
    );

    for (const absence of absences) {
      const schoolId = this.getAbsenceSchoolId(absence);
      if (schoolId && map.has(schoolId)) {
        map.get(schoolId)!.afastamentos += 1;
      }
    }

    for (const substitution of substitutions) {
      const schoolId = this.getSubstitutionSchoolId(substitution);
      if (!schoolId || !map.has(schoolId)) continue;

      const school = map.get(schoolId)!;
      school.substituicoes += 1;

      if (
        PENDING_SUBSTITUTION_STATUSES.includes(substitution.status) ||
        (substitution.status !== SubstitutionStatus.CANCELLED && !substitution.substituteTeacherId)
      ) {
        school.pendencias += 1;
      }
    }

    return Array.from(map.values())
      .map((school) => ({
        ...school,
        status: school.pendencias > 0 ? 'Atencao' : 'Normal',
      }))
      .sort(
        (first, second) =>
          second.pendencias - first.pendencias ||
          second.afastamentos + second.substituicoes - (first.afastamentos + first.substituicoes) ||
          first.escola.localeCompare(second.escola),
      )
      .slice(0, 8);
  }

  private buildAlerts(semProfessor: any[], pendingOlderThan24h: any[], missingDocuments: any[]) {
    const alerts = [];
    const missingBySchool = new Map<string, number>();

    for (const substitution of semProfessor) {
      const schoolName = this.getSubstitutionSchoolName(substitution) ?? 'Escola nao informada';
      missingBySchool.set(schoolName, (missingBySchool.get(schoolName) ?? 0) + 1);
    }

    for (const [schoolName, total] of missingBySchool) {
      alerts.push({
        id: `sem-professor-${schoolName}`,
        severity: 'critical',
        title: 'Horario sem professor',
        description: `${schoolName} possui ${total} horario(s) sem professor substituto.`,
      });
    }

    if (pendingOlderThan24h.length > 0) {
      alerts.push({
        id: 'pendentes-24h',
        severity: 'warning',
        title: 'Substituicoes atrasadas',
        description: `${pendingOlderThan24h.length} substituicao(oes) estao pendentes ha mais de 24 horas.`,
      });
    }

    if (missingDocuments.length > 0) {
      alerts.push({
        id: 'afastamentos-sem-documento',
        severity: 'info',
        title: 'Documentacao pendente',
        description: `${missingDocuments.length} afastamento(s) ativo(s) estao sem documento anexado.`,
      });
    }

    return alerts;
  }

  private buildTodayAgenda(substitutions: any[], teacherMap: Map<string, string>) {
    return substitutions
      .map((substitution) => {
        const timeSlot = substitution.classSchedule?.timeSlot ?? substitution.timeSlot;

        return {
          id: substitution.id,
          horario: timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : 'Horario nao informado',
          escola: this.getSubstitutionSchoolName(substitution) ?? '-',
          turma: substitution.classSchedule?.class?.name ?? '-',
          disciplina: substitution.classSchedule?.subject?.name ?? '-',
          servidorTitular:
            teacherMap.get(substitution.originalTeacherId) ??
            substitution.absence?.employee?.name ??
            'Nao informado',
          substituto: substitution.substituteTeacherId
            ? teacherMap.get(substitution.substituteTeacherId) ?? 'Nao informado'
            : '-',
          situacao: this.substitutionStatusLabel(substitution),
          status: substitution.status,
          sortTime: timeSlot?.startTime ?? '99:99',
        };
      })
      .sort((first, second) => first.sortTime.localeCompare(second.sortTime))
      .map(({ sortTime, ...item }) => item);
  }

  private buildSubstitutionFlow(substitutions: any[]) {
    return {
      criadas: substitutions.length,
      aguardandoDiretor: substitutions.filter(
        (substitution) => substitution.status === SubstitutionStatus.PENDING_DIRECTOR,
      ).length,
      aguardandoOrientacao: substitutions.filter(
        (substitution) => substitution.status === SubstitutionStatus.SENT_TO_TEACHER,
      ).length,
      aprovadas: substitutions.filter((substitution) => substitution.status === SubstitutionStatus.ACCEPTED).length,
      recusadas: substitutions.filter((substitution) => substitution.status === SubstitutionStatus.DECLINED).length,
      canceladas: substitutions.filter((substitution) => substitution.status === SubstitutionStatus.CANCELLED).length,
    };
  }

  private buildLast7Days(substitutions: any[], startDate: Date) {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      return {
        data: dayStart.toISOString().slice(0, 10),
        total: substitutions.filter(
          (substitution) => substitution.createdAt >= dayStart && substitution.createdAt < dayEnd,
        ).length,
      };
    });
  }

  private buildAbsencesByType(absences: any[]) {
    const byType = new Map<string, number>();

    for (const absence of absences) {
      byType.set(absence.type || 'Nao informado', (byType.get(absence.type || 'Nao informado') ?? 0) + 1);
    }

    return Array.from(byType.entries()).map(([tipo, total]) => ({ tipo, total }));
  }

  private buildPendingByStatus(substitutions: any[]) {
    return Object.values(SubstitutionStatus).map((status) => ({
      status,
      total: substitutions.filter((substitution) => substitution.status === status).length,
    }));
  }

  private substitutionStatusLabel(substitution: any) {
    if (!substitution.substituteTeacherId && substitution.status !== SubstitutionStatus.CANCELLED) {
      return 'Sem substituto';
    }

    const labels: Record<string, string> = {
      PENDING_DIRECTOR: 'Aguardando aprovacao',
      SENT_TO_TEACHER: 'Pendente',
      ACCEPTED: 'Substituido',
      DECLINED: 'Recusado',
      CANCELLED: 'Cancelado',
    };

    return labels[substitution.status] ?? substitution.status;
  }

  private describeActivity(activity: any) {
    const actionLabels: Record<string, string> = {
      CREATE: 'cadastrou',
      UPDATE: 'alterou',
      DELETE: 'excluiu',
      LOGIN: 'acessou o sistema',
      FORCE_LOGOFF: 'encerrou uma sessao',
      FORCE_LOGOFF_ALL: 'encerrou sessoes online',
      ACCEPT: 'aceitou',
      DECLINE: 'recusou',
    };
    const action = actionLabels[activity.action] ?? activity.action.toLowerCase();

    if (activity.action === 'LOGIN') {
      return `${activity.user?.name ?? 'Usuario'} acessou o sistema.`;
    }

    return `${activity.user?.name ?? 'Sistema'} ${action} ${activity.entity}.`;
  }

  private getSubstitutionSchoolId(substitution: any) {
    return substitution.classSchedule?.class?.schoolId ?? this.getAbsenceSchoolId(substitution.absence);
  }

  private getSubstitutionSchoolName(substitution: any) {
    return substitution.classSchedule?.class?.school?.name ?? this.getAbsenceSchoolName(substitution.absence);
  }

  private getAbsenceSchoolId(absence: any) {
    return absence?.employee?.schoolId ?? absence?.employee?.assignments?.[0]?.schoolId ?? null;
  }

  private getAbsenceSchoolName(absence: any) {
    return absence?.employee?.school?.name ?? absence?.employee?.assignments?.[0]?.school?.name ?? null;
  }
}
