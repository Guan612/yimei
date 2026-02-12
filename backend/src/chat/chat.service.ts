import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SendMessageDto, CreateSessionDto, UpdateSessionDto } from './dto/chat.dto';
import { Response } from 'express';
import { AiProviderService } from '../ai-provider/ai-provider.service';
import { ChatMessage } from '../ai-provider/providers/base.provider';
import { QUEUE_NAMES } from '../queue/constants';
import { TextGenerationJobData } from '../queue/interfaces';
import { PrismaService } from '../prisma/prisma.service';

const SYSTEM_PROMPT = `你是 AesthetiCore 医美智能助手，一位专业的医学美容顾问。你的职责：

1. **美学咨询**：当用户描述想改善的外貌问题（如祛斑、双眼皮、瘦脸等），你需要：
   - 分析用户需求，给出专业的医美方案建议
   - 在回复的最后一行，单独输出一个 JSON 标记：<!--ACTION:{"action":"facesim","prompt":"优化后的英文图片编辑提示词"}-->

2. **海报设计**：当用户需要制作营销海报（如活动海报、促销海报等），你需要：
   - 帮助用户完善海报文案和设计思路
   - 在回复的最后一行，单独输出一个 JSON 标记：<!--ACTION:{"action":"poster","prompt":"优化后的英文海报生成提示词"}-->

3. **知识问答**：当用户咨询医美相关知识（如项目对比、术后护理等），你需要：
   - 给出专业、准确、易懂的回答
   - 不需要输出 ACTION 标记

4. **图片分析**：当用户上传了图片时：
   - 先简要描述图片内容
   - 根据用户需求（海报/美学咨询）结合图片生成方案
   - 必须输出 ACTION 标记，prompt 中要融入对图片内容的描述
   - 海报场景：prompt 应描述"基于用户提供的图片元素，生成..."
   - 美学场景：分析面部特征，给出改善建议

注意：
- 回复内容使用中文，支持 markdown 格式
- 美学咨询（facesim）场景：ACTION 标记中的 prompt 字段使用英文，生成高质量的 AI 图片编辑提示词。**极其重要**：prompt 必须强调"preserve the original facial identity, bone structure, and all distinguishing features"，只描述需要改善的局部区域（如去黑眼圈、平滑皮肤等），绝不能改变人物的整体面貌。prompt 应该是对原图的微调编辑指令，而不是从零生成一张新脸。
- 海报设计（poster）场景：ACTION 标记中的 prompt 字段使用中文，海报生图支持中文文字渲染，prompt 中应包含海报的标题、文案、活动信息等具体中文内容
- ACTION 标记必须放在回复的最后一行，且必须是 <!--ACTION:{...}--> 格式
- 如果不需要 action，就不要输出 ACTION 标记`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly aiProviderService: AiProviderService,
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.TEXT_GENERATION)
    private readonly textGenerationQueue: Queue<TextGenerationJobData>,
  ) {}

  /**
   * SSE 流式发送消息
   */
  async sendMessageStream(dto: SendMessageDto, userId: number, res: Response) {
    // 获取 text-gen provider
    const provider = await this.aiProviderService.selectTextGenProvider();

    this.logger.log(
      `用户 ${userId} 发送流式消息，使用配置：${provider.name}`,
    );

    // 如果提供了 sessionId，从数据库加载历史消息
    let session: any = null;
    if (dto.sessionId) {
      session = await this.prisma.chatSession.findUnique({
        where: { id: dto.sessionId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!session) {
        throw new NotFoundException(`会话 ${dto.sessionId} 不存在`);
      }
    }

    // 构建消息列表
    const messages = session
      ? this.buildMessagesFromSession(session, dto)
      : this.buildMessages(dto);

    // 设置 SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let assistantMessage = '';

    try {
      // 收集流式响应
      const originalWrite = res.write.bind(res);
      res.write = (chunk: any, ...args: any[]) => {
        const data = chunk.toString();
        if (data.startsWith('data: ') && !data.includes('[DONE]')) {
          try {
            const jsonStr = data.substring(6).trim();
            const parsed = JSON.parse(jsonStr);
            if (parsed.content) {
              assistantMessage += parsed.content;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
        return originalWrite(chunk, ...args);
      };

      await provider.streamChat(messages, res);

      // 保存消息到数据库
      if (dto.sessionId || session) {
        const sessionId = session?.id || dto.sessionId!;
        await this.saveMessages(
          sessionId,
          userId,
          dto,
          assistantMessage,
          provider.name,
        );
      }
    } catch (error) {
      this.logger.error('流式请求失败', error);
      res.write(`data: ${JSON.stringify({ error: '请求失败，请稍后重试' })}\n\n`);
    } finally {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }

  /**
   * 提交文本生成任务到队列（异步）
   * 适用于不需要流式响应的场景
   */
  async sendMessage(dto: SendMessageDto, userId: number, systemPrompt?: string) {
    this.logger.log(`提交文本生成任务到队列，用户 ${userId}`);

    // 构建消息列表，支持动态注入系统提示词
    const messages = this.buildMessages(dto, systemPrompt);

    // 添加任务到队列
    const job = await this.textGenerationQueue.add('chat-message', {
      type: 'chat',
      userId,
      messages,
    } as TextGenerationJobData, {
      removeOnComplete: { age: 300, count: 100 },
      removeOnFail: false,
    });

    this.logger.log(`任务已提交，Job ID: ${job.id}`);

    return {
      jobId: String(job.id),
      message: '文本生成任务已提交，请使用 jobId 查询任务状态',
    };
  }

  /**
   * 构建消息列表
   * @param dto 用户消息数据
   * @param systemPrompt 可选的系统提示词，如果提供则覆盖默认的 SYSTEM_PROMPT
   */
  private buildMessages(dto: SendMessageDto, systemPrompt?: string): ChatMessage[] {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
    ];

    // 添加历史消息
    if (dto.history && dto.history.length > 0) {
      for (const msg of dto.history) {
        if (msg.imageUrls && msg.imageUrls.length > 0 && msg.role === 'user') {
          const content: any[] = [{ type: 'text', text: msg.content }];
          for (const url of msg.imageUrls) {
            content.push({ type: 'image_url', image_url: { url } });
          }
          messages.push({ role: msg.role, content });
        } else {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // 添加上下文提示
    const contextHint = this.buildContextHint(dto.context);
    const userText = contextHint
      ? `[用户当前场景：${contextHint}]\n\n${dto.message}`
      : dto.message;

    // 构建用户消息（支持多模态）
    if (dto.imageUrls && dto.imageUrls.length > 0) {
      const content: any[] = [{ type: 'text', text: userText }];
      for (const url of dto.imageUrls) {
        content.push({ type: 'image_url', image_url: { url } });
      }
      messages.push({ role: 'user', content });
    } else {
      messages.push({ role: 'user', content: userText });
    }

    return messages;
  }

  private buildContextHint(context?: string): string {
    switch (context) {
      case 'facesim':
        return '美学咨询 - 用户希望了解医美方案并模拟效果';
      case 'poster':
        return '海报设计 - 用户希望生成营销海报';
      default:
        return '';
    }
  }

  /**
   * 从数据库会话构建消息列表
   */
  private buildMessagesFromSession(
    session: any,
    dto: SendMessageDto,
  ): ChatMessage[] {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // 添加会话中的历史消息
    for (const msg of session.messages) {
      const imageUrls = msg.imageUrls as string[] | null;
      if (imageUrls && imageUrls.length > 0 && msg.role === 'user') {
        const content: any[] = [{ type: 'text', text: msg.content }];
        for (const url of imageUrls) {
          content.push({ type: 'image_url', image_url: { url } });
        }
        messages.push({ role: msg.role, content });
      } else {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // 添加当前用户消息
    const contextHint = this.buildContextHint(dto.context || session.context);
    const userText = contextHint
      ? `[用户当前场景：${contextHint}]\n\n${dto.message}`
      : dto.message;

    if (dto.imageUrls && dto.imageUrls.length > 0) {
      const content: any[] = [{ type: 'text', text: userText }];
      for (const url of dto.imageUrls) {
        content.push({ type: 'image_url', image_url: { url } });
      }
      messages.push({ role: 'user', content });
    } else {
      messages.push({ role: 'user', content: userText });
    }

    return messages;
  }

  /**
   * 保存用户消息和助手回复到数据库
   */
  private async saveMessages(
    sessionId: number,
    _userId: number,
    dto: SendMessageDto,
    assistantMessage: string,
    providerName: string,
  ) {
    try {
      // 解析 ACTION 标记
      let action: any = undefined;
      const actionMatch = assistantMessage.match(/<!--ACTION:(\{.*?\})-->/);
      if (actionMatch) {
        try {
          action = JSON.parse(actionMatch[1]);
        } catch (e) {
          this.logger.warn('解析 ACTION 标记失败', e);
        }
      }

      await this.prisma.$transaction([
        // 保存用户消息
        this.prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'user',
            content: dto.message,
            imageUrls: dto.imageUrls && dto.imageUrls.length > 0 ? dto.imageUrls : undefined,
          },
        }),
        // 保存助手回复
        this.prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: assistantMessage,
            action,
            provider: providerName,
          },
        }),
      ]);

      this.logger.log(`消息已保存到会话 ${sessionId}`);
    } catch (error) {
      this.logger.error('保存消息失败', error);
    }
  }

  /**
   * 创建新会话
   */
  async createSession(dto: CreateSessionDto, userId: number) {
    const session = await this.prisma.chatSession.create({
      data: {
        userId,
        title: dto.title || '新对话',
        context: dto.context,
      },
    });

    return session;
  }

  /**
   * 获取用户的所有会话
   */
  async getUserSessions(userId: number) {
    const sessions = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { content: true, createdAt: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      context: s.context,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s._count.messages,
      firstMessage: s.messages[0]?.content,
    }));
  }

  /**
   * 获取会话详情（包含所有消息）
   */
  async getSessionById(sessionId: number, userId: number) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`会话 ${sessionId} 不存在`);
    }

    return session;
  }

  /**
   * 更新会话标题
   */
  async updateSession(sessionId: number, userId: number, dto: UpdateSessionDto) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException(`会话 ${sessionId} 不存在`);
    }

    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: dto.title },
    });
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: number, userId: number) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException(`会话 ${sessionId} 不存在`);
    }

    await this.prisma.chatSession.delete({
      where: { id: sessionId },
    });

    return { message: '会话已删除' };
  }
}
