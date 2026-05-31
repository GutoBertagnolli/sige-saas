import { SubstitutionsModule } from './substitutions/substitutions.module';
import { AbsencesModule } from './absences/absences.module';
import { AvailabilityModule } from './availability/availability.module';
import { EmployeeWeeklySchedulesModule } from './employee-weekly-schedules/employee-weekly-schedules.module';
import { EmployeesModule } from './employees/employees.module';
import { ClassesModule } from './classes/classes.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { SchoolsModule } from './schools/schools.module';
import { TimeTemplatesModule } from './time-templates/time-templates.module';
import { SettingsModule } from './settings/settings.module';
import { AnnouncementsModule } from './announcements/announcements.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AvailabilityModule,
    AnnouncementsModule,
    EmployeeWeeklySchedulesModule,
    PrismaModule,
    AbsencesModule,
    ClassesModule,
    AuthModule,
    SubstitutionsModule,
    TenantsModule,
    UsersModule,
    SchoolsModule,
    SettingsModule,
    TimeTemplatesModule,
    EmployeesModule,
  ],
})
export class AppModule {}
