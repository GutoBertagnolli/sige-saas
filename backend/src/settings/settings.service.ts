import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

const DEFAULT_ACCEPTANCE_TIMEOUT_MINUTES = 30;
const ACCEPTANCE_TIMEOUT_KEY = 'substitutionAcceptanceTimeoutMinutes';
const ACCEPTANCE_TIMEOUT_ID = 'setting-substitution-acceptance-timeout';
const DEFAULT_MUNICIPALITY_NAME = 'Prefeitura de Pomerode';
const MUNICIPALITY_NAME_KEY = 'municipalityName';
const MUNICIPALITY_NAME_ID = 'setting-municipality-name';
const ACCESS_PROFILES = {
  SECRETARIA: {
    roleName: 'SECRETARIA',
    description: 'Pode ler e cadastrar mensagens, cadastros operacionais, substituicoes, relatorios e dashboard.',
  },
  DIRETOR: {
    roleName: 'DIRETOR',
    description: 'Pode ler e cadastrar mensagens, cadastros operacionais, substituicoes, relatorios e dashboard.',
  },
  ORIENTADOR: {
    roleName: 'ORIENTADOR',
    description: 'Pode ler e cadastrar mensagens, cadastros operacionais, substituicoes, relatorios e dashboard.',
  },
  SERVIDOR: {
    roleName: 'SERVIDOR',
    description: 'Acesso restrito ao portal do servidor.',
  },
} as const;

type AccessProfile = keyof typeof ACCESS_PROFILES | 'INATIVO';

type SettingRow = {
  value: string;
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSubstitutionAcceptanceTimeoutMinutes() {
    await this.ensureSettingsTable();

    const rows = await this.prisma.$queryRaw<SettingRow[]>`
      SELECT value
      FROM "SystemSetting"
      WHERE key = ${ACCEPTANCE_TIMEOUT_KEY}
      LIMIT 1
    `;

    const value = Number(rows[0]?.value ?? DEFAULT_ACCEPTANCE_TIMEOUT_MINUTES);

    if (!Number.isFinite(value) || value <= 0) {
      return DEFAULT_ACCEPTANCE_TIMEOUT_MINUTES;
    }

    return value;
  }

  async getPublicSettings() {
    return {
      substitutionAcceptanceTimeoutMinutes:
        await this.getSubstitutionAcceptanceTimeoutMinutes(),
      municipalityName: await this.getMunicipalityName(),
    };
  }

  async updatePublicSettings(data: {
    substitutionAcceptanceTimeoutMinutes?: number;
    municipalityName?: string;
  }) {
    const timeout = Number(data.substitutionAcceptanceTimeoutMinutes);
    const municipalityName = String(data.municipalityName || DEFAULT_MUNICIPALITY_NAME).trim();

    if (municipalityName.length < 2 || municipalityName.length > 120) {
      throw new BadRequestException('Informe o nome da prefeitura.');
    }

    if (!Number.isInteger(timeout) || timeout < 1 || timeout > 1440) {
      throw new BadRequestException(
        'O tempo de aceite deve ser um número inteiro entre 1 e 1440 minutos.',
      );
    }

    await this.ensureSettingsTable();

    await this.prisma.$executeRaw`
      INSERT INTO "SystemSetting" (id, key, value, "createdAt", "updatedAt")
      VALUES (
        ${ACCEPTANCE_TIMEOUT_ID},
        ${ACCEPTANCE_TIMEOUT_KEY},
        ${String(timeout)},
        now(),
        now()
      )
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, "updatedAt" = now()
    `;

    await this.prisma.$executeRaw`
      INSERT INTO "SystemSetting" (id, key, value, "createdAt", "updatedAt")
      VALUES (
        ${MUNICIPALITY_NAME_ID},
        ${MUNICIPALITY_NAME_KEY},
        ${municipalityName},
        now(),
        now()
      )
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, "updatedAt" = now()
    `;

    return this.getPublicSettings();
  }

  async getAccessList() {
    const employees = await this.prisma.employee.findMany({
      where: {
        active: true,
      },
      include: {
        school: true,
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

    return employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      roleType: employee.roleType,
      school: employee.school,
      loginEmail: employee.loginEmail ?? employee.user?.email ?? null,
      lastLogin: employee.user?.lastLogin ?? null,
      hasUser: Boolean(employee.userId),
      accessProfile: this.inferAccessProfile(
        employee.user?.role?.name,
        employee.roleType,
        employee.user?.active,
      ),
    }));
  }

  async updateEmployeeAccess(
    employeeId: string,
    data: { accessProfile?: string; active?: boolean },
  ) {
    const accessProfile = this.normalizeAccessProfile(data.accessProfile);
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
      include: {
        user: true,
      },
    });

    if (!employee) {
      throw new BadRequestException('Servidor nao encontrado.');
    }

    if (!employee.userId || !employee.user) {
      throw new BadRequestException(
        'Este servidor ainda nao possui login. Gere o acesso no cadastro de servidores.',
      );
    }

    const isInactiveProfile = accessProfile === 'INATIVO';
    const role = isInactiveProfile
      ? null
      : await this.findOrCreateAccessRole(employee.tenantId, accessProfile);

    await this.prisma.user.update({
      where: {
        id: employee.userId,
      },
      data: {
        ...(role ? { roleId: role.id } : {}),
        active: isInactiveProfile ? false : data.active ?? true,
      },
    });

    return this.getAccessList();
  }

  private async ensureSettingsTable() {
    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SystemSetting" (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
  }

  private async getMunicipalityName() {
    await this.ensureSettingsTable();

    const rows = await this.prisma.$queryRaw<SettingRow[]>`
      SELECT value
      FROM "SystemSetting"
      WHERE key = ${MUNICIPALITY_NAME_KEY}
      LIMIT 1
    `;

    return rows[0]?.value || DEFAULT_MUNICIPALITY_NAME;
  }

  private normalizeAccessProfile(accessProfile?: string) {
    const value = String(accessProfile || 'SERVIDOR').toUpperCase();

    if (![...Object.keys(ACCESS_PROFILES), 'INATIVO'].includes(value)) {
      throw new BadRequestException('Perfil de acesso invalido.');
    }

    return value as AccessProfile;
  }

  private inferAccessProfile(
    roleName?: string | null,
    roleType?: string | null,
    active = true,
  ) {
    if (!active) return 'INATIVO';

    if (roleName && Object.keys(ACCESS_PROFILES).includes(roleName)) {
      return roleName;
    }

    if (roleType === 'SECRETARIA') return 'SECRETARIA';
    if (roleType === 'DIRETOR') return 'DIRETOR';
    if (roleType === 'ORIENTADOR') return 'ORIENTADOR';

    return 'SERVIDOR';
  }

  private async findOrCreateAccessRole(
    tenantId: string,
    accessProfile: keyof typeof ACCESS_PROFILES,
  ) {
    const profile = ACCESS_PROFILES[accessProfile];
    const existing = await this.prisma.role.findFirst({
      where: {
        tenantId,
        name: profile.roleName,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.role.create({
      data: {
        tenantId,
        name: profile.roleName,
        description: profile.description,
      },
    });
  }
}
