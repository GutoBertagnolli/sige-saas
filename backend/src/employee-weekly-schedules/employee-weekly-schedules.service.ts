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
  await this.prisma.employeeWeeklySchedule.updateMany({
    where: {
      employeeId,
    },
    data: {
      active: false,
    },
  });

  if (items.length === 0) {
    return [];
  }

  return this.prisma.employeeWeeklySchedule.createMany({
    data: items,
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

