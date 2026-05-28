import { Controller, Get, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @Get()
  find(
    @Query('schoolId') schoolId: string,
    @Query('weekday') weekday: string,
    @Query('timeSlotId') timeSlotId: string,
  ) {
    return this.service.findBySchoolAndSlot({
      schoolId,
      weekday,
      timeSlotId,
    });
  }
}
