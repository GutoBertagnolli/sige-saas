import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { SubstitutionsService } from './substitutions.service';

@Controller('substitutions')
export class SubstitutionsController {
  constructor(
    private readonly service: SubstitutionsService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id/accept')
  accept(@Param('id') id: string) {
    return this.service.accept(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
