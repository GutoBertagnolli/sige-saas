import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WhatsAppNotificationsService } from './whatsapp-notifications.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly service: WhatsAppNotificationsService) {}

  @Get('webhook')
  verifyWebhook(@Query() query: any) {
    return this.service.verifyWebhook(query);
  }

  @Post('webhook')
  async receiveWebhook(@Body() body: any) {
    await this.service.handleWebhook(body);
    return { ok: true };
  }
}
