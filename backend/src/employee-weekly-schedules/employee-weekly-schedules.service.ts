import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class EmployeeWeeklySchedulesService {
  constructor(private prisma: PrismaService) {}

  findByEmployee(employeeId: string, schoolIds?: string[]) {
    return this.prisma.employeeWeeklySchedule.findMany({
      where: {
        employeeId,
        active: true,
        schoolId: schoolIds ? { in: schoolIds } : undefined,
      },
      include: {
        school: true,
        class: {
          include: {
            school: true,
          },
        },
        timeSlot: true,
      },
      orderBy: [
        { weekday: 'asc' },
        { timeSlot: { slotOrder: 'asc' } },
      ],
    });
  }

  async getSchoolId(id: string) {
    const schedule = await this.prisma.employeeWeeklySchedule.findUnique({
      where: { id },
      select: { schoolId: true },
    });

    return schedule?.schoolId ?? null;
  }

  create(data: any) {
    return this.prisma.employeeWeeklySchedule.create({
      data,
    });
  }

  async bulkReplace(employeeId: string, items: any[], schoolIds?: string[]) {
    const classIds = Array.from(new Set(items.map((item) => item.classId).filter(Boolean))) as string[];
    const classes = classIds.length
      ? await this.prisma.class.findMany({
          where: {
            id: {
              in: classIds,
            },
          },
          select: {
            id: true,
            schoolId: true,
          },
        })
      : [];
    const classSchoolById = new Map(classes.map((classItem) => [classItem.id, classItem.schoolId]));

    for (const item of items) {
      if (!item.classId) continue;

      const classSchoolId = classSchoolById.get(item.classId);
      if (!classSchoolId || classSchoolId !== item.schoolId) {
        throw new BadRequestException('A turma selecionada nao pertence a escola informada no horario.');
      }
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.employeeWeeklySchedule.updateMany({
        where: {
          employeeId,
          schoolId: schoolIds ? { in: schoolIds } : undefined,
        },
        data: {
          active: false,
        },
      });

      await transaction.classSchedule.updateMany({
        where: {
          teacherId: employeeId,
          class: schoolIds
            ? {
                schoolId: {
                  in: schoolIds,
                },
              }
            : undefined,
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
