import { Body, Controller, Delete, Get, Headers, Param, Post, Put } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AbsencesService } from './absences.service';

@Controller('absences')
export class AbsencesController {
  constructor(
    private readonly service: AbsencesService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization?: string) {
    const result = await this.service.create(body);
    await this.audit.record({ authorization, entity: 'Afastamento', entityId: result?.id, action: 'CREATE', newData: result });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization?: string) {
    const result = await this.service.update(id, body);
    await this.audit.record({ authorization, entity: 'Afastamento', entityId: id, action: 'UPDATE', oldData: body, newData: result });
    return result;
  }

  @Get(':id/replacements')
  getReplacements(@Param('id') id: string) {
  return this.service.getReplacementSuggestions(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Afastamento', entityId: id, action: 'DELETE', newData: result });
    return result;
  }
}
