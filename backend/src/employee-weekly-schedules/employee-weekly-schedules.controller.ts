import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { EmployeeWeeklySchedulesService } from './employee-weekly-schedules.service';

@Controller('employee-weekly-schedules')
export class EmployeeWeeklySchedulesController {
  constructor(private readonly service: EmployeeWeeklySchedulesService) {}

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.service.findByEmployee(employeeId);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Post('bulk')
   bulk(@Body() body: any) {
   return this.service.bulkReplace(body.employeeId, body.items || []);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

