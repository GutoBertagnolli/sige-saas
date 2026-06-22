import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubstitutionStatus, Weekday } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { WhatsAppNotificationsService } from '../whatsapp/whatsapp-notifications.service';

type CreateSubstitutionInput = {
  absenceId?: string;
  classScheduleId?: string | null;
  timeSlotId?: string | null;
  weekday?: Weekday | null;
  originalTeacherId?: string;
  substituteTeacherId?: string | null;
  score?: number;
  status?: SubstitutionStatus;
};

@Injectable()
export class SubstitutionsService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
    private whatsapp: WhatsAppNotificationsService,
  ) {}

  private async autoAcceptExpired() {
    const acceptanceTimeoutMinutes =
      await this.settings.getSubstitutionAcceptanceTimeoutMinutes();
    const expiresBefore = new Date(
      Date.now() - acceptanceTimeoutMinutes * 60 * 1000,
    );

    await this.prisma.substitution.updateMany({
      where: {
        status: {
          in: [SubstitutionStatus.PENDING_DIRECTOR, SubstitutionStatus.SENT_TO_TEACHER],
        },
        acceptedAt: null,
        createdAt: {
          lte: expiresBefore,
        },
      },
      data: {
        status: SubstitutionStatus.ACCEPTED,
        acceptedAt: new Date(),
        approvedBy: 'AUTO',
      },
    });
  }

  private async attachTeachers(substitution: any) {
    const employeeIds = [
      substitution.originalTeacherId,
      substitution.substituteTeacherId,
    ].filter(Boolean) as string[];

    const employees = await this.prisma.employee.findMany({
      where: {
        id: {
          in: employeeIds,
        },
      },
      include: {
        school: true,
      },
    });

    const employeeById = new Map(
      employees.map((employee) => [employee.id, employee]),
    );

    return {
      ...substitution,
      originalTeacher: employeeById.get(substitution.originalTeacherId) ?? null,
      substituteTeacher: substitution.substituteTeacherId
        ? employeeById.get(substitution.substituteTeacherId) ?? null
        : null,
    };
  }

  private getTimeKey(timeSlot?: { startTime?: string | null; endTime?: string | null } | null) {
    return timeSlot?.startTime && timeSlot.endTime
      ? `${timeSlot.startTime}-${timeSlot.endTime}`
      : '';
  }

  private isSameTimeSlot(
    candidateSchedule: { timeSlotId?: string | null; timeSlot?: { startTime?: string | null; endTime?: string | null } | null },
    timeSlotId?: string | null,
    timeKey?: string,
  ) {
    if (candidateSchedule.timeSlotId === timeSlotId) {
      return true;
    }

    return Boolean(timeKey && this.getTimeKey(candidateSchedule.timeSlot) === timeKey);
  }

  private async assertSubstituteCanActInSchool(params: {
    substituteId: string;
    schoolId: string;
    weekday: Weekday;
    timeSlotId: string;
  }) {
    const targetTimeSlot = await this.prisma.schoolTimeSlot.findUnique({
      where: {
        id: params.timeSlotId,
      },
    });
    const targetTimeKey = this.getTimeKey(targetTimeSlot);

    const substitute = await this.prisma.employee.findUnique({
      where: {
        id: params.substituteId,
      },
      include: {
        assignments: {
          where: {
            active: true,
          },
        },
        weeklySchedules: {
          where: {
            weekday: params.weekday,
            active: true,
          },
          include: {
            timeSlot: true,
          },
        },
      },
    });

    if (!substitute || !substitute.active) {
      throw new BadRequestException('Substituto invalido ou inativo.');
    }

    const isLinkedToSchool =
      substitute.schoolId === params.schoolId ||
      substitute.assignments.some((assignment) => assignment.schoolId === params.schoolId);

    if (!isLinkedToSchool) {
      throw new BadRequestException('Substituto nao esta vinculado a escola deste horario.');
    }

    const sameTimeSchedules = substitute.weeklySchedules.filter((schedule) =>
      this.isSameTimeSlot(schedule, params.timeSlotId, targetTimeKey),
    );
    const busyInAnotherSchool = sameTimeSchedules.some(
      (schedule) => schedule.schoolId !== params.schoolId,
    );

    if (busyInAnotherSchool) {
      throw new BadRequestException('Substituto esta em outra escola neste horario.');
    }
  }

  async getManagedSchoolIds(data: any = {}, substitutionId?: string) {
    const substitution = substitutionId
      ? await this.prisma.substitution.findUnique({
          where: {
            id: substitutionId,
          },
          include: {
            absence: {
              include: {
                employee: true,
              },
            },
            classSchedule: {
              include: {
                class: true,
              },
            },
          },
        })
      : null;
    const schoolIds: string[] = [];
    const classScheduleId = data.classScheduleId ?? substitution?.classScheduleId;
    const absenceId = data.absenceId ?? substitution?.absenceId;

    if (classScheduleId) {
      const classSchedule =
        substitution?.classScheduleId === classScheduleId
          ? substitution.classSchedule
          : await this.prisma.classSchedule.findUnique({
              where: {
                id: classScheduleId,
              },
              include: {
                class: true,
              },
            });

      if (classSchedule?.class?.schoolId) {
        return [classSchedule.class.schoolId];
      }
    }

    if (absenceId) {
      const absence =
        substitution?.absenceId === absenceId
          ? substitution.absence
          : await this.prisma.absence.findUnique({
              where: {
                id: absenceId,
              },
              include: {
                employee: true,
              },
            });

      if (absence?.employee?.schoolId) {
        schoolIds.push(absence.employee.schoolId);
      }
    }

    return Array.from(new Set(schoolIds));
  }

  async findAll() {
    await this.autoAcceptExpired();

    const substitutions = await this.prisma.substitution.findMany({
      include: {
        absence: {
          include: {
            employee: {
              include: {
                school: true,
              },
            },
          },
        },
        classSchedule: {
          include: {
            class: true,
          },
        },
        timeSlot: true,
        scoreDetails: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const employeeIds = Array.from(
      new Set(
        substitutions.flatMap((substitution) => [
          substitution.originalTeacherId,
          substitution.substituteTeacherId,
        ]).filter(Boolean) as string[],
      ),
    );

    const employees = await this.prisma.employee.findMany({
      where: {
        id: {
          in: employeeIds,
        },
      },
      include: {
        school: true,
      },
    });

    const employeeById = new Map(
      employees.map((employee) => [employee.id, employee]),
    );

    return substitutions.map((substitution) => ({
      ...substitution,
      originalTeacher: employeeById.get(substitution.originalTeacherId) ?? null,
      substituteTeacher: substitution.substituteTeacherId
        ? employeeById.get(substitution.substituteTeacherId) ?? null
        : null,
    }));
  }

  async findBySubstitute(employeeId: string) {
    await this.autoAcceptExpired();

    const substitutions = await this.prisma.substitution.findMany({
      where: {
        substituteTeacherId: employeeId,
        status: {
          in: [
            SubstitutionStatus.PENDING_DIRECTOR,
            SubstitutionStatus.SENT_TO_TEACHER,
            SubstitutionStatus.ACCEPTED,
            SubstitutionStatus.DECLINED,
          ],
        },
      },
      include: {
        absence: {
          include: {
            employee: {
              include: {
                school: true,
              },
            },
          },
        },
        classSchedule: {
          include: {
            class: true,
          },
        },
        timeSlot: true,
        scoreDetails: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Promise.all(
      substitutions.map((substitution) => this.attachTeachers(substitution)),
    );
  }

  async create(data: CreateSubstitutionInput) {
    if (!data.absenceId) {
      throw new BadRequestException('absenceId é obrigatório.');
    }

    if (!data.timeSlotId) {
      throw new BadRequestException('timeSlotId é obrigatório.');
    }

    if (!data.weekday) {
      throw new BadRequestException('weekday é obrigatório.');
    }

    if (!data.substituteTeacherId) {
      throw new BadRequestException('substituteTeacherId é obrigatório.');
    }

    const absence = await this.prisma.absence.findUnique({
      where: {
        id: data.absenceId,
      },
      include: {
        employee: true,
      },
    });

    if (!absence) {
      throw new NotFoundException('Afastamento não encontrado.');
    }

    const originalTeacherId = data.originalTeacherId ?? absence.employeeId;

    if (originalTeacherId === data.substituteTeacherId) {
      throw new BadRequestException('O substituto deve ser diferente do servidor afastado.');
    }

    const substitute = await this.prisma.employee.findUnique({
      where: {
        id: data.substituteTeacherId,
      },
    });

    if (!substitute || !substitute.active) {
      throw new BadRequestException('Substituto inválido ou inativo.');
    }

    const classSchedule = data.classScheduleId
      ? await this.prisma.classSchedule.findUnique({
          where: {
            id: data.classScheduleId,
          },
          include: {
            class: true,
          },
        })
      : null;
    const targetSchoolId = classSchedule?.class?.schoolId ?? absence.employee?.schoolId ?? null;

    if (targetSchoolId) {
      await this.assertSubstituteCanActInSchool({
        substituteId: data.substituteTeacherId,
        schoolId: targetSchoolId,
        weekday: data.weekday,
        timeSlotId: data.timeSlotId,
      });
    }

    const substituteAbsence = await this.prisma.absence.findFirst({
      where: {
        employeeId: data.substituteTeacherId,
        status: {
          not: 'CANCELLED',
        },
        startDate: {
          lte: absence.endDate,
        },
        endDate: {
          gte: absence.startDate,
        },
      },
    });

    if (substituteAbsence) {
      throw new BadRequestException(
        'Este servidor também está afastado no período e não pode ser substituto.',
      );
    }

    const existing = await this.prisma.substitution.findFirst({
      where: {
        absenceId: data.absenceId,
        timeSlotId: data.timeSlotId,
        weekday: data.weekday,
        classScheduleId: data.classScheduleId ?? null,
      },
      include: {
        timeSlot: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Já existe substituto selecionado para este afastamento, dia e horário. Apague a substituição atual antes de selecionar outro professor.',
      );
    }

    const simultaneousSubstitution = await this.prisma.substitution.findFirst({
      where: {
        absenceId: {
          not: data.absenceId,
        },
        substituteTeacherId: data.substituteTeacherId,
        timeSlotId: data.timeSlotId,
        weekday: data.weekday,
        status: {
          not: SubstitutionStatus.CANCELLED,
        },
      },
    });

    if (simultaneousSubstitution) {
      throw new ConflictException(
        'Este servidor já foi selecionado para outra substituição neste mesmo dia e horário.',
      );
    }

    const substitution = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.substitution.create({
        data: {
          absenceId: data.absenceId,
          classScheduleId: data.classScheduleId ?? null,
          timeSlotId: data.timeSlotId,
          weekday: data.weekday,
          originalTeacherId,
          substituteTeacherId: data.substituteTeacherId,
          score: data.score ?? 0,
          status: data.status ?? SubstitutionStatus.PENDING_DIRECTOR,
        },
        include: {
          absence: true,
          classSchedule: {
            include: {
              class: true,
            },
          },
          timeSlot: true,
          scoreDetails: true,
        },
      });

      await transaction.absence.update({
        where: {
          id: data.absenceId,
        },
        data: {
          status: 'SUBSTITUTIONS_GENERATED',
        },
      });

      return created;
    });

    const result = await this.attachTeachers(substitution);
    const whatsappSent = await this.whatsapp.sendSubstitutionRequest(result);

    return whatsappSent ? { ...result, status: SubstitutionStatus.SENT_TO_TEACHER } : result;
  }

  async accept(id: string) {
    const substitution = await this.prisma.substitution.findUnique({
      where: { id },
    });

    if (!substitution) {
      throw new NotFoundException('Substituição não encontrada.');
    }

    const accepted = await this.prisma.substitution.update({
      where: { id },
      data: {
        status: SubstitutionStatus.ACCEPTED,
        acceptedAt: new Date(),
        approvedBy: 'DIRECAO',
      },
      include: {
        absence: true,
        classSchedule: {
          include: {
            class: true,
          },
        },
        timeSlot: true,
        scoreDetails: true,
      },
    });

    return this.attachTeachers(accepted);
  }

  async decline(id: string) {
    const substitution = await this.prisma.substitution.findUnique({
      where: { id },
    });

    if (!substitution) {
      throw new NotFoundException('Substituição não encontrada.');
    }

    const declined = await this.prisma.substitution.update({
      where: { id },
      data: {
        status: SubstitutionStatus.DECLINED,
        acceptedAt: null,
        approvedBy: null,
      },
      include: {
        absence: true,
        classSchedule: {
          include: {
            class: true,
          },
        },
        timeSlot: true,
        scoreDetails: true,
      },
    });

    return this.attachTeachers(declined);
  }

  async update(id: string, data: any) {
    const substitution = await this.prisma.substitution.findUnique({
      where: { id },
    });

    if (!substitution) {
      throw new NotFoundException('Substituicao nao encontrada.');
    }

    if (
      data.substituteTeacherId &&
      data.substituteTeacherId !== substitution.substituteTeacherId
    ) {
      if (data.substituteTeacherId === substitution.originalTeacherId) {
        throw new BadRequestException('O substituto deve ser diferente do servidor afastado.');
      }

      const simultaneousSubstitution = await this.prisma.substitution.findFirst({
        where: {
          id: {
            not: id,
          },
          substituteTeacherId: data.substituteTeacherId,
          timeSlotId: substitution.timeSlotId,
          weekday: substitution.weekday,
          status: {
            not: SubstitutionStatus.CANCELLED,
          },
        },
      });

      if (simultaneousSubstitution) {
        throw new ConflictException(
          'Este servidor ja foi selecionado para outra substituicao neste mesmo dia e horario.',
        );
      }
    }

    const updated = await this.prisma.substitution.update({
      where: { id },
      data: {
        substituteTeacherId:
          data.substituteTeacherId === undefined
            ? undefined
            : data.substituteTeacherId || null,
        status: data.status,
        score:
          data.score === undefined || data.score === null
            ? undefined
            : Number(data.score),
      },
      include: {
        absence: {
          include: {
            employee: {
              include: {
                school: true,
              },
            },
          },
        },
        classSchedule: {
          include: {
            class: true,
          },
        },
        timeSlot: true,
        scoreDetails: true,
      },
    });

    return this.attachTeachers(updated);
  }

  async remove(id: string) {
    const substitution = await this.prisma.substitution.findUnique({
      where: { id },
    });

    if (!substitution) {
      throw new NotFoundException('Substituição não encontrada.');
    }

    return this.prisma.$transaction(async (transaction) => {
      const deleted = await transaction.substitution.delete({
        where: { id },
      });

      const remaining = await transaction.substitution.count({
        where: {
          absenceId: substitution.absenceId,
        },
      });

      if (remaining === 0) {
        await transaction.absence.update({
          where: {
            id: substitution.absenceId,
          },
          data: {
            status: 'OPEN',
          },
        });
      }

      return deleted;
    });
  }
}
