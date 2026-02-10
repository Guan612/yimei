import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_NAMES } from '../queue/constants';
import { TextGenerationProcessor } from '../queue/text-generation.processor';

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.TEXT_GENERATION,
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, PrismaService, TextGenerationProcessor],
  exports: [ChatService],
})
export class ChatModule {}
