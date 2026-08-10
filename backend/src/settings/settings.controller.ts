import { Body, Controller, Get, Headers, Param, Put, Req } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Roles } from '../auth/roles.decorator';
import { getClientIp } from '../common/client-ip';
import { SettingsService } from './settings.service';

const SETTINGS_ADMIN_ROLES = ['ADMIN', 'ADMINISTRADOR', 'SECRETARIA'];

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

  @Roles(...SETTINGS_ADMIN_ROLES)
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

  @Roles(...SETTINGS_ADMIN_ROLES)
  @Get('access')
  accessList() {
    return this.service.getAccessList();
  }

  @Roles(...SETTINGS_ADMIN_ROLES)
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
