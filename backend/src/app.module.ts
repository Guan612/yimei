import { Module } from '@nestjs/common';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './upload/upload.module';
import { ModelconfigModule } from './modelconfig/modelconfig.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { ZodSerializerInterceptor } from 'nestjs-zod';
import { ModelReqModule } from './model-req/model-req.module';
import { validate } from './config/env.validation';
import { AppConfigModule } from './config/config.module';
import { ImageGenModule } from './image-gen/image-gen.module';
import { ZodExceptionFilter } from './common/filters/zod-exception.filter';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MedicalAestheticsModule } from './medical-aesthetics/medical-aesthetics.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      expandVariables: true,
    }),
    EventEmitterModule.forRoot({
      // 可选配置
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
    }),
    AppConfigModule,
    AuthModule,
    PrismaModule,
    UploadModule,
    ModelconfigModule,
    ModelReqModule,
    ImageGenModule,
    MedicalAestheticsModule,
    ChatModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ZodExceptionFilter,
    },
  ],
})
export class AppModule {}
