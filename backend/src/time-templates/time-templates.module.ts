import { Module } from '@nestjs/common';
import { TimeTemplatesController } from './time-templates.controller';
import { TimeTemplatesService } from './time-templates.service';

@Module({ controllers: [TimeTemplatesController], providers: [TimeTemplatesService] })
export class TimeTemplatesModule {}
