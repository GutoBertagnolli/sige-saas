import { Body, Controller, Get, Put } from '@nestjs/common';
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
}
