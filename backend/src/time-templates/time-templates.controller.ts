import { Body, Controller, Delete, Get, Headers, Param, Post, Put } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { TimeTemplatesService } from './time-templates.service';

@Controller('time-templates')
export class TimeTemplatesController {
  constructor(
    private readonly service: TimeTemplatesService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization?: string) {
    const result = await this.service.create(body);
    await this.audit.record({ authorization, entity: 'Horario', entityId: result?.id, action: 'CREATE', newData: result });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization?: string) {
    const result = await this.service.update(id, body);
    await this.audit.record({ authorization, entity: 'Horario', entityId: id, action: 'UPDATE', oldData: body, newData: result });
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Horario', entityId: id, action: 'DELETE', newData: result });
    return result;
  }
}
