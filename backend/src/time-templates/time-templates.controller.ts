import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Req } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getClientIp } from '../common/client-ip';
import { assertCanManageSchools, getSchoolScope } from '../common/school-scope';
import { TimeTemplatesService } from './time-templates.service';

@Controller('time-templates')
export class TimeTemplatesController {
  constructor(
    private readonly service: TimeTemplatesService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  async findAll(@Headers('authorization') authorization?: string) {
    const actor = await this.audit.getActor(authorization);
    return this.service.findAll(getSchoolScope(actor));
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    assertCanManageSchools(actor, [body.schoolId], 'Voce so pode cadastrar horarios das escolas em que atua.');
    const result = await this.service.create(body);
    await this.audit.record({ authorization, entity: 'Horario', entityId: result?.id, action: 'CREATE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    const currentSchoolId = await this.service.getSchoolId(id);
    assertCanManageSchools(actor, [currentSchoolId].filter(Boolean), 'Voce so pode alterar horarios das escolas em que atua.');
    const result = await this.service.update(id, body);
    await this.audit.record({ authorization, entity: 'Horario', entityId: id, action: 'UPDATE', oldData: body, newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    const currentSchoolId = await this.service.getSchoolId(id);
    assertCanManageSchools(actor, [currentSchoolId].filter(Boolean), 'Voce so pode excluir horarios das escolas em que atua.');
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Horario', entityId: id, action: 'DELETE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }
}
