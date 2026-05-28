import { Body, Controller, Get, Post } from '@nestjs/common';
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
}
