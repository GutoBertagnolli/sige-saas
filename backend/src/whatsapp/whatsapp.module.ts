import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppNotificationsService } from './whatsapp-notifications.service';

@Module({
  controllers: [WhatsAppController],
  providers: [WhatsAppNotificationsService],
  exports: [WhatsAppNotificationsService],
})
export class WhatsAppModule {}
