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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010';

/**
 * 流式对话 - 返回 ReadableStream
 */
export async function sendChatStream(
  data: SendChatDto,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const parsedToken = token ? (token.startsWith('"') ? JSON.parse(token) : token) : '';

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parsedToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      onError('请求失败，请稍后重试');
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('浏览器不支持流式读取');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);

        if (data === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            onError(parsed.error);
            return;
          }
          if (parsed.content) {
            onChunk(parsed.content);
          }
        } catch {
          // skip
        }
      }
    }

    onDone();
  } catch {
    onError('网络错误，请检查网络连接后重试');
  }
}

/**
 * 从 AI 回复中解析 ACTION 标记
 */
export function parseAction(text: string): { cleanText: string; action?: ChatAction } {
  const actionRegex = /<!--ACTION:([\s\S]*?)-->/;
  const match = text.match(actionRegex);

  if (!match) {
    return { cleanText: text };
  }

  try {
    const action = JSON.parse(match[1]) as ChatAction;
    const cleanText = text.replace(actionRegex, '').trim();
    return { cleanText, action };
  } catch {
    return { cleanText: text };
  }
}
