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

    const employees = await this.prisma.employee.findMany({
      where: {
        schoolId,
        active: true,
      },
      include: {
        school: true,
        weeklySchedules: {
          where: {
            weekday,
            timeSlotId,
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
      const schedule = employee.weeklySchedules[0];

      let status = 'LIVRE';
      let canSubstitute = false;
      let priority = 99;
      let reason = 'Servidor não possui jornada cadastrada neste horário.';

      if (schedule) {
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
