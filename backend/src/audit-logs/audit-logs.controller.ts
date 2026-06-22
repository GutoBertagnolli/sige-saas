import { Controller, Get, Headers, Param, Put } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Get()
  findAll(@Headers('authorization') authorization?: string) {
    return this.service.findAll(authorization);
  }

  @Get('sessions')
  findOnlineSessions(@Headers('authorization') authorization?: string) {
    return this.service.findOnlineSessions(authorization);
  }

  @Put('sessions/logout-all')
  revokeOtherOnlineSessions(@Headers('authorization') authorization?: string) {
    return this.service.revokeOtherOnlineSessions(authorization);
  }

  @Put('sessions/:id/logout')
  revokeSession(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.service.revokeSession(id, authorization);
  }
}
