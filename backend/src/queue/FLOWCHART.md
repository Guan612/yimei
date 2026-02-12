# 异步队列流程图

## 整体架构

```mermaid
graph TB
    subgraph Client[客户端]
        Web[Web前端]
        Mobile[移动端]
    end
    
    subgraph API[NestJS API]
        ChatController[ChatController]
        ImageGenController[ImageGenController]
    end
    
    subgraph Queue[BullMQ队列系统]
        TextQueue[text-generation队列]
        ImageQueue[image-generation队列]
        Redis[(Redis<br/>任务存储)]
    end
    
    subgraph Processor[任务处理器]
        TextProcessor[TextGenerationProcessor]
        ImageProcessor[ImageGenerationProcessor]
    end
    
    subgraph Services[业务服务]
        ChatService[ChatService]
        ImageGenService[ImageGenService]
        AIProviderService[AIProviderService]
    end
    
    subgraph External[外部服务]
        OpenAI[OpenAI]
        Stability[Stability AI]
    end
    
    Web -->|异步请求| ChatController
    Mobile -->|异步请求| ChatController
    Web -->|异步请求| ImageGenController
    Mobile -->|异步请求| ImageGenController
    
    ChatController -->|提交任务| ChatService
    ImageGenController -->|提交任务| ImageGenService
    
    ChatService -->|add| TextQueue
    ImageGenService -->|add| ImageQueue
    
    TextQueue -.->|存储任务| Redis
    ImageQueue -.->|存储任务| Redis
    
    Redis -.->|消费任务| TextQueue
    Redis -.->|消费任务| ImageQueue
    
    TextQueue -->|处理| TextProcessor
    ImageQueue -->|处理| ImageProcessor
    
    TextProcessor --> ChatService
    TextProcessor --> AIProviderService
    
    ImageProcessor --> ImageGenService
    
    ChatService -->|调用| AIProviderService
    AIProviderService --> OpenAI
    
    ImageGenService --> Stability
    
    style Queue fill:#e1f5e1
    style Redis fill:#ffe1e1
    style Processor fill:#e1e1ff
```

## 文本生成详细流程

```mermaid
sequenceDiagram
    participant C as 客户端
    participant API as ChatController
    participant S as ChatService
    participant Q as text-generation队列
    participant P as TextGenerationProcessor
    participant AI as AIProviderService
    participant R as Redis
    participant Ext as OpenAI API
    
    C->>API: POST /chat/async (SendMessageDto)
    API->>S: sendMessage(dto, userId, systemPrompt?)
    
    S->>S: buildMessages()
    S->>Q: queue.add('chat-message', jobData)
    Q->>R: 存储任务
    S-->>API: { jobId, message }
    API-->>C: { jobId, status: 'queued' }
    
    Note over P,Q: 后台异步处理
    R->>P: 分发任务
    P->>P: process(job)
    P->>R: updateProgress(10%)
    
    P->>AI: selectTextGenProvider()
    AI-->>P: Provider实例
    
    P->>R: updateProgress(30%)
    P->>AI: streamChat(messages, mockResponse)
    
    loop 流式响应
        Ext-->>AI: SSE数据流
        AI-->>P: chunk
        P->>R: updateProgress(30%-90%)
    end
    
    P->>R: updateProgress(100%)
    P->>R: 存储结果
    P-->>R: 任务完成
    
    Note over C,API: 客户端轮询查询结果
    C->>API: GET /chat/jobs/:jobId
    API->>R: getJob(jobId)
    R-->>API: Job状态
    API-->>C: { status, data }
```

## 图片生成详细流程

```mermaid
sequenceDiagram
    participant C as 客户端
    participant API as ImageGenController
    participant S as ImageGenService
    participant Q as image-generation队列
    participant P as ImageGenerationProcessor
    participant Ext as Stability AI
    participant R as Redis
    
    alt 图片生成
        C->>API: POST /image-gen/generate/async
        API->>S: generateImage(dto, userId)
        S->>Q: queue.add('generate-image', {type: 'generate'})
    else 局部重绘
        C->>API: POST /image-gen/inpaint/async
        API->>S: inpaintImage(dto, userId)
        S->>Q: queue.add('inpaint-image', {type: 'inpaint'})
    end
    
    Q->>R: 存储任务
    S-->>API: { jobId }
    API-->>C: { jobId, status: 'queued' }
    
    Note over P,Q: 后台异步处理
    R->>P: 分发任务
    
    alt type='generate'
        P->>P: process(job)
        P->>R: updateProgress(10%)
        P->>S: generateImageInternal(dto, userId, onProgress)
        
        S->>R: 保存记录(状态:processing)
        S->>Ext: 生成图片
        loop 上传/处理
            S->>R: updateProgress(10%-90%)
        end
        S->>R: 保存记录(状态:completed)
        S-->>P: {imageUrl, provider...}
        
    else type='inpaint'
        P->>P: process(job)
        P->>R: updateProgress(10%)
        P->>S: inpaintInternal(dto, userId, onProgress)
        
        S->>Ext: 局部重绘
        loop 处理
            S->>R: updateProgress(10%-90%)
        end
        S-->>P: {imageUrl, provider...}
    end
    
    P->>R: updateProgress(100%)
    P->>R: 存储结果
    P-->>R: 任务完成
    
    Note over C,API: 客户端查询结果
    C->>API: GET /image-gen/jobs/:jobId
    API->>R: getJob(jobId)
    API-->>C: { status, data, error }
```

## 任务状态流转

```mermaid
stateDiagram-v2
    [*] --> waiting: 提交到队列
    waiting --> active: Worker获取任务
    active --> delayed: 重试中
    active --> completed: 处理成功
    active --> failed: 处理失败
    delayed --> active: 重新处理
    delayed --> failed: 超过重试次数
    completed --> [*]: 1小时后删除
    failed --> [*]: 24小时后删除
    
    note right of waiting
        Redis中存储
        removeOnComplete未触发
    end note
    
    note right of active
        Processor处理中
        updateProgress(10%-90%)
    end note
    
    note right of completed
        removeOnComplete: age=3600, count=100
    end note
    
    note right of failed
        removeOnFail: age=86400
        attempts: 3
    end note
```

## 队列配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| `attempts` | 3 | 失败重试次数 |
| `backoff.type` | exponential | 退避策略 |
| `backoff.delay` | 2000 | 基础延迟(ms) |
| `removeOnComplete.age` | 3600 | 成功任务保留时间(秒) |
| `removeOnComplete.count` | 100 | 最多保留成功任务数 |
| `removeOnFail.age` | 86400 | 失败任务保留时间(秒) |

## API端点

### 文本生成
- `POST /chat/async` - 提交异步对话任务
- `GET /chat/jobs/:jobId` - 查询任务状态

### 图片生成
- `POST /image-gen/generate/async` - 提交图片生成任务
- `POST /image-gen/inpaint/async` - 提交局部重绘任务
- `GET /image-gen/jobs/:jobId` - 查询任务状态
