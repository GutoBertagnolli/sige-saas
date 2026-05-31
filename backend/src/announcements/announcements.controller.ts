import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
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
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
