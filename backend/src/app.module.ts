import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AbsencesModule } from './absences/absences.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { ClassesModule } from './classes/classes.module';
import { PrismaModule } from './common/prisma.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmployeeWeeklySchedulesModule } from './employee-weekly-schedules/employee-weekly-schedules.module';
import { EmployeesModule } from './employees/employees.module';
import { SchoolsModule } from './schools/schools.module';
import { SettingsModule } from './settings/settings.module';
import { SubjectsModule } from './subjects/subjects.module';
import { SubstitutionsModule } from './substitutions/substitutions.module';
import { TenantsModule } from './tenants/tenants.module';
import { TimeTemplatesModule } from './time-templates/time-templates.module';
import { UsersModule } from './users/users.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuditLogsModule,
    DashboardModule,
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
    SubjectsModule,
    TimeTemplatesModule,
    EmployeesModule,
    WhatsAppModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
