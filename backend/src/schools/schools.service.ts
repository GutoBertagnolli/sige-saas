import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.school.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  findByTenant(tenantId: string) {
    return this.prisma.school.findMany({
      where: {
        tenantId,
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  create(data: {
    tenantId: string;
    name: string;
    type?: string;
    address?: string;
    phone?: string;
    email?: string;
  }) {
    return this.prisma.school.create({
      data,
    });
  }

  update(
    id: string,
    data: {
      name?: string;
      type?: string;
      address?: string;
      phone?: string;
      email?: string;
      active?: boolean;
    },
  ) {
    return this.prisma.school.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.school.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }
}
