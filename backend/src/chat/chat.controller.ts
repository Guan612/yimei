import { Controller, Post, Body, UseGuards, Res, Get, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto, CreateSessionDto, UpdateSessionDto } from './dto/chat.dto';
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

  @Post('async')
  @ApiOperation({ summary: '异步对话（队列）' })
  asyncMessage(
    @Body() dto: SendMessageDto,
    @UserInfo() user: TokenDto,
  ) {
    return this.chatService.sendMessage(dto, user.id);
  }

  @Post('sessions')
  @ApiOperation({ summary: '创建新会话' })
  createSession(
    @Body() dto: CreateSessionDto,
    @UserInfo() user: TokenDto,
  ) {
    return this.chatService.createSession(dto, user.id);
  }

  @Get('sessions')
  @ApiOperation({ summary: '获取用户的所有会话' })
  getUserSessions(@UserInfo() user: TokenDto) {
    return this.chatService.getUserSessions(user.id);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: '获取会话详情（包含所有消息）' })
  getSessionById(
    @Param('id', ParseIntPipe) id: number,
    @UserInfo() user: TokenDto,
  ) {
    return this.chatService.getSessionById(id, user.id);
  }

  @Patch('sessions/:id')
  @ApiOperation({ summary: '更新会话标题' })
  updateSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSessionDto,
    @UserInfo() user: TokenDto,
  ) {
    return this.chatService.updateSession(id, user.id, dto);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: '删除会话' })
  deleteSession(
    @Param('id', ParseIntPipe) id: number,
    @UserInfo() user: TokenDto,
  ) {
    return this.chatService.deleteSession(id, user.id);
  }
}
