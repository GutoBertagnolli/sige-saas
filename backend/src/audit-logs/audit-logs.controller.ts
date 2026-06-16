import { Controller, Get, Headers } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Get()
  findAll(@Headers('authorization') authorization?: string) {
    return this.service.findAll(authorization);
  }
}
