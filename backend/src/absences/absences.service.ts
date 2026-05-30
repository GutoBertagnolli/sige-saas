import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AbsencesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.absence.findMany({
      include: {
        employee: {
          include: {
            school: true,
          },
        },
        substitutions: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  create(data: any) {
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
            not: employee.id,
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

      const ranked = availableEmployees
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
}
