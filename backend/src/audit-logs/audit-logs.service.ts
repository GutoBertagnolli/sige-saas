import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';

const AUDIT_ROLES = new Set(['SECRETARIA', 'ADMIN', 'ADMINISTRADOR']);
const ONLINE_WINDOW_MINUTES = 5;
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'initialPassword',
  'currentPassword',
  'newPassword',
  'photoUrl',
  'documentUrl',
]);

@Injectable()
export class AuditLogsService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async getActor(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;

    try {
      const payload: any = this.jwt.verify(token);
      if (!payload.sid) return null;

      const session = await this.prisma.userSession.findUnique({
        where: {
          tokenId: payload.sid,
        },
      });

      if (!session || session.revokedAt) return null;

      return this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          role: true,
          employee: {
            include: {
              assignments: {
                where: {
                  active: true,
                },
              },
            },
          },
        },
      });
    } catch {
      return null;
    }
  }

  private getSessionPayload(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException('Sessao expirada. Entre novamente.');
    }

    try {
      const payload: any = this.jwt.verify(token);

      if (!payload.sid) {
        throw new UnauthorizedException('Sessao expirada. Entre novamente.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Sessao expirada. Entre novamente.');
    }
  }

  private canViewLogs(user: any) {
    const roleName = String(user?.role?.name || '').toUpperCase();
    const roleType = String(user?.employee?.roleType || '').toUpperCase();

    return AUDIT_ROLES.has(roleName) || AUDIT_ROLES.has(roleType);
  }

  async assertCanView(authorization?: string) {
    const user = await this.getActor(authorization);

    if (!user) {
      throw new UnauthorizedException('Sessao expirada. Entre novamente.');
    }

    if (!this.canViewLogs(user)) {
      throw new ForbiddenException('Acesso permitido apenas para Secretaria e Administradores.');
    }

    return user;
  }

  async record(data: {
    authorization?: string;
    userId?: string | null;
    entity: string;
    entityId?: string | null;
    action: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string | null;
  }) {
    const actor = data.userId ? null : await this.getActor(data.authorization);

    return this.prisma.auditLog.create({
      data: {
        userId: data.userId ?? actor?.id ?? null,
        entity: data.entity,
        entityId: data.entityId ?? null,
        action: data.action,
        oldData: this.sanitize(data.oldData) ?? undefined,
        newData: this.sanitize(data.newData) ?? undefined,
        ipAddress: data.ipAddress ?? null,
      },
    });
  }

  private sanitize(value: any): any {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item));
    if (typeof value !== 'object') return value;

    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SENSITIVE_KEYS.has(key))
        .map(([key, item]) => [key, this.sanitize(item)]),
    );
  }

  async findAll(authorization?: string) {
    await this.assertCanView(authorization);

    const logs = await this.prisma.auditLog.findMany({
      select: {
        id: true,
        entity: true,
        entityId: true,
        action: true,
        ipAddress: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
            employee: {
              select: {
                roleType: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 250,
    });

    return logs.map((log) => ({
      ...log,
      oldData: null,
      newData: null,
    }));
  }

  async findOnlineSessions(authorization?: string) {
    const actor = await this.assertCanView(authorization);
    const payload = this.getSessionPayload(authorization);
    const onlineSince = new Date(Date.now() - ONLINE_WINDOW_MINUTES * 60 * 1000);

    const sessions = await this.prisma.userSession.findMany({
      where: {
        revokedAt: null,
        lastSeenAt: {
          gte: onlineSince,
        },
        user: {
          tenantId: actor.tenantId,
        },
      },
      include: {
        user: {
          include: {
            role: true,
            employee: {
              include: {
                school: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
      take: 200,
    });

    return sessions.map((session) => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      lastSeenAt: session.lastSeenAt,
      createdAt: session.createdAt,
      isCurrentSession: session.tokenId === payload.sid,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        employee: session.user.employee,
      },
    }));
  }

  async revokeSession(id: string, authorization?: string) {
    const actor = await this.assertCanView(authorization);
    const payload = this.getSessionPayload(authorization);

    const session = await this.prisma.userSession.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
      },
    });

    if (!session || session.user.tenantId !== actor.tenantId) {
      throw new ForbiddenException('Sessao nao encontrada.');
    }

    if (session.tokenId === payload.sid) {
      throw new ForbiddenException('Use sair para encerrar a sua propria sessao.');
    }

    await this.prisma.userSession.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await this.record({
      userId: actor.id,
      entity: 'Sessao',
      entityId: session.id,
      action: 'FORCE_LOGOFF',
      newData: {
        name: session.user.name,
        email: session.user.email,
        ipAddress: session.ipAddress,
      },
    });

    return this.findOnlineSessions(authorization);
  }

  async revokeOtherOnlineSessions(authorization?: string) {
    const actor = await this.assertCanView(authorization);
    const payload = this.getSessionPayload(authorization);
    const onlineSince = new Date(Date.now() - ONLINE_WINDOW_MINUTES * 60 * 1000);

    const sessions = await this.prisma.userSession.findMany({
      where: {
        revokedAt: null,
        tokenId: {
          not: payload.sid,
        },
        lastSeenAt: {
          gte: onlineSince,
        },
        user: {
          tenantId: actor.tenantId,
        },
      },
      include: {
        user: true,
      },
    });

    if (sessions.length > 0) {
      await this.prisma.userSession.updateMany({
        where: {
          id: {
            in: sessions.map((session) => session.id),
          },
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await this.record({
        userId: actor.id,
        entity: 'Sessao',
        action: 'FORCE_LOGOFF_ALL',
        newData: {
          totalItems: sessions.length,
        },
      });
    }

    return this.findOnlineSessions(authorization);
  }
}
