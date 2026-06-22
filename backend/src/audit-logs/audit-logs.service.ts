import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';

const AUDIT_ROLES = new Set(['SECRETARIA', 'ADMIN', 'ADMINISTRADOR']);
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

    return this.prisma.auditLog.findMany({
      include: {
        user: {
          include: {
            role: true,
            employee: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 500,
    });
  }
}
