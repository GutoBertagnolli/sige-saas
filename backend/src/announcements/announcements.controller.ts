import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, Post, Put, Query, Req } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getClientIp } from '../common/client-ip';
import { PrismaService } from '../common/prisma.service';
import { getActorSchoolIds, isFullAccessActor, isSchoolScopedActor } from '../common/school-scope';
import { AnnouncementsService } from './announcements.service';

@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private readonly service: AnnouncementsService,
    private readonly audit: AuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  private assertCanManage(actor: any, schoolId?: string | null) {
    if (isFullAccessActor(actor)) return;

    if (!isSchoolScopedActor(actor) || !schoolId || !getActorSchoolIds(actor).includes(schoolId)) {
      throw new ForbiddenException('Voce so pode gerenciar avisos das escolas em que atua.');
    }
  }

  private async filterVisible(actor: any, rows: any[]) {
    if (!rows.length) return rows;

    const allowedSchools = new Set(getActorSchoolIds(actor));
    const records = await this.prisma.announcement.findMany({
      where: {
        id: { in: rows.map((item) => item.id) },
        tenantId: actor.tenantId,
      },
      select: { id: true, schoolId: true },
    });

    const allowedIds = new Set(
      records
        .filter((item) => isFullAccessActor(actor) || !item.schoolId || allowedSchools.has(item.schoolId))
        .map((item) => item.id),
    );

    return rows.filter((item) => allowedIds.has(item.id));
  }

  @Get()
  async findAll(@Headers('authorization') authorization?: string) {
    const actor = await this.audit.getActor(authorization);
    return this.filterVisible(actor, await this.service.findAll());
  }

  @Get('active')
  async findActive(
    @Headers('authorization') authorization?: string,
    @Query('roleType') _roleType?: string,
    @Query('schoolId') _schoolId?: string,
  ) {
    const actor = await this.audit.getActor(authorization);
    const roleType = actor?.employee?.roleType;
    const schoolId = actor?.employee?.schoolId;
    return this.filterVisible(actor, await this.service.findActive({ roleType, schoolId }));
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    this.assertCanManage(actor, body.schoolId);
    const result = await this.service.create({ ...body, tenantId: actor.tenantId }, authorization);
    await this.audit.record({ authorization, entity: 'Aviso', entityId: result?.id, action: 'CREATE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    const current = await this.prisma.announcement.findFirst({ where: { id, tenantId: actor.tenantId } });
    if (!current) throw new ForbiddenException('Aviso nao encontrado.');
    this.assertCanManage(actor, body.schoolId ?? current.schoolId);
    const result = await this.service.update(id, { ...body, tenantId: actor.tenantId }, authorization);
    await this.audit.record({ authorization, entity: 'Aviso', entityId: id, action: 'UPDATE', oldData: body, newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    const current = await this.prisma.announcement.findFirst({ where: { id, tenantId: actor.tenantId } });
    if (!current) throw new ForbiddenException('Aviso nao encontrado.');
    this.assertCanManage(actor, current.schoolId);
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Aviso', entityId: id, action: 'DELETE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }
}
