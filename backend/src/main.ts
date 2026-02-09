import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppConfigService } from './config/config.service';
import { RequestMethod } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // 获取配置服务
  const appConfig = app.get(AppConfigService);

  // 启用 CORS
  app.enableCors();

  // 调大请求体限制（支持图片 base64 传输）
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('医美管理系统')
    .setDescription('医美管理系统 API 文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(document));

  const port = appConfig.port;
  await app.listen(port);
  console.log(`应用运行在端口: ${port}`);
  console.log(`当前环境: ${appConfig.nodeEnv}`);
  console.log(`API 文档: http://localhost:${port}/api`);
}
bootstrap();
