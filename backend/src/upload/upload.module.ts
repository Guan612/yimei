import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { HttpModule } from '@nestjs/axios';
import { S3Client } from '@aws-sdk/client-s3';
import { PrismaModule } from '../prisma/prisma.module';
import { AppConfigService } from '../config/config.service';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    {
      provide: S3Client,
      useFactory: (appConfig: AppConfigService) => {
        const s3Config = appConfig.s3Config;

        return new S3Client({
          endpoint: s3Config.endpoint,
          region: s3Config.region,
          credentials: {
            accessKeyId: s3Config.accessKeyId,
            secretAccessKey: s3Config.secretAccessKey,
          },
          forcePathStyle: true,
        });
      },
      inject: [AppConfigService],
    },
  ],
  exports: [UploadService, S3Client],
})
export class UploadModule {}
