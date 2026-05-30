import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  private async resolveTenantId(tenantId?: string) {
    if (tenantId) {
      const tenant = await this.prisma.tenant.findFirst({
        where: {
          id: tenantId,
          active: true,
        },
      });

      if (tenant) {
        return tenant.id;
      }
    }

    const defaultTenant = await this.prisma.tenant.findFirst({
      where: {
        slug: 'suportiva',
        active: true,
      },
    });

    if (defaultTenant) {
      return defaultTenant.id;
    }

    const firstActiveTenant = await this.prisma.tenant.findFirst({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!firstActiveTenant) {
      throw new BadRequestException('Nenhum tenant ativo encontrado para cadastrar a escola.');
    }

    return firstActiveTenant.id;
  }

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

  async create(data: {
    tenantId?: string;
    name: string;
    type?: string;
    address?: string;
    phone?: string;
    email?: string;
  }) {
    const tenantId = await this.resolveTenantId(data.tenantId);

    return this.prisma.school.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
      },
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
