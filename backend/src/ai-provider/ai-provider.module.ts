import { Module, Global, OnModuleInit } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpService } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { AiProviderService } from './ai-provider.service';
import { PrismaModule } from '../prisma/prisma.module';

// Import all providers
import { OpenAITextGenProvider } from './providers/text-gen/openai.provider';
import { GeminiTextGenProvider } from './providers/text-gen/gemini.provider';
import { StabilityImageGenProvider } from './providers/image-gen/stability.provider';
import { OpenAIImageGenProvider } from './providers/image-gen/openai.provider';
import { GeminiImageGenProvider } from './providers/image-gen/gemini.provider';

/**
 * AI Provider 全局模块
 * 提供统一的 AI 服务管理（文本生成、图像生成等）
 */
@Global()
@Module({
  imports: [HttpModule, PrismaModule],
  providers: [AiProviderService],
  exports: [AiProviderService],
})
export class AiProviderModule implements OnModuleInit {
  constructor(private readonly aiProviderService: AiProviderService) {}

  async onModuleInit() {
    // 先注册所有 text-gen providers
    this.aiProviderService.registerProvider(
      'text-gen',
      'openai',
      OpenAITextGenProvider,
    );
    this.aiProviderService.registerProvider(
      'text-gen',
      'gemini',
      GeminiTextGenProvider,
    );

    // 注册所有 image-gen providers
    this.aiProviderService.registerProvider(
      'image-gen',
      'stability',
      StabilityImageGenProvider,
    );
    this.aiProviderService.registerProvider(
      'image-gen',
      'openai',
      OpenAIImageGenProvider,
    );
    this.aiProviderService.registerProvider(
      'image-gen',
      'gemini',
      GeminiImageGenProvider,
    );

    // 所有 provider 注册完成后，再加载配置
    await this.aiProviderService.loadProviders();
  }
}
