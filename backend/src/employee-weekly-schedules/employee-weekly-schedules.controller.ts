import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Req } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getClientIp } from '../common/client-ip';
import { EmployeeWeeklySchedulesService } from './employee-weekly-schedules.service';

@Controller('employee-weekly-schedules')
export class EmployeeWeeklySchedulesController {
  constructor(
    private readonly service: EmployeeWeeklySchedulesService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.service.findByEmployee(employeeId);
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const result = await this.service.create(body);
    await this.audit.record({ authorization, entity: 'Planner', entityId: result?.id, action: 'CREATE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const result = await this.service.update(id, body);
    await this.audit.record({ authorization, entity: 'Planner', entityId: id, action: 'UPDATE', oldData: body, newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Post('bulk')
  async bulk(@Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const result = await this.service.bulkReplace(body.employeeId, body.items || []);
    await this.audit.record({
      authorization,
      entity: 'Planner',
      entityId: body.employeeId,
      action: 'BULK_REPLACE',
      newData: { employeeId: body.employeeId, totalItems: body.items?.length ?? 0 },
      ipAddress: getClientIp(request),
    });
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Planner', entityId: id, action: 'DELETE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }
}
