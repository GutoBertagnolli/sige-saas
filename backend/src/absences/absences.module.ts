import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { AbsencesController } from './absences.controller';
import { AbsencesService } from './absences.service';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [AbsencesController],
  providers: [AbsencesService],
})
export class AbsencesModule {}
