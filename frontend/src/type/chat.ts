export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrls?: string[];
}

export interface SendChatDto {
  message: string;
  context?: 'facesim' | 'poster' | 'general';
  history?: ChatMessage[];
  imageUrls?: string[];
}

export interface ChatAction {
  action: 'facesim' | 'poster';
  prompt: string;
  imageUrls?: string[];
}
