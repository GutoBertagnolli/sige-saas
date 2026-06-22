import { BadRequestException, Injectable } from '@nestjs/common';
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

  private async findOrCreateTeacherFunction(
    tenantId: string,
    client: Pick<PrismaService, 'employeeFunction'> = this.prisma,
  ) {
    const existing = await client.employeeFunction.findFirst({
      where: {
        tenantId,
        name: 'Professor',
      },
    });

    if (existing) {
      return existing;
    }

    return client.employeeFunction.create({
      data: {
        tenantId,
        name: 'Professor',
        requiresSubject: true,
      },
    });
  }

  private formatRoleFunctionName(roleType: string) {
    const roleLabels: Record<string, string> = {
      PROFESSOR: 'Professor',
      AUXILIAR: 'Auxiliar',
      ORIENTADOR: 'Orientador',
      DIRETOR: 'Diretor',
      SECRETARIA: 'Secretaria',
      SERVICOS_GERAIS: 'Serviços Gerais',
    };

    return roleLabels[roleType] ?? roleType.replace(/_/g, ' ');
  }

  private async findOrCreateEmployeeFunction(
    tenantId: string,
    roleType: string,
    client: Pick<PrismaService, 'employeeFunction'> = this.prisma,
  ) {
    const name = this.formatRoleFunctionName(roleType);
    const existing = await client.employeeFunction.findFirst({
      where: {
        tenantId,
        name,
      },
    });

    if (existing) {
      return existing;
    }

    return client.employeeFunction.create({
      data: {
        tenantId,
        name,
        requiresSubject: roleType === 'PROFESSOR',
      },
    });
  }

  private normalizeSchoolIds(primarySchoolId?: string | null, schoolIds?: string[] | null) {
    const ids = [primarySchoolId, ...(schoolIds ?? [])]
      .map((item) => item?.trim())
      .filter(Boolean) as string[];
    const uniqueIds = Array.from(new Set(ids));

    if (uniqueIds.length > 5) {
      throw new BadRequestException('O servidor pode ser vinculado a no máximo 5 escolas.');
    }

    return uniqueIds;
  }

  private async findOrCreateSubject(
    tenantId: string,
    subjectName?: string | null,
    client: Pick<PrismaService, 'subject'> = this.prisma,
  ) {
    const name = subjectName?.trim();

    if (!name) {
      return null;
    }

    const existing = await client.subject.findFirst({
      where: {
        tenantId,
        name,
      },
    });

    if (existing) {
      return existing;
    }

    return client.subject.create({
      data: {
        tenantId,
        name,
      },
    });
  }

  private async findSubjectById(
    tenantId: string,
    subjectId?: string | null,
    client: Pick<PrismaService, 'subject'> = this.prisma,
  ) {
    if (!subjectId) {
      return null;
    }

    return client.subject.findFirst({
      where: {
        id: subjectId,
        tenantId,
        active: true,
      },
    });
  }

  private async replaceEmployeeAssignments(
    employeeId: string,
    tenantId: string,
    schoolIds: string[],
    roleType: string,
    subjectName?: string | null,
    subjectId?: string | null,
    client: Pick<
      PrismaService,
      'employeeAssignment' | 'employeeFunction' | 'subject'
    > = this.prisma,
  ) {
    await client.employeeAssignment.updateMany({
      where: {
        employeeId,
        active: true,
      },
      data: {
        active: false,
      },
    });

    const subject =
      roleType === 'PROFESSOR'
        ? (await this.findSubjectById(tenantId, subjectId, client)) ||
          (await this.findOrCreateSubject(tenantId, subjectName, client))
        : null;

    if (schoolIds.length === 0) {
      return null;
    }

    const employeeFunction =
      roleType === 'PROFESSOR'
        ? await this.findOrCreateTeacherFunction(tenantId, client)
        : await this.findOrCreateEmployeeFunction(tenantId, roleType, client);

    return Promise.all(
      schoolIds.map((schoolId) =>
        client.employeeAssignment.create({
          data: {
            employeeId,
            schoolId,
            functionId: employeeFunction.id,
            subjectId: subject?.id ?? null,
            active: true,
          },
        }),
      ),
    );
  }

  async findAll(schoolIds?: string[]) {
    const scopedSchoolIds = schoolIds ? new Set(schoolIds) : null;
    const employees = await this.prisma.employee.findMany({
      where: {
        active: true,
        OR: schoolIds
          ? [
              { schoolId: { in: schoolIds } },
              {
                assignments: {
                  some: {
                    schoolId: { in: schoolIds },
                    active: true,
                  },
                },
              },
            ]
          : undefined,
      },
      include: {
        school: true,
        assignments: {
          where: {
            active: true,
          },
          include: {
            function: true,
            subject: true,
            school: true,
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

    if (!scopedSchoolIds) {
      return employees;
    }

    return employees.map((employee) => ({
      ...employee,
      school: employee.school?.id && scopedSchoolIds.has(employee.school.id) ? employee.school : null,
      assignments: employee.assignments.filter((assignment) =>
        scopedSchoolIds.has(assignment.schoolId),
      ),
    }));
  }

  async getAssignedSchoolIds(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        assignments: {
          where: {
            active: true,
          },
        },
      },
    });

    if (!employee) {
      return [];
    }

    return Array.from(
      new Set(
        [
          employee.schoolId,
          ...employee.assignments.map((assignment) => assignment.schoolId),
        ].filter(Boolean) as string[],
      ),
    );
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
    subjectName?: string;
    subjectId?: string;
    schoolIds?: string[];
  }) {
    const tenantId = await this.resolveTenantId(data.tenantId);
    const roleType = this.normalizeRoleType(data.roleType);
    const schoolIds = this.normalizeSchoolIds(data.schoolId, data.schoolIds);
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

      const createdEmployee = await transaction.employee.create({
        data: {
          tenantId: tenantId!,
          schoolId: schoolIds[0] || null,
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
          assignments: {
            where: {
              active: true,
            },
            include: {
              function: true,
              subject: true,
              school: true,
            },
          },
          user: {
            include: {
              role: true,
            },
          },
        },
      });

      await this.replaceEmployeeAssignments(
        createdEmployee.id,
        tenantId!,
        schoolIds,
        roleType,
        data.subjectName,
        data.subjectId,
        transaction,
      );

      return transaction.employee.findUnique({
        where: {
          id: createdEmployee.id,
        },
        include: {
          school: true,
          assignments: {
            where: {
              active: true,
            },
            include: {
              function: true,
              subject: true,
              school: true,
            },
          },
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
    const { subjectName, subjectId, schoolIds: rawSchoolIds, ...employeeData } = data;

    if (employeeData.roleType) {
      employeeData.roleType = this.normalizeRoleType(employeeData.roleType);
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        school: true,
        assignments: {
          where: {
            active: true,
          },
          include: {
            subject: true,
            school: true,
          },
        },
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

    const currentSchoolIds = employee.assignments.map((assignment) => assignment.schoolId);
    const nextSchoolIds =
      rawSchoolIds !== undefined
        ? this.normalizeSchoolIds(employeeData.schoolId ?? employee.schoolId, rawSchoolIds)
        : employeeData.schoolId !== undefined
          ? this.normalizeSchoolIds(employeeData.schoolId, currentSchoolIds)
          : currentSchoolIds.length
            ? currentSchoolIds
            : this.normalizeSchoolIds(employee.schoolId, []);

    if (employeeData.schoolId === undefined && nextSchoolIds.length > 0) {
      employeeData.schoolId = nextSchoolIds[0];
    }

    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data: employeeData,
      include: {
        school: true,
        assignments: {
          where: {
            active: true,
          },
          include: {
            function: true,
            subject: true,
            school: true,
          },
        },
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (
      subjectName !== undefined ||
      subjectId !== undefined ||
      employeeData.schoolId !== undefined ||
      rawSchoolIds !== undefined ||
      employeeData.roleType !== undefined
    ) {
      const nextSubjectName =
        subjectName !== undefined
          ? subjectName
          : employee.assignments[0]?.subject?.name ?? null;
      const nextSubjectId =
        subjectId !== undefined
          ? subjectId
          : employee.assignments[0]?.subject?.id ?? null;

      await this.replaceEmployeeAssignments(
        id,
        employee.tenantId,
        nextSchoolIds,
        employeeData.roleType ?? employee.roleType,
        nextSubjectName,
        nextSubjectId,
      );
    }

    if (employee.userId && employeeData.roleType) {
      const role = await this.findOrCreateRole(employee.tenantId, employeeData.roleType);

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
          assignments: {
            where: {
              active: true,
            },
            include: {
              function: true,
              subject: true,
              school: true,
            },
          },
          user: {
            include: {
              role: true,
            },
          },
        },
      });
    }

    return this.prisma.employee.findUnique({
      where: { id },
      include: {
        school: true,
        assignments: {
          where: {
            active: true,
          },
          include: {
            function: true,
            subject: true,
            school: true,
          },
        },
        user: {
          include: {
            role: true,
          },
        },
      },
    });
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
