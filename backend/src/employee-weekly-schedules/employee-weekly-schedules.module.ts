import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { EmployeeWeeklySchedulesController } from './employee-weekly-schedules.controller';
import { EmployeeWeeklySchedulesService } from './employee-weekly-schedules.service';

@Module({
  imports: [PrismaModule],
  controllers: [EmployeeWeeklySchedulesController],
  providers: [EmployeeWeeklySchedulesService],
})
export class EmployeeWeeklySchedulesModule {}
