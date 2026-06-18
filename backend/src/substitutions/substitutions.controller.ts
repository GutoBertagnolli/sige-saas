import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Req } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getClientIp } from '../common/client-ip';
import { SubstitutionsService } from './substitutions.service';

@Controller('substitutions')
export class SubstitutionsController {
  constructor(
    private readonly service: SubstitutionsService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('substitute/:employeeId')
  findBySubstitute(@Param('employeeId') employeeId: string) {
    return this.service.findBySubstitute(employeeId);
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
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
    const result = await this.service.update(id, body);
    await this.audit.record({ authorization, entity: 'Substituicao', entityId: id, action: 'UPDATE', oldData: body, newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Substituicao', entityId: id, action: 'DELETE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }
}
