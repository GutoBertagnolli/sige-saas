import { Body, Controller, Delete, Get, Headers, Param, Post, Put } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly service: EmployeesService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization?: string) {
    const result = await this.service.create(body);
    await this.audit.record({ authorization, entity: 'Servidor', entityId: result?.id, action: 'CREATE', newData: result });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization?: string) {
    const result = await this.service.update(id, body);
    await this.audit.record({ authorization, entity: 'Servidor', entityId: id, action: 'UPDATE', oldData: body, newData: result });
    return result;
  }

  @Post(':id/access')
  async generateAccess(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const result = await this.service.generateAccess(id);
    await this.audit.record({ authorization, entity: 'Servidor', entityId: id, action: 'GENERATE_ACCESS', newData: result });
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Servidor', entityId: id, action: 'DELETE', newData: result });
    return result;
  }
}
