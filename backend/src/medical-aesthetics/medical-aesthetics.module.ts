import { Module } from '@nestjs/common';
import { MedicalAestheticsService } from './medical-aesthetics.service';
import { MedicalAestheticsController } from './medical-aesthetics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MedicalAestheticsController],
  providers: [MedicalAestheticsService],
})
export class MedicalAestheticsModule {}
