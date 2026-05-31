import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

const DEFAULT_ACCEPTANCE_TIMEOUT_MINUTES = 30;
const ACCEPTANCE_TIMEOUT_KEY = 'substitutionAcceptanceTimeoutMinutes';
const ACCEPTANCE_TIMEOUT_ID = 'setting-substitution-acceptance-timeout';

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
    };
  }

  async updatePublicSettings(data: {
    substitutionAcceptanceTimeoutMinutes?: number;
  }) {
    const timeout = Number(data.substitutionAcceptanceTimeoutMinutes);

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

    return this.getPublicSettings();
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
}
