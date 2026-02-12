import { ChatMessage, ChatSession } from "generated/prisma/client";


export class ChatSessionEntity implements ChatSession {
  id: number;
  userId: number;
  title: string | null;
  context: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatMessageEntity implements ChatMessage {
  id: number;
  sessionId: number;
  role: string;
  content: string;
  imageUrls: any | null;
  action: any | null;
  generatedImage: string | null;
  provider: string | null;
  model: string | null;
  createdAt: Date;
}

export class ChatSessionWithMessages extends ChatSessionEntity {
  messages: ChatMessageEntity[];
}
