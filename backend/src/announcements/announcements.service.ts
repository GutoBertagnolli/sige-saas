import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AnnouncementsService {
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
      throw new BadRequestException('Nenhum tenant ativo encontrado.');
    }

    return firstActiveTenant.id;
  }

  private async ensureAnnouncementColumns() {
    await this.prisma.$executeRaw`
      ALTER TABLE "Announcement"
      ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 2
    `;

    await this.prisma.$executeRaw`
      ALTER TABLE "Announcement"
      ADD COLUMN IF NOT EXISTS "targetRoleType" "EmployeeRoleType"
    `;
  }

  async findAll() {
    await this.ensureAnnouncementColumns();

    return this.prisma.announcement.findMany({
      include: {
        school: true,
        targets: true,
      },
      orderBy: {
        priority: 'asc',
      },
    });
  }

  async findActive(filters?: { roleType?: string; schoolId?: string }) {
    await this.ensureAnnouncementColumns();

    const now = new Date();
    const roleType = filters?.roleType
      ? filters.roleType === 'COORDENADOR'
        ? 'ORIENTADOR'
        : filters.roleType
      : null;
    const audienceFilters: any[] = [
      {
        targetRoleType: null,
      },
    ];
    const schoolFilters: any[] = [
      {
        schoolId: null,
      },
    ];

    if (roleType) {
      audienceFilters.push({
        targetRoleType: roleType,
      });
    }

    if (filters?.schoolId) {
      schoolFilters.push({
        schoolId: filters.schoolId,
      });
    }

    return this.prisma.announcement.findMany({
      where: {
        OR: [
          {
            startDate: null,
          },
          {
            startDate: {
              lte: now,
            },
          },
        ],
        AND: [
          {
            OR: [
              {
                endDate: null,
              },
              {
                endDate: {
                  gte: now,
                },
              },
            ],
          },
          {
            OR: audienceFilters,
          },
          {
            OR: schoolFilters,
          },
        ],
      },
      include: {
        school: true,
        targets: true,
      },
      orderBy: {
        priority: 'asc',
      },
    });
  }

  async create(data: any) {
    await this.ensureAnnouncementColumns();

    if (!data.title?.trim()) {
      throw new BadRequestException('Título é obrigatório.');
    }

    if (!data.message?.trim()) {
      throw new BadRequestException('Mensagem é obrigatória.');
    }

    const tenantId = await this.resolveTenantId(data.tenantId);

    return this.prisma.announcement.create({
      data: {
        tenantId,
        schoolId: data.schoolId || null,
        createdBy: data.createdBy || 'Direção',
        title: data.title,
        message: data.message,
        imageUrl: data.imageUrl || null,
        visibilityType: data.visibilityType || 'ALL',
        priority: Number(data.priority || 2),
        targetRoleType: data.targetRoleType
          ? data.targetRoleType === 'COORDENADOR'
            ? 'ORIENTADOR'
            : data.targetRoleType
          : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: {
        school: true,
        targets: true,
      },
    });
  }

  async remove(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Aviso não encontrado.');
    }

    return this.prisma.announcement.delete({
      where: { id },
    });
  }
}
