export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrls?: string[];
}

export interface SendChatDto {
  message: string;
  sessionId?: number;  // 会话ID，如果不传则创建新会话
  context?: 'facesim' | 'poster' | 'general';
  history?: ChatMessage[];  // 仅在不使用sessionId时有效
  imageUrls?: string[];
}

export interface ChatAction {
  action: 'facesim' | 'poster';
  prompt: string;
  imageUrls?: string[];
}

// 会话类型
export interface ChatSession {
  id: number;
  userId: number;
  title: string | null;
  context: string | null;
  createdAt: string;
  updatedAt: string;
}

// 会话列表项
export interface ChatSessionListItem {
  id: number;
  title: string | null;
  context: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  firstMessage?: string;
}

// 数据库消息类型
export interface ChatMessageEntity {
  id: number;
  sessionId: number;
  role: string;
  content: string;
  imageUrls: string[] | null;
  action: ChatAction | null;
  generatedImage: string | null;
  provider: string | null;
  model: string | null;
  createdAt: string;
}

// 会话详情（包含消息）
export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessageEntity[];
}
