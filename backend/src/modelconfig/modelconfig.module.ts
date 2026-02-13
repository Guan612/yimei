import { Module } from '@nestjs/common';
import { ModelconfigService } from './modelconfig.service';
import { ModelconfigController } from './modelconfig.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [ModelconfigController],
  providers: [ModelconfigService],
  exports: [ModelconfigService],
})
export class ModelconfigModule {}
