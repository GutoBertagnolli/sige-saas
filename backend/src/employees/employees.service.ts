import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.employee.findMany({
      where: { active: true },
      include: {
        school: true,
        assignments: {
          include: {
            function: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  create(data: {
    tenantId: string;
    schoolId?: string;
    name: string;
    cpf?: string;
    birthDate?: Date;
    email?: string;
    phone?: string;
    photoUrl?: string;
  }) {
    return this.prisma.employee.create({
      data,
    });
  }

  update(id: string, data: any) {
    return this.prisma.employee.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.employee.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }
}
