import { Controller, Get, Headers } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  getSummary(@Headers('authorization') authorization?: string) {
    return this.service.getSummary(authorization);
  }
}
