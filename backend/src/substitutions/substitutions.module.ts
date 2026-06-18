import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { SubstitutionsController } from './substitutions.controller';
import { SubstitutionsService } from './substitutions.service';

@Module({
  imports: [PrismaModule, SettingsModule, WhatsAppModule],
  controllers: [SubstitutionsController],
  providers: [SubstitutionsService],
})
export class SubstitutionsModule {}	
