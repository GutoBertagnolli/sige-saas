import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma.service';

const ROLE_BY_EMPLOYEE_TYPE: Record<string, string> = {
  SECRETARIA: 'SECRETARIA',
  DIRETOR: 'DIRETOR',
  ORIENTADOR: 'ORIENTADOR',
  PROFESSOR: 'SERVIDOR',
  AUXILIAR: 'SERVIDOR',
  SERVICOS_GERAIS: 'SERVIDOR',
};

@Injectable()
export class EmployeesService {
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

    return firstActiveTenant?.id ?? tenantId;
  }

  private normalizeRoleType(roleType?: string) {
    return roleType === 'COORDENADOR' ? 'ORIENTADOR' : roleType ?? 'PROFESSOR';
  }

  private generatePassword() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  }

  private buildLoginEmail(data: { email?: string | null; cpf?: string | null; name: string }) {
    if (data.email?.trim()) {
      return data.email.trim().toLowerCase();
    }

    const cpfDigits = data.cpf?.replace(/\D/g, '');
    if (cpfDigits) {
      return `${cpfDigits}@sige.local`;
    }

    const slug = data.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/(^\.|\.$)/g, '');

    return `${slug || randomUUID()}@sige.local`;
  }

  private async buildUniqueLoginEmail(
    client: Pick<PrismaService, 'user'>,
    tenantId: string,
    data: { email?: string | null; cpf?: string | null; name: string },
    ignoredUserId?: string | null,
  ) {
    const baseEmail = this.buildLoginEmail(data);
    const [localPart, domain = 'sige.local'] = baseEmail.split('@');

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const candidate =
        attempt === 0
          ? baseEmail
          : `${localPart}.${String(attempt + 1).padStart(2, '0')}@${domain}`;
      const existing = await client.user.findFirst({
        where: {
          tenantId,
          email: candidate,
          id: ignoredUserId ? { not: ignoredUserId } : undefined,
        },
      });

      if (!existing) {
        return candidate;
      }
    }

    return `${localPart}.${randomUUID().slice(0, 8)}@${domain}`;
  }

  private async findOrCreateRole(tenantId: string, roleType: string) {
    const roleName = ROLE_BY_EMPLOYEE_TYPE[roleType] ?? 'SERVIDOR';

    const existing = await this.prisma.role.findFirst({
      where: {
        tenantId,
        name: roleName,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.role.create({
      data: {
        tenantId,
        name: roleName,
        description:
          roleName !== 'SERVIDOR'
            ? 'Acesso administrativo ao SIGE'
            : 'Acesso restrito ao portal do servidor',
      },
    });
  }

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
        user: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(data: {
    tenantId?: string;
    schoolId?: string;
    name: string;
    cpf?: string;
    birthDate?: Date;
    email?: string;
    phone?: string;
    photoUrl?: string;
    roleType?: string;
  }) {
    const tenantId = await this.resolveTenantId(data.tenantId);
    const roleType = this.normalizeRoleType(data.roleType);
    const loginEmail = await this.buildUniqueLoginEmail(this.prisma, tenantId!, data);
    const initialPassword = this.generatePassword();
    const role = await this.findOrCreateRole(tenantId!, roleType);
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          tenantId: tenantId!,
          name: data.name,
          email: loginEmail,
          phone: data.phone || null,
          passwordHash,
          roleId: role.id,
        },
        include: {
          role: true,
        },
      });

      return transaction.employee.create({
        data: {
          tenantId: tenantId!,
          schoolId: data.schoolId || null,
          name: data.name,
          cpf: data.cpf || null,
          birthDate: data.birthDate || null,
          email: data.email || null,
          phone: data.phone || null,
          photoUrl: data.photoUrl || null,
          roleType: roleType as any,
          userId: user.id,
          loginEmail,
          initialPassword,
        },
        include: {
          school: true,
          user: {
            include: {
              role: true,
            },
          },
        },
      });
    });
  }

  async update(id: string, data: any) {
    if (data.roleType) {
      data.roleType = this.normalizeRoleType(data.roleType);
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        school: true,
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!employee) {
      throw new Error('Servidor não encontrado.');
    }

    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data,
      include: {
        school: true,
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (employee.userId && data.roleType) {
      const role = await this.findOrCreateRole(employee.tenantId, data.roleType);

      await this.prisma.user.update({
        where: {
          id: employee.userId,
        },
        data: {
          roleId: role.id,
        },
      });

      return this.prisma.employee.findUnique({
        where: { id },
        include: {
          school: true,
          user: {
            include: {
              role: true,
            },
          },
        },
      });
    }

    return updatedEmployee;
  }

  async generateAccess(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        school: true,
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!employee) {
      throw new Error('Servidor não encontrado.');
    }

    const roleType = this.normalizeRoleType(employee.roleType);
    const role = await this.findOrCreateRole(employee.tenantId, roleType);
    const loginEmail = await this.buildUniqueLoginEmail(
      this.prisma,
      employee.tenantId,
      employee,
      employee.userId,
    );
    const initialPassword = this.generatePassword();
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    return this.prisma.$transaction(async (transaction) => {
      if (employee.userId) {
        await transaction.user.update({
          where: { id: employee.userId },
          data: {
            name: employee.name,
            email: loginEmail,
            phone: employee.phone || null,
            passwordHash,
            roleId: role.id,
            active: true,
          },
        });

        return transaction.employee.update({
          where: { id },
          data: {
            roleType: roleType as any,
            loginEmail,
            initialPassword,
          },
          include: {
            school: true,
            user: {
              include: {
                role: true,
              },
            },
          },
        });
      }

      const user = await transaction.user.create({
        data: {
          tenantId: employee.tenantId,
          name: employee.name,
          email: loginEmail,
          phone: employee.phone || null,
          passwordHash,
          roleId: role.id,
        },
      });

      return transaction.employee.update({
        where: { id },
        data: {
          roleType: roleType as any,
          userId: user.id,
          loginEmail,
          initialPassword,
        },
        include: {
          school: true,
          user: {
            include: {
              role: true,
            },
          },
        },
      });
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
