import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, Post, Put, Req } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getClientIp } from '../common/client-ip';
import { AbsencesService } from './absences.service';

@Controller('absences')
export class AbsencesController {
  constructor(
    private readonly service: AbsencesService,
    private readonly audit: AuditLogsService,
  ) {}

  private assertCanManageSchools(actor: any, schoolIds: string[]) {
    if (schoolIds.length === 0) return;

    const roleName = String(actor?.role?.name || '').toUpperCase();
    const roleType = String(actor?.employee?.roleType || '').toUpperCase();

    if (['ADMIN', 'ADMINISTRADOR', 'SECRETARIA'].includes(roleName) || roleType === 'SECRETARIA') {
      return;
    }

    if (!['DIRETOR', 'ORIENTADOR'].includes(roleType)) {
      throw new ForbiddenException('Apenas Direcao, Orientacao, Secretaria e Administradores podem gerenciar afastamentos.');
    }

    const actorSchoolIds = new Set(
      [
        actor?.employee?.schoolId,
        ...(actor?.employee?.assignments?.map((assignment: any) => assignment.schoolId) ?? []),
      ].filter(Boolean),
    );

    if (!schoolIds.some((schoolId) => actorSchoolIds.has(schoolId))) {
      throw new ForbiddenException('Voce so pode gerenciar afastamentos das escolas em que atua.');
    }
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    this.assertCanManageSchools(actor, await this.service.getManagedSchoolIds(body));
    const result = await this.service.create(body);
    await this.audit.record({ authorization, entity: 'Afastamento', entityId: result?.id, action: 'CREATE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    this.assertCanManageSchools(actor, await this.service.getManagedSchoolIds(body, id));
    const result = await this.service.update(id, body);
    await this.audit.record({ authorization, entity: 'Afastamento', entityId: id, action: 'UPDATE', oldData: body, newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Get(':id/replacements')
  getReplacements(@Param('id') id: string) {
  return this.service.getReplacementSuggestions(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    this.assertCanManageSchools(actor, await this.service.getManagedSchoolIds({}, id));
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Afastamento', entityId: id, action: 'DELETE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }
}
