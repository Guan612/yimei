import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { ImageGenController } from './image-gen.controller';
import { ImageGenService } from './image-gen.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { QUEUE_NAMES } from '../queue/constants';
import { ImageGenerationProcessor } from '../queue/image-generation.processor';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    UploadModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.IMAGE_GENERATION,
    }),
  ],
  controllers: [ImageGenController],
  providers: [ImageGenService, ImageGenerationProcessor],
  exports: [ImageGenService],
})
export class ImageGenModule {}
