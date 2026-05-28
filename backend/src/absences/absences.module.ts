import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { AbsencesController } from './absences.controller';
import { AbsencesService } from './absences.service';

@Module({
  imports: [PrismaModule],
  controllers: [AbsencesController],
  providers: [AbsencesService],
})
export class AbsencesModule {}
