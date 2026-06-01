import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma.service';

type AnnouncementRow = {
  id: string;
  schoolId: string | null;
  createdBy: string;
  title: string;
  message: string;
  imageUrl: string | null;
  visibilityType: string;
  priority: number;
  targetRoleType: string | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  schoolName: string | null;
};

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

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

  private async columnExists(columnName: string) {
    const rows = await this.prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Announcement'
          AND column_name = ${columnName}
      ) AS "exists"
    `;

    return Boolean(rows[0]?.exists);
  }

  private async getAnnouncementCapabilities() {
    try {
      await this.prisma.$executeRaw`
        ALTER TABLE "Announcement"
        ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 2
      `;
    } catch {
      // The app can still run against the previous announcement schema.
    }

    try {
      await this.prisma.$executeRaw`
        ALTER TABLE "Announcement"
        ADD COLUMN IF NOT EXISTS "targetRoleType" "EmployeeRoleType"
      `;
    } catch {
      // Targeted announcements are skipped until the migration is applied.
    }

    return {
      hasPriority: await this.columnExists('priority'),
      hasTargetRoleType: await this.columnExists('targetRoleType'),
    };
  }

  private mapRows(rows: AnnouncementRow[]) {
    return rows.map((row) => ({
      id: row.id,
      schoolId: row.schoolId,
      createdBy: row.createdBy,
      title: row.title,
      message: row.message,
      imageUrl: row.imageUrl,
      visibilityType: row.visibilityType,
      priority: row.priority ?? 2,
      targetRoleType: row.targetRoleType,
      startDate: row.startDate,
      endDate: row.endDate,
      createdAt: row.createdAt,
      targets: [],
      school: row.schoolId
        ? {
            id: row.schoolId,
            name: row.schoolName,
          }
        : null,
    }));
  }

  private async resolveCreatedBy(authorization?: string, fallback?: string) {
    const fallbackName = fallback?.trim() || 'Direcao';
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return fallbackName;
    }

    try {
      const payload: any = this.jwt.verify(token);
      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
        select: {
          name: true,
          active: true,
        },
      });

      return user?.active && user.name ? user.name : fallbackName;
    } catch {
      return fallbackName;
    }
  }

  private async findById(id: string) {
    const { hasPriority, hasTargetRoleType } =
      await this.getAnnouncementCapabilities();

    const rows =
      hasPriority && hasTargetRoleType
        ? await this.prisma.$queryRaw<AnnouncementRow[]>`
            SELECT
              a.id,
              a."schoolId",
              a."createdBy",
              a.title,
              a.message,
              a."imageUrl",
              a."visibilityType",
              a.priority,
              a."targetRoleType"::text AS "targetRoleType",
              a."startDate",
              a."endDate",
              a."createdAt",
              s.name AS "schoolName"
            FROM "Announcement" a
            LEFT JOIN "School" s ON s.id = a."schoolId"
            WHERE a.id = ${id}
            LIMIT 1
          `
        : await this.prisma.$queryRaw<AnnouncementRow[]>`
            SELECT
              a.id,
              a."schoolId",
              a."createdBy",
              a.title,
              a.message,
              a."imageUrl",
              a."visibilityType",
              2 AS priority,
              NULL::text AS "targetRoleType",
              a."startDate",
              a."endDate",
              a."createdAt",
              s.name AS "schoolName"
            FROM "Announcement" a
            LEFT JOIN "School" s ON s.id = a."schoolId"
            WHERE a.id = ${id}
            LIMIT 1
          `;

    return this.mapRows(rows)[0] ?? null;
  }

  async findAll() {
    const { hasPriority, hasTargetRoleType } =
      await this.getAnnouncementCapabilities();

    const rows =
      hasPriority && hasTargetRoleType
        ? await this.prisma.$queryRaw<AnnouncementRow[]>`
            SELECT
              a.id,
              a."schoolId",
              a."createdBy",
              a.title,
              a.message,
              a."imageUrl",
              a."visibilityType",
              a.priority,
              a."targetRoleType"::text AS "targetRoleType",
              a."startDate",
              a."endDate",
              a."createdAt",
              s.name AS "schoolName"
            FROM "Announcement" a
            LEFT JOIN "School" s ON s.id = a."schoolId"
            ORDER BY a.priority ASC, a."createdAt" DESC
          `
        : await this.prisma.$queryRaw<AnnouncementRow[]>`
            SELECT
              a.id,
              a."schoolId",
              a."createdBy",
              a.title,
              a.message,
              a."imageUrl",
              a."visibilityType",
              2 AS priority,
              NULL::text AS "targetRoleType",
              a."startDate",
              a."endDate",
              a."createdAt",
              s.name AS "schoolName"
            FROM "Announcement" a
            LEFT JOIN "School" s ON s.id = a."schoolId"
            ORDER BY a."createdAt" DESC
          `;

    return this.mapRows(rows);
  }

  async findActive(filters?: { roleType?: string; schoolId?: string }) {
    const { hasPriority, hasTargetRoleType } =
      await this.getAnnouncementCapabilities();
    const roleType = filters?.roleType
      ? filters.roleType === 'COORDENADOR'
        ? 'ORIENTADOR'
        : filters.roleType
      : null;

    if (hasPriority && hasTargetRoleType) {
      const rows = await this.prisma.$queryRaw<AnnouncementRow[]>`
        SELECT
          a.id,
          a."schoolId",
          a."createdBy",
          a.title,
          a.message,
          a."imageUrl",
          a."visibilityType",
          a.priority,
          a."targetRoleType"::text AS "targetRoleType",
          a."startDate",
          a."endDate",
          a."createdAt",
          s.name AS "schoolName"
        FROM "Announcement" a
        LEFT JOIN "School" s ON s.id = a."schoolId"
        WHERE (a."startDate" IS NULL OR a."startDate" <= now())
          AND (a."endDate" IS NULL OR a."endDate" >= now())
          AND (${filters?.schoolId ?? null}::text IS NULL OR a."schoolId" IS NULL OR a."schoolId" = ${filters?.schoolId ?? null})
          AND (${roleType ?? null}::text IS NULL OR a."targetRoleType" IS NULL OR a."targetRoleType"::text = ${roleType ?? null})
        ORDER BY a.priority ASC, a."createdAt" DESC
      `;

      return this.mapRows(rows);
    }

    const rows = await this.prisma.$queryRaw<AnnouncementRow[]>`
      SELECT
        a.id,
        a."schoolId",
        a."createdBy",
        a.title,
        a.message,
        a."imageUrl",
        a."visibilityType",
        2 AS priority,
        NULL::text AS "targetRoleType",
        a."startDate",
        a."endDate",
        a."createdAt",
        s.name AS "schoolName"
      FROM "Announcement" a
      LEFT JOIN "School" s ON s.id = a."schoolId"
      WHERE (a."startDate" IS NULL OR a."startDate" <= now())
        AND (a."endDate" IS NULL OR a."endDate" >= now())
        AND (${filters?.schoolId ?? null}::text IS NULL OR a."schoolId" IS NULL OR a."schoolId" = ${filters?.schoolId ?? null})
      ORDER BY a."createdAt" DESC
    `;

    return this.mapRows(rows);
  }

  async create(data: any, authorization?: string) {
    if (!data.title?.trim()) {
      throw new BadRequestException('Titulo e obrigatorio.');
    }

    if (!data.message?.trim()) {
      throw new BadRequestException('Mensagem e obrigatoria.');
    }

    const { hasPriority, hasTargetRoleType } =
      await this.getAnnouncementCapabilities();
    const tenantId = await this.resolveTenantId(data.tenantId);
    const id = randomUUID();
    const priority = Number(data.priority || 2);
    const startDate = data.startDate ? new Date(data.startDate) : null;
    const endDate = data.endDate ? new Date(data.endDate) : null;
    const createdBy = await this.resolveCreatedBy(authorization, data.createdBy);
    const targetRoleType =
      hasTargetRoleType && data.targetRoleType
        ? data.targetRoleType === 'COORDENADOR'
          ? 'ORIENTADOR'
          : String(data.targetRoleType)
        : null;

    if (hasPriority && hasTargetRoleType && targetRoleType) {
      await this.prisma.$executeRaw`
        INSERT INTO "Announcement" (
          id, "tenantId", "schoolId", "createdBy", title, message, "imageUrl",
          "visibilityType", priority, "targetRoleType", "startDate", "endDate",
          "createdAt"
        )
        VALUES (
          ${id}, ${tenantId}, ${data.schoolId || null}, ${createdBy},
          ${data.title}, ${data.message}, ${data.imageUrl || null},
          ${data.visibilityType || 'ALL'}, ${Number.isFinite(priority) ? priority : 2},
          ${targetRoleType}::"EmployeeRoleType", ${startDate}, ${endDate}, now()
        )
      `;
    } else if (hasPriority && hasTargetRoleType) {
      await this.prisma.$executeRaw`
        INSERT INTO "Announcement" (
          id, "tenantId", "schoolId", "createdBy", title, message, "imageUrl",
          "visibilityType", priority, "targetRoleType", "startDate", "endDate",
          "createdAt"
        )
        VALUES (
          ${id}, ${tenantId}, ${data.schoolId || null}, ${createdBy},
          ${data.title}, ${data.message}, ${data.imageUrl || null},
          ${data.visibilityType || 'ALL'}, ${Number.isFinite(priority) ? priority : 2},
          NULL, ${startDate}, ${endDate}, now()
        )
      `;
    } else {
      await this.prisma.$executeRaw`
        INSERT INTO "Announcement" (
          id, "tenantId", "schoolId", "createdBy", title, message, "imageUrl",
          "visibilityType", "startDate", "endDate", "createdAt"
        )
        VALUES (
          ${id}, ${tenantId}, ${data.schoolId || null}, ${createdBy},
          ${data.title}, ${data.message}, ${data.imageUrl || null},
          ${data.visibilityType || 'ALL'}, ${startDate}, ${endDate}, now()
        )
      `;
    }

    return this.findById(id);
  }

  async update(id: string, data: any, authorization?: string) {
    if (!data.title?.trim()) {
      throw new BadRequestException('Titulo e obrigatorio.');
    }

    if (!data.message?.trim()) {
      throw new BadRequestException('Mensagem e obrigatoria.');
    }

    const existing = await this.findById(id);

    if (!existing) {
      throw new NotFoundException('Aviso nao encontrado.');
    }

    const { hasPriority, hasTargetRoleType } =
      await this.getAnnouncementCapabilities();
    const priority = Number(data.priority || 2);
    const startDate = data.startDate ? new Date(data.startDate) : null;
    const endDate = data.endDate ? new Date(data.endDate) : null;
    const createdBy = await this.resolveCreatedBy(authorization, data.createdBy);
    const targetRoleType =
      hasTargetRoleType && data.targetRoleType
        ? data.targetRoleType === 'COORDENADOR'
          ? 'ORIENTADOR'
          : String(data.targetRoleType)
        : null;

    if (hasPriority && hasTargetRoleType && targetRoleType) {
      await this.prisma.$executeRaw`
        UPDATE "Announcement"
        SET
          "schoolId" = ${data.schoolId || null},
          "createdBy" = ${createdBy},
          title = ${data.title},
          message = ${data.message},
          "imageUrl" = ${data.imageUrl || null},
          "visibilityType" = ${data.visibilityType || 'ALL'},
          priority = ${Number.isFinite(priority) ? priority : 2},
          "targetRoleType" = ${targetRoleType}::"EmployeeRoleType",
          "startDate" = ${startDate},
          "endDate" = ${endDate}
        WHERE id = ${id}
      `;
    } else if (hasPriority && hasTargetRoleType) {
      await this.prisma.$executeRaw`
        UPDATE "Announcement"
        SET
          "schoolId" = ${data.schoolId || null},
          "createdBy" = ${createdBy},
          title = ${data.title},
          message = ${data.message},
          "imageUrl" = ${data.imageUrl || null},
          "visibilityType" = ${data.visibilityType || 'ALL'},
          priority = ${Number.isFinite(priority) ? priority : 2},
          "targetRoleType" = NULL,
          "startDate" = ${startDate},
          "endDate" = ${endDate}
        WHERE id = ${id}
      `;
    } else {
      await this.prisma.$executeRaw`
        UPDATE "Announcement"
        SET
          "schoolId" = ${data.schoolId || null},
          "createdBy" = ${createdBy},
          title = ${data.title},
          message = ${data.message},
          "imageUrl" = ${data.imageUrl || null},
          "visibilityType" = ${data.visibilityType || 'ALL'},
          "startDate" = ${startDate},
          "endDate" = ${endDate}
        WHERE id = ${id}
      `;
    }

    return this.findById(id);
  }

  async remove(id: string) {
    const deleted = await this.prisma.$executeRaw`
      DELETE FROM "Announcement"
      WHERE id = ${id}
    `;

    if (!deleted) {
      throw new NotFoundException('Aviso nao encontrado.');
    }

    return { id };
  }
}
