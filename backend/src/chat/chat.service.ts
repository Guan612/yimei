import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { SendMessageDto } from './dto/chat.dto';
import { Response } from 'express';
import { AiProviderService } from '../ai-provider/ai-provider.service';
import { ChatMessage } from '../ai-provider/providers/base.provider';

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

  constructor(private readonly aiProviderService: AiProviderService) {}

  /**
   * SSE 流式发送消息
   */
  async sendMessageStream(dto: SendMessageDto, userId: number, res: Response) {
    // 获取 text-gen provider
    const provider = await this.aiProviderService.selectTextGenProvider();

    this.logger.log(
      `用户 ${userId} 发送流式消息，使用配置：${provider.name}`,
    );

    // 构建消息列表
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
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

    // 设置 SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      await provider.streamChat(messages, res);
    } catch (error) {
      this.logger.error('流式请求失败', error);
      res.write(`data: ${JSON.stringify({ error: '请求失败，请稍后重试' })}\n\n`);
    } finally {
      res.write('data: [DONE]\n\n');
      res.end();
    }
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
}
