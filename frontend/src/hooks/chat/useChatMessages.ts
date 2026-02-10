"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  sendChatStream,
  parseAction,
  type ChatMessage,
  type ChatAction,
} from "@/api/chat";

/**
 * 消息信息
 */
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: ChatAction;
  loading?: boolean;
  imageUrls?: string[];
  generatingImage?: boolean;
  generatedImageUrl?: string;
}

/**
 * 消息管理Hook配置
 */
export interface UseChatMessagesOptions {
  /** 消息流式更新回调 */
  onStreamUpdate?: (content: string) => void;
  /** 消息完成回调 */
  onMessageComplete?: (message: Message, action?: ChatAction) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
  /** 认证token */
  token: string | null;
}

/**
 * 消息管理Hook返回类型
 */
export interface UseChatMessagesReturn {
  /** 消息列表 */
  messages: Message[];
  /** 是否正在流式传输 */
  streaming: boolean;
  /** 消息列表末尾ref */
  messagesEndRef: React.RefObject<HTMLDivElement>;
  /** 发送消息 */
  handleSend: (text?: string, imageUrls?: string[]) => Promise<void>;
  /** 更新消息 */
  updateMessage: (
    msgId: string,
    updates: Partial<Message>
  ) => void;
  /** 滚动到底部 */
  scrollToBottom: () => void;
}

/**
 * 聊天消息管理Hook
 *
 * 封装消息列表、发送、流式响应等核心逻辑
 *
 * @example
 * ```tsx
 * const {
 *   messages,
 *   streaming,
 *   messagesEndRef,
 *   handleSend,
 *   updateMessage
 * } = useChatMessages({
 *   token: userToken,
 *   onMessageComplete: (msg, action) => {
 *     if (action) {
 *       // 处理action
 *     }
 *   }
 * });
 *
 * // 发送消息
 * await handleSend("你好", ["image-url"]);
 * ```
 */
export function useChatMessages(
  options: UseChatMessagesOptions
): UseChatMessagesReturn {
  const { onStreamUpdate, onMessageComplete, onError, token } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const updateMessage = useCallback(
    (msgId: string, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, ...updates } : m))
      );
    },
    []
  );

  const handleSend = useCallback(
    async (text?: string, imageUrls?: string[]) => {
      const message = text?.trim();
      if (!message || streaming) return;

      if (!token) {
        onError?.("请先登录");
        return;
      }

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        imageUrls,
      };

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        loading: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);

      const history: ChatMessage[] = messages
        .filter((m) => !m.loading)
        .map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.imageUrls && m.imageUrls.length > 0
            ? { imageUrls: m.imageUrls }
            : {}),
        }));

      let fullContent = "";

      await sendChatStream(
        { message, history, imageUrls },
        (chunk) => {
          fullContent += chunk;
          onStreamUpdate?.(fullContent);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: fullContent, loading: false }
                : m
            )
          );
        },
        () => {
          const { cleanText, action } = parseAction(fullContent);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: cleanText, action, loading: false }
                : m
            )
          );
          setStreaming(false);

          // 回调通知完成
          const finalMsg = { ...assistantMsg, content: cleanText, action };
          onMessageComplete?.(finalMsg, action);
        },
        (err) => {
          const errorMsg = err || "请求失败，请稍后重试";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: errorMsg, loading: false }
                : m
            )
          );
          setStreaming(false);
          onError?.(errorMsg);
        }
      );
    },
    [streaming, token, messages, onStreamUpdate, onMessageComplete, onError]
  );

  return {
    messages,
    streaming,
    messagesEndRef,
    handleSend,
    updateMessage,
    scrollToBottom,
  };
}
