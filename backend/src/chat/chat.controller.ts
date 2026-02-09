import { Controller, Post, Body, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { UserInfo } from 'src/auth/decorators/current-user.decorator';
import { TokenDto } from 'src/auth/dto/auth.dto';
import { Response } from 'express';

@ApiTags('智能对话')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('stream')
  @ApiOperation({ summary: '流式对话（SSE）' })
  async streamMessage(
    @Body() dto: SendMessageDto,
    @UserInfo() user: TokenDto,
    @Res() res: Response,
  ) {
    await this.chatService.sendMessageStream(dto, user.id, res);
  }
}
