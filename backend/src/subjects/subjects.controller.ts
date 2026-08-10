import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Req } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Roles } from '../auth/roles.decorator';
import { getClientIp } from '../common/client-ip';
import { SubjectsService } from './subjects.service';

@Controller('subjects')
export class SubjectsController {
  constructor(
    private readonly service: SubjectsService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  findAll(@Req() request: any) {
    return this.service.findAll(request.user.tenantId);
  }

  @Roles('ADMIN', 'ADMINISTRADOR', 'SECRETARIA')
  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const result = await this.service.create({ ...body, tenantId: request.user.tenantId });
    await this.audit.record({ authorization, entity: 'Disciplina', entityId: result?.id, action: 'CREATE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Roles('ADMIN', 'ADMINISTRADOR', 'SECRETARIA')
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const result = await this.service.update(id, request.user.tenantId, body);
    await this.audit.record({ authorization, entity: 'Disciplina', entityId: id, action: 'UPDATE', oldData: body, newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Roles('ADMIN', 'ADMINISTRADOR', 'SECRETARIA')
  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const result = await this.service.remove(id, request.user.tenantId);
    await this.audit.record({ authorization, entity: 'Disciplina', entityId: id, action: 'DELETE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }
}
