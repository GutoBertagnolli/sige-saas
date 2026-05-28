import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AbsencesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.absence.findMany({
      include: {
        employee: true,
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
        employee: true,
      },
    });
  }

  update(id: string, data: any) {
    return this.prisma.absence.update({
      where: { id },
      data,
      include: {
        employee: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.absence.delete({
      where: { id },
    });
  }
async getReplacementSuggestions(absenceId: string) {
  const absence = await this.prisma.absence.findUnique({
    where: { id: absenceId },
    include: {
      employee: {
        include: {
          weeklySchedules: {
            include: {
              timeSlot: true,
            },
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

  const suggestions = [];

  for (const schedule of employee.weeklySchedules) {
    const availableEmployees =
      await this.prisma.employee.findMany({
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
              weekday: schedule.weekday,
              timeSlotId: schedule.timeSlotId,
            },
          },
        },
      });

    const ranked = availableEmployees.map((candidate) => {
      const slot = candidate.weeklySchedules[0];

      let priority = 99;
      let reason = 'Indisponível';

      if (!slot && candidate.roleType === 'PROFESSOR') {
        priority = 2;
        reason = 'Professor livre';
      }

      if (
        slot?.type === 'HORA_ATIVIDADE'
      ) {
        priority = 1;
        reason = 'Hora atividade';
      }

      if (!slot && candidate.roleType === 'AUXILIAR') {
        priority = 3;
        reason = 'Auxiliar disponível';
      }

      if (!slot && candidate.roleType === 'ORIENTADOR') {
        priority = 4;
        reason = 'Orientador fallback';
      }

      if (!slot && candidate.roleType === 'DIRETOR') {
        priority = 5;
        reason = 'Diretor fallback';
      }

      return {
        employeeId: candidate.id,
        name: candidate.name,
        roleType: candidate.roleType,
        priority,
        reason,
      };
    });

    ranked.sort((a, b) => a.priority - b.priority);

    suggestions.push({
      weekday: schedule.weekday,
      timeSlot: schedule.timeSlot,
      replacements: ranked.slice(0, 5),
    });
  }

  return suggestions;
}
}
