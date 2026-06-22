import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TimeTemplatesService {
  constructor(private prisma: PrismaService) {}

  findAll(schoolIds?: string[]) {
    return this.prisma.schoolTimeTemplate.findMany({
      where: {
        active: true,
        schoolId: schoolIds ? { in: schoolIds } : undefined,
      },
      include: {
        school: true,
        slots: {
          orderBy: { slotOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getSchoolId(id: string) {
    const template = await this.prisma.schoolTimeTemplate.findUnique({
      where: { id },
      select: { schoolId: true },
    });

    return template?.schoolId ?? null;
  }

  create(data: any) {
    return this.prisma.schoolTimeTemplate.create({
      data: {
        tenantId: data.tenantId,
        schoolId: data.schoolId,
        name: data.name,
        shift: data.shift,
        educationStage: data.educationStage,
        slots: {
          create: data.slots || [],
        },
      },
      include: {
        school: true,
        slots: true,
      },
    });
  }

  update(id: string, data: any) {
    return this.prisma.schoolTimeTemplate.update({
      where: { id },
      data: {
        name: data.name,
        shift: data.shift,
        educationStage: data.educationStage,
      },
      include: {
        school: true,
        slots: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.schoolTimeTemplate.update({
      where: { id },
      data: { active: false },
    });
  }
}
