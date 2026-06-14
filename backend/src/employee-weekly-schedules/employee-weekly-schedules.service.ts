import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class EmployeeWeeklySchedulesService {
  constructor(private prisma: PrismaService) {}

  findByEmployee(employeeId: string) {
    return this.prisma.employeeWeeklySchedule.findMany({
      where: {
        employeeId,
        active: true,
      },
      include: {
        school: true,
        class: true,
        timeSlot: true,
      },
      orderBy: [
        { weekday: 'asc' },
        { timeSlot: { slotOrder: 'asc' } },
      ],
    });
  }

  create(data: any) {
    return this.prisma.employeeWeeklySchedule.create({
      data,
    });
  }

  async bulkReplace(employeeId: string, items: any[]) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.employeeWeeklySchedule.updateMany({
        where: {
          employeeId,
        },
        data: {
          active: false,
        },
      });

      await transaction.classSchedule.updateMany({
        where: {
          teacherId: employeeId,
        },
        data: {
          teacherId: null,
          isActive: false,
        },
      });

      if (items.length === 0) {
        return [];
      }

      await transaction.employeeWeeklySchedule.createMany({
        data: items.map((item) => ({
          tenantId: item.tenantId,
          employeeId,
          schoolId: item.schoolId,
          classId: item.classId || null,
          timeSlotId: item.timeSlotId,
          weekday: item.weekday,
          type: item.type ?? 'AULA',
          subject: item.subject ?? null,
          functionName: item.functionName ?? null,
          requiresSubstitution: item.requiresSubstitution ?? true,
        })),
      });

      const classScheduleItems = items.filter((item) => item.classId);
      const savedClassSchedules = [];

      for (const item of classScheduleItems) {
        const saved = await transaction.classSchedule.upsert({
          where: {
            classId_weekday_timeSlotId: {
              classId: item.classId,
              weekday: item.weekday,
              timeSlotId: item.timeSlotId,
            },
          },
          create: {
            tenantId: item.tenantId,
            classId: item.classId,
            subjectId: item.subjectId || null,
            weekday: item.weekday,
            timeSlotId: item.timeSlotId,
            teacherId: employeeId,
            room: item.room || null,
            notes: item.notes || null,
            isActive: true,
          },
          update: {
            subjectId: item.subjectId || null,
            teacherId: employeeId,
            room: item.room || null,
            notes: item.notes || null,
            isActive: true,
          },
        });

        savedClassSchedules.push(saved);
      }

      return savedClassSchedules;
    });
  }
  update(id: string, data: any) {
    return this.prisma.employeeWeeklySchedule.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.employeeWeeklySchedule.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }
}
