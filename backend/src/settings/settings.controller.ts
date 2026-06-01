import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  find() {
    return this.service.getPublicSettings();
  }

  @Put()
  update(@Body() body: any) {
    return this.service.updatePublicSettings(body);
  }

  @Get('access')
  accessList() {
    return this.service.getAccessList();
  }

  @Put('access/:employeeId')
  updateAccess(@Param('employeeId') employeeId: string, @Body() body: any) {
    return this.service.updateEmployeeAccess(employeeId, body);
  }
}
