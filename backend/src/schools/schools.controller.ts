import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, Post, Put, Req } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getClientIp } from '../common/client-ip';
import { getSchoolScope, isFullAccessActor } from '../common/school-scope';
import { SchoolsService } from './schools.service';

@Controller('schools')
export class SchoolsController {
  constructor(
    private readonly service: SchoolsService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  async findAll(@Headers('authorization') authorization?: string) {
    const actor = await this.audit.getActor(authorization);
    return this.service.findAll(getSchoolScope(actor));
  }

  private assertCanManageSchools(actor: any) {
    if (!actor || !isFullAccessActor(actor)) {
      throw new ForbiddenException('Apenas Secretaria e Administradores podem cadastrar ou alterar escolas.');
    }
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    this.assertCanManageSchools(actor);
    const result = await this.service.create(body);
    await this.audit.record({ authorization, entity: 'Escola', entityId: result?.id, action: 'CREATE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    this.assertCanManageSchools(actor);
    const result = await this.service.update(id, body);
    await this.audit.record({ authorization, entity: 'Escola', entityId: id, action: 'UPDATE', oldData: body, newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    this.assertCanManageSchools(actor);
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Escola', entityId: id, action: 'DELETE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }
}
