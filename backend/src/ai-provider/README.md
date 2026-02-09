# AI Provider 统一管理模块

这是一个统一的 AI 服务提供商管理模块，用于管理所有 AI 相关的功能（文本生成、图像生成等）。

## 📁 目录结构

```
ai-provider/
├── ai-provider.module.ts      # 模块定义和 provider 注册
├── ai-provider.service.ts     # 统一的 provider 管理服务
├── index.ts                   # 导出文件
└── providers/
    ├── base.provider.ts       # Provider 基类和接口定义
    ├── index.ts               # Provider 导出
    ├── text-gen/              # 文本生成 providers
    │   ├── openai.provider.ts
    │   └── gemini.provider.ts
    └── image-gen/             # 图像生成 providers
        ├── stability.provider.ts
        ├── openai.provider.ts
        └── gemini.provider.ts
```

## 🎯 核心特性

### 1. 统一的 Provider 管理
- 所有 AI provider 都通过 `AiProviderService` 统一管理
- 自动从数据库加载配置
- 支持热重载配置（监听数据库配置变更事件）

### 2. 类型安全的 Provider 系统
- `BaseProvider`: 所有 provider 的基类
- `TextGenProvider`: 文本生成 provider 基类
- `ImageGenProvider`: 图像生成 provider 基类

### 3. 灵活的 Provider 选择策略
- 通过配置 ID 选择特定的 provider
- 通过 provider 类型选择（如 'openai', 'gemini'）
- 自动选择（按优先级自动选择可用的 provider）

## 📖 使用方法

### 在服务中注入

```typescript
import { AiProviderService } from '../ai-provider/ai-provider.service';

@Injectable()
export class YourService {
  constructor(
    private readonly aiProviderService: AiProviderService,
  ) {}
}
```

### 使用文本生成服务

```typescript
// 方式1: 自动选择最佳 provider
const provider = await this.aiProviderService.selectTextGenProvider();
await provider.streamChat(messages, res);

// 方式2: 通过配置 ID 选择
const provider = this.aiProviderService.getTextGenProvider(configId);

// 方式3: 通过 provider 类型选择
const provider = this.aiProviderService.getTextGenProvider(undefined, 'openai');
```

### 使用图像生成服务

```typescript
// 方式1: 自动选择最佳 provider
const provider = await this.aiProviderService.selectImageGenProvider();
const result = await provider.generateImage(prompt, options);

// 方式2: 通过配置 ID 选择
const provider = this.aiProviderService.getImageGenProvider(configId);

// 方式3: 通过 provider 类型选择
const provider = this.aiProviderService.getImageGenProvider(undefined, 'stability');
```

## 🔌 添加新的 Provider

### 1. 创建 Provider 类

**文本生成 Provider 示例：**

```typescript
import { TextGenProvider, ChatMessage } from '../base.provider';

export class NewTextGenProvider extends TextGenProvider {
  readonly providerType = 'new-provider';

  constructor(private readonly httpService: HttpService) {
    super();
  }

  async validateConfig(): Promise<boolean> {
    // 实现配置验证逻辑
    return true;
  }

  async streamChat(messages: ChatMessage[], res: Response): Promise<void> {
    // 实现流式聊天逻辑
  }
}
```

**图像生成 Provider 示例：**

```typescript
import { ImageGenProvider, ImageGenerationOptions, ImageGenerationResult } from '../base.provider';

export class NewImageGenProvider extends ImageGenProvider {
  readonly providerType = 'new-provider';

  constructor(private readonly httpService: HttpService) {
    super();
  }

  async validateConfig(): Promise<boolean> {
    // 实现配置验证逻辑
    return true;
  }

  async generateImage(prompt: string, options?: ImageGenerationOptions): Promise<ImageGenerationResult> {
    // 实现图像生成逻辑
  }

  async inpaint(imageUrl: string, maskUrl: string, prompt: string, options?: ImageGenerationOptions): Promise<ImageGenerationResult> {
    // 实现图像修复逻辑
  }
}
```

### 2. 注册 Provider

在 `ai-provider.module.ts` 的 `onModuleInit` 方法中注册新的 provider：

```typescript
onModuleInit() {
  // 注册文本生成 provider
  this.aiProviderService.registerProvider(
    'text-gen',
    'new-provider',
    NewTextGenProvider,
  );

  // 或注册图像生成 provider
  this.aiProviderService.registerProvider(
    'image-gen',
    'new-provider',
    NewImageGenProvider,
  );
}
```

### 3. 在数据库中配置

在 `aiModelConfig` 表中添加配置记录：

```sql
INSERT INTO "AiModelConfig" (name, provider, type, baseUrl, apiKey, enabled, priority)
VALUES ('New Provider', 'new-provider', 'text-gen', 'https://api.example.com', 'your-api-key', true, 10);
```

## 🗃️ 数据库配置

Provider 配置存储在 `aiModelConfig` 表中：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| name | String | 配置名称 |
| provider | String | Provider 类型（openai, gemini, stability 等） |
| type | String | 服务类型（text-gen, image-gen, embedding 等） |
| modelId | String? | 模型 ID |
| baseUrl | String | API 基础 URL |
| apiKey | String | API 密钥 |
| config | Json? | 额外配置（如 skipValidation 等） |
| enabled | Boolean | 是否启用 |
| priority | Int | 优先级（数值越大优先级越高） |
| description | String? | 描述信息 |

## 🔄 配置热重载

模块会自动监听数据库配置变更事件（`AI_MODEL_CONFIG_CHANGED`），当配置发生变化时会自动重新加载所有 provider。

## 🎨 架构优势

1. **统一管理**：所有 AI provider 都在一个地方管理，便于维护
2. **类型安全**：通过 TypeScript 接口确保类型安全
3. **易于扩展**：添加新的 provider 只需实现接口并注册
4. **配置灵活**：支持多种 provider 选择策略
5. **热重载**：配置变更无需重启服务
6. **代码复用**：消除了重复代码，chat 和 image-gen 服务都使用统一的管理层

## 🔍 当前支持的 Providers

### 文本生成 (text-gen)
- ✅ OpenAI (GPT-4, GPT-3.5等)
- ✅ Google Gemini

### 图像生成 (image-gen)
- ✅ Stability AI (Stable Diffusion)
- ✅ OpenAI (DALL-E 2, DALL-E 3)
- ✅ Google Gemini 2.5 Flash Image

## 📝 注意事项

1. **安全性**：API 密钥等敏感信息存储在数据库中，需要确保数据库安全
2. **验证逻辑**：每个 provider 都需要实现 `validateConfig()` 方法来验证配置是否有效
3. **错误处理**：Provider 方法应该捕获异常并返回适当的错误信息
4. **优先级**：自动选择 provider 时按优先级从高到低尝试，直到找到可用的 provider
