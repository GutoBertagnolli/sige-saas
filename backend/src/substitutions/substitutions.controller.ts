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

  @Get('substitute/:employeeId')
  findBySubstitute(@Param('employeeId') employeeId: string) {
    return this.service.findBySubstitute(employeeId);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id/accept')
  accept(@Param('id') id: string) {
    return this.service.accept(id);
  }

  @Put(':id/decline')
  decline(@Param('id') id: string) {
    return this.service.decline(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
