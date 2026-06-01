import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

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
  create(@Body() body: any, @Headers('authorization') authorization?: string) {
    return this.service.create(body, authorization);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization?: string) {
    return this.service.update(id, body, authorization);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
