import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { AbsencesService } from './absences.service';

@Controller('absences')
export class AbsencesController {
  constructor(private readonly service: AbsencesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Get(':id/replacements')
  getReplacements(@Param('id') id: string) {
  return this.service.getReplacementSuggestions(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
