import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AnnouncementsService } from './announcements.service';

@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private readonly service: AnnouncementsService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('active')
  findActive(
    @Query('roleType') roleType?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.service.findActive({ roleType, schoolId });
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization?: string) {
    const result = await this.service.create(body, authorization);
    await this.audit.record({ authorization, entity: 'Aviso', entityId: result?.id, action: 'CREATE', newData: result });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization?: string) {
    const result = await this.service.update(id, body, authorization);
    await this.audit.record({ authorization, entity: 'Aviso', entityId: id, action: 'UPDATE', oldData: body, newData: result });
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Aviso', entityId: id, action: 'DELETE', newData: result });
    return result;
  }
}
