import { ChatAction, SendChatDto } from "@/type/chat";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8010";

/**
 * 获取 token（复用统一逻辑）
 */
function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  const token = localStorage.getItem("auth_token");
  if (!token) return "";
  return token.startsWith('"') ? JSON.parse(token) : token;
}

/**
 * 流式对话 - 返回 ReadableStream
 */
export async function sendChatStream(
  data: SendChatDto,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      onError("请求失败，请稍后重试");
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError("浏览器不支持流式读取");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);

        if (data === "[DONE]") {
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
    onError("网络错误，请检查网络连接后重试");
  }
}

/**
 * 从 AI 回复中解析 ACTION 标记
 */
export function parseAction(text: string): {
  cleanText: string;
  action?: ChatAction;
} {
  const actionRegex = /<!--ACTION:([\s\S]*?)-->/;
  const match = text.match(actionRegex);

  if (!match) {
    return { cleanText: text };
  }

  try {
    const action = JSON.parse(match[1]) as ChatAction;
    const cleanText = text.replace(actionRegex, "").trim();
    return { cleanText, action };
  } catch {
    return { cleanText: text };
  }
}

/**
 * 创建新会话
 */
export async function createSession(data: {
  title?: string;
  context?: "facesim" | "poster" | "general";
}) {
  const response = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("创建会话失败");
  }

  return response.json();
}

/**
 * 获取用户的所有会话
 */
export async function getUserSessions() {
  const response = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error("获取会话列表失败");
  }

  return response.json();
}

/**
 * 获取会话详情（包含所有消息）
 */
export async function getSessionById(sessionId: number) {
  const response = await fetch(
    `${API_BASE_URL}/api/chat/sessions/${sessionId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("获取会话详情失败");
  }

  return response.json();
}

/**
 * 更新会话标题
 */
export async function updateSession(
  sessionId: number,
  data: { title?: string },
) {
  const response = await fetch(
    `${API_BASE_URL}/api/chat/sessions/${sessionId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error("更新会话失败");
  }

  return response.json();
}

/**
 * 删除会话
 */
export async function deleteSession(sessionId: number) {
  const response = await fetch(
    `${API_BASE_URL}/api/chat/sessions/${sessionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("删除会话失败");
  }

  return response.json();
}
