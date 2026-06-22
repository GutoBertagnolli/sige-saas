import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async findBySchoolAndSlot(params: {
    schoolId: string;
    weekday: any;
    timeSlotId: string;
  }) {
    const { schoolId, weekday, timeSlotId } = params;
    const targetTimeSlot = await this.prisma.schoolTimeSlot.findUnique({
      where: {
        id: timeSlotId,
      },
    });
    const targetTimeKey = targetTimeSlot
      ? `${targetTimeSlot.startTime}-${targetTimeSlot.endTime}`
      : '';

    const employees = await this.prisma.employee.findMany({
      where: {
        OR: [
          { schoolId },
          {
            assignments: {
              some: {
                schoolId,
                active: true,
              },
            },
          },
        ],
        active: true,
      },
      include: {
        school: true,
        weeklySchedules: {
          where: {
            weekday,
            active: true,
          },
          include: {
            timeSlot: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const result = employees.map((employee) => {
      const schedulesAtSameTime = employee.weeklySchedules.filter((schedule) => {
        if (schedule.timeSlotId === timeSlotId) {
          return true;
        }

        if (!targetTimeKey || !schedule.timeSlot) {
          return false;
        }

        return `${schedule.timeSlot.startTime}-${schedule.timeSlot.endTime}` === targetTimeKey;
      });
      const busyInAnotherSchool = schedulesAtSameTime.some(
        (schedule) => schedule.schoolId !== schoolId,
      );
      const schedule = schedulesAtSameTime.find(
        (item) => item.schoolId === schoolId,
      );

      let status = 'LIVRE';
      let canSubstitute = false;
      let priority = 99;
      let reason = 'Servidor não possui jornada cadastrada neste horário.';

      if (busyInAnotherSchool) {
        status = 'OCUPADO_OUTRA_ESCOLA';
        canSubstitute = false;
        priority = 90;
        reason = 'Servidor esta em outra escola neste horário.';
      } else if (schedule) {
        status = schedule.type;

        if (schedule.type === 'HORA_ATIVIDADE') {
          canSubstitute = true;
          priority = 1;
          reason = 'Professor em hora atividade na própria unidade.';
        } else {
          canSubstitute = false;
          priority = 90;
          reason = 'Servidor já está ocupado neste horário.';
        }
      }

      if (!schedule && employee.roleType === 'PROFESSOR') {
        canSubstitute = true;
        priority = 2;
        reason = 'Professor livre na própria unidade.';
      }

      if (!schedule && employee.roleType === 'AUXILIAR') {
        canSubstitute = true;
        priority = 3;
        reason = 'Auxiliar disponível na própria unidade.';
      }

      if (!schedule && employee.roleType === 'ORIENTADOR') {
        canSubstitute = true;
        priority = 4;
        reason = 'Orientador sugerido como fallback.';
      }

      if (!schedule && employee.roleType === 'DIRETOR') {
        canSubstitute = true;
        priority = 5;
        reason = 'Diretor sugerido como último fallback.';
      }

      return {
        employeeId: employee.id,
        name: employee.name,
        roleType: employee.roleType,
        school: employee.school?.name,
        status,
        canSubstitute,
        priority,
        reason,
      };
    });

    return result.sort((a, b) => a.priority - b.priority);
  }
}
