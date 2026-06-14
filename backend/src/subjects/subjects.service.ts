import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SubjectsService {
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
      throw new BadRequestException('Nenhum tenant ativo encontrado para cadastrar a matéria.');
    }

    return firstActiveTenant.id;
  }

  findAll() {
    return this.prisma.subject.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(data: { tenantId?: string; name: string; color?: string }) {
    const name = data.name?.trim();

    if (!name) {
      throw new BadRequestException('Informe o nome da matéria.');
    }

    const tenantId = await this.resolveTenantId(data.tenantId);

    const existing = await this.prisma.subject.findFirst({
      where: {
        tenantId,
        name,
      },
    });

    if (existing) {
      if (!existing.active) {
        return this.prisma.subject.update({
          where: { id: existing.id },
          data: {
            active: true,
            color: data.color || existing.color,
          },
        });
      }

      throw new BadRequestException('Já existe uma matéria cadastrada com este nome.');
    }

    return this.prisma.subject.create({
      data: {
        tenantId,
        name,
        color: data.color || null,
      },
    });
  }

  update(id: string, data: { name?: string; color?: string | null; active?: boolean }) {
    return this.prisma.subject.update({
      where: { id },
      data: {
        name: data.name?.trim() || undefined,
        color: data.color ?? undefined,
        active: data.active,
      },
    });
  }

  remove(id: string) {
    return this.prisma.subject.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }
}
