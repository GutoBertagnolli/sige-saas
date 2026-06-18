import { Body, Controller, Get, Headers, Param, Put, Req } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getClientIp } from '../common/client-ip';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly service: SettingsService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  find() {
    return this.service.getPublicSettings();
  }

  @Put()
  async update(
    @Body() body: any,
    @Headers('authorization') authorization: string | undefined,
    @Req() request: any,
  ) {
    const result = await this.service.updatePublicSettings(body);
    await this.audit.record({
      authorization,
      entity: 'Configuracao',
      entityId: 'public-settings',
      action: 'UPDATE',
      oldData: body,
      newData: result,
      ipAddress: getClientIp(request),
    });
    return result;
  }

  @Get('access')
  accessList() {
    return this.service.getAccessList();
  }

  @Put('access/:employeeId')
  async updateAccess(
    @Param('employeeId') employeeId: string,
    @Body() body: any,
    @Headers('authorization') authorization: string | undefined,
    @Req() request: any,
  ) {
    const result = await this.service.updateEmployeeAccess(employeeId, body);
    await this.audit.record({
      authorization,
      entity: 'Acesso',
      entityId: employeeId,
      action: 'UPDATE',
      oldData: body,
      newData: result,
      ipAddress: getClientIp(request),
    });
    return result;
  }
}
