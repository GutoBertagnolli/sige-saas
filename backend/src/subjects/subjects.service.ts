import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.subject.findMany({
      where: {
        tenantId,
        active: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { tenantId: string; name: string; color?: string }) {
    const name = data.name?.trim();

    if (!name) throw new BadRequestException('Informe o nome da disciplina.');

    const existing = await this.prisma.subject.findFirst({
      where: { tenantId: data.tenantId, name },
    });

    if (existing) {
      if (!existing.active) {
        return this.prisma.subject.update({
          where: { id: existing.id },
          data: { active: true, color: data.color || existing.color },
        });
      }
      throw new BadRequestException('Já existe uma disciplina cadastrada com este nome.');
    }

    return this.prisma.subject.create({
      data: { tenantId: data.tenantId, name, color: data.color || null },
    });
  }

  private async assertTenant(id: string, tenantId: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id, tenantId } });
    if (!subject) throw new NotFoundException('Disciplina nao encontrada.');
    return subject;
  }

  async update(id: string, tenantId: string, data: { name?: string; color?: string | null; active?: boolean }) {
    await this.assertTenant(id, tenantId);
    return this.prisma.subject.update({
      where: { id },
      data: {
        name: data.name?.trim() || undefined,
        color: data.color ?? undefined,
        active: data.active,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.assertTenant(id, tenantId);
    return this.prisma.subject.update({
      where: { id },
      data: { active: false },
    });
  }
}
