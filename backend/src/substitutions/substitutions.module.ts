import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { SubstitutionsController } from './substitutions.controller';
import { SubstitutionsService } from './substitutions.service';

@Module({
  imports: [PrismaModule],
  controllers: [SubstitutionsController],
  providers: [SubstitutionsService],
})
export class SubstitutionsModule {}	
