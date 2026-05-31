import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma.service';

const ADMIN_ROLE_TYPES = new Set(['SECRETARIA', 'DIRETOR', 'ORIENTADOR']);

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

  private buildLoginEmail(data: { email?: string; cpf?: string; name: string }) {
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

  private async findOrCreateRole(tenantId: string, roleType: string) {
    const roleName = ADMIN_ROLE_TYPES.has(roleType)
      ? 'ADMINISTRATIVO'
      : 'SERVIDOR';

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
          roleName === 'ADMINISTRATIVO'
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
    const loginEmail = this.buildLoginEmail(data);
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

  update(id: string, data: any) {
    if (data.roleType) {
      data.roleType = this.normalizeRoleType(data.roleType);
    }

    return this.prisma.employee.update({
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
