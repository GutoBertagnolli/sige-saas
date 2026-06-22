import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, Post, Put, Req } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getClientIp } from '../common/client-ip';
import { getSchoolScope } from '../common/school-scope';
import { SubstitutionsService } from './substitutions.service';

@Controller('substitutions')
export class SubstitutionsController {
  constructor(
    private readonly service: SubstitutionsService,
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
      throw new ForbiddenException('Apenas Direcao, Orientacao, Secretaria e Administradores podem gerenciar substituicoes.');
    }

    const actorSchoolIds = new Set(
      [
        actor?.employee?.schoolId,
        ...(actor?.employee?.assignments?.map((assignment: any) => assignment.schoolId) ?? []),
      ].filter(Boolean),
    );

    if (!schoolIds.every((schoolId) => actorSchoolIds.has(schoolId))) {
      throw new ForbiddenException('Voce so pode gerenciar substituicoes das escolas em que atua.');
    }
  }

  @Get()
  async findAll(@Headers('authorization') authorization?: string) {
    const actor = await this.audit.getActor(authorization);
    return this.service.findAll(getSchoolScope(actor));
  }

  @Get('substitute/:employeeId')
  findBySubstitute(@Param('employeeId') employeeId: string) {
    return this.service.findBySubstitute(employeeId);
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    this.assertCanManageSchools(actor, await this.service.getManagedSchoolIds(body));
    const result = await this.service.create(body);
    await this.audit.record({ authorization, entity: 'Substituicao', entityId: result?.id, action: 'CREATE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Put(':id/accept')
  async accept(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const result = await this.service.accept(id);
    await this.audit.record({ authorization, entity: 'Substituicao', entityId: id, action: 'ACCEPT', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Put(':id/decline')
  async decline(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const result = await this.service.decline(id);
    await this.audit.record({ authorization, entity: 'Substituicao', entityId: id, action: 'DECLINE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    this.assertCanManageSchools(actor, await this.service.getManagedSchoolIds(body, id));
    const result = await this.service.update(id, body);
    await this.audit.record({ authorization, entity: 'Substituicao', entityId: id, action: 'UPDATE', oldData: body, newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    this.assertCanManageSchools(actor, await this.service.getManagedSchoolIds({}, id));
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Substituicao', entityId: id, action: 'DELETE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }
}
