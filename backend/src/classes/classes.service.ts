import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.class.findMany({
      where: { active: true },
      include: {
        school: true,
        template: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  create(data: {
    tenantId: string;
    schoolId: string;
    academicYear: number;
    name: string;
    shift: any;
    educationStage: any;
    templateId: string;
  }) {
    return this.prisma.class.create({
      data,
    });
  }

  update(id: string, data: any) {
    return this.prisma.class.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.class.update({
      where: { id },
      data: { active: false },
    });
  }
}
