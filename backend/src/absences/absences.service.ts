import { BadRequestException, Injectable } from '@nestjs/common';
import { SubstitutionStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AbsencesService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  private async autoAcceptExpiredSubstitutions() {
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

  async findAll() {
    await this.autoAcceptExpiredSubstitutions();

    return this.prisma.absence.findMany({
      include: {
        employee: {
          include: {
            school: true,
          },
        },
        substitutions: {
          include: {
            classSchedule: {
              include: {
                class: true,
              },
            },
            timeSlot: true,
            scoreDetails: true,
          },
          orderBy: [
            { weekday: 'asc' },
            { timeSlot: { slotOrder: 'asc' } },
          ],
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    }).then(async (absences) => {
      const employeeIds = Array.from(
        new Set(
          absences
            .flatMap((absence) =>
              absence.substitutions.flatMap((substitution) => [
                substitution.originalTeacherId,
                substitution.substituteTeacherId,
              ]),
            )
            .filter(Boolean) as string[],
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

      return absences.map((absence) => ({
        ...absence,
        substitutions: absence.substitutions.map((substitution) => ({
          ...substitution,
          originalTeacher:
            employeeById.get(substitution.originalTeacherId) ?? null,
          substituteTeacher: substitution.substituteTeacherId
            ? employeeById.get(substitution.substituteTeacherId) ?? null
            : null,
        })),
      }));
    });
  }

  async create(data: any) {
    const existingAbsence = await this.prisma.absence.findFirst({
      where: {
        employeeId: data.employeeId,
        status: {
          not: 'CANCELLED',
        },
        startDate: {
          lte: new Date(data.endDate),
        },
        endDate: {
          gte: new Date(data.startDate),
        },
      },
    });

    if (existingAbsence) {
      throw new BadRequestException(
        'Este servidor já possui afastamento cadastrado neste período.',
      );
    }

    return this.prisma.absence.create({
      data,
      include: {
        employee: {
          include: {
            school: true,
          },
        },
      },
    });
  }

  update(id: string, data: any) {
    return this.prisma.absence.update({
      where: { id },
      data,
      include: {
        employee: {
          include: {
            school: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.substitution.deleteMany({
        where: {
          absenceId: id,
        },
      });

      return transaction.absence.delete({
        where: { id },
      });
    });
  }

  async getReplacementSuggestions(absenceId: string) {
    const absence = await this.prisma.absence.findUnique({
      where: { id: absenceId },
      include: {
        employee: {
          include: {
            weeklySchedules: {
              where: {
                active: true,
                requiresSubstitution: true,
              },
              include: {
                class: true,
                timeSlot: true,
              },
              orderBy: [
                { weekday: 'asc' },
                { timeSlot: { slotOrder: 'asc' } },
              ],
            },
            school: true,
          },
        },
      },
    });

    if (!absence) {
      return [];
    }

    const employee = absence.employee;

    if (!employee.schoolId) {
      return [];
    }

    const absentEmployeeIds = await this.getAbsentEmployeeIds(
      absence.startDate,
      absence.endDate,
    );
    absentEmployeeIds.add(employee.id);

    const suggestions = [];

    for (const schedule of employee.weeklySchedules) {
      const classSchedule = schedule.classId
        ? await this.prisma.classSchedule.findFirst({
            where: {
              classId: schedule.classId,
              weekday: schedule.weekday,
              timeSlotId: schedule.timeSlotId,
              teacherId: employee.id,
              isActive: true,
            },
            include: {
              class: true,
            },
          })
        : null;

      const availableEmployees = await this.prisma.employee.findMany({
        where: {
          schoolId: employee.schoolId,
          id: {
            notIn: Array.from(absentEmployeeIds),
          },
          active: true,
        },
        include: {
          weeklySchedules: {
            where: {
              active: true,
              weekday: schedule.weekday,
              timeSlotId: schedule.timeSlotId,
            },
          },
        },
      });

      const busySubstituteIds = await this.getBusySubstituteIds(
        absence.id,
        schedule.weekday,
        schedule.timeSlotId,
      );

      const ranked = availableEmployees
        .filter((candidate) => !busySubstituteIds.has(candidate.id))
        .map((candidate) => {
          const slot = candidate.weeklySchedules[0];

          let priority = 99;
          let reason = 'Indisponível neste horário';

          if (slot?.type === 'HORA_ATIVIDADE') {
            priority = 1;
            reason = 'Hora atividade';
          } else if (!slot && candidate.roleType === 'PROFESSOR') {
            priority = 2;
            reason = 'Professor livre';
          } else if (!slot && candidate.roleType === 'AUXILIAR') {
            priority = 3;
            reason = 'Auxiliar disponível';
          } else if (!slot && candidate.roleType === 'ORIENTADOR') {
            priority = 4;
            reason = 'Orientador fallback';
          } else if (!slot && candidate.roleType === 'DIRETOR') {
            priority = 5;
            reason = 'Diretor fallback';
          } else if (!slot) {
            priority = 6;
            reason = 'Servidor livre';
          }

          return {
            employeeId: candidate.id,
            name: candidate.name,
            roleType: candidate.roleType,
            priority,
            reason,
          };
        })
        .filter((candidate) => candidate.priority < 99)
        .sort((a, b) => a.priority - b.priority);

      suggestions.push({
        absenceId: absence.id,
        originalTeacherId: employee.id,
        weekday: schedule.weekday,
        classScheduleId: classSchedule?.id ?? null,
        className: classSchedule?.class?.name ?? schedule.class?.name ?? null,
        timeSlot: schedule.timeSlot,
        replacements: ranked.slice(0, 5),
      });
    }

    return suggestions;
  }

  private async getAbsentEmployeeIds(startDate: Date, endDate: Date) {
    const overlappingAbsences = await this.prisma.absence.findMany({
      where: {
        status: {
          not: 'CANCELLED',
        },
        startDate: {
          lte: endDate,
        },
        endDate: {
          gte: startDate,
        },
      },
      select: {
        employeeId: true,
      },
    });

    return new Set(overlappingAbsences.map((absence) => absence.employeeId));
  }

  private async getBusySubstituteIds(
    absenceId: string,
    weekday: any,
    timeSlotId: string,
  ) {
    const substitutions = await this.prisma.substitution.findMany({
      where: {
        absenceId: {
          not: absenceId,
        },
        weekday,
        timeSlotId,
        status: {
          not: 'CANCELLED',
        },
        substituteTeacherId: {
          not: null,
        },
      },
      select: {
        substituteTeacherId: true,
      },
    });

    return new Set(
      substitutions
        .map((substitution) => substitution.substituteTeacherId)
        .filter(Boolean) as string[],
    );
  }
}
