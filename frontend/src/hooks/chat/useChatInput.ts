"use client";

import { useState, useRef, useCallback } from "react";

/**
 * 输入框Hook返回类型
 */
export interface UseChatInputReturn {
  /** 输入内容 */
  input: string;
  /** 设置输入内容 */
  setInput: (value: string) => void;
  /** 输入框ref */
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  /** 处理输入框输入 */
  handleTextareaInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** 创建键盘事件处理器 */
  createKeyDownHandler: (onSend: () => void) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** 清空输入 */
  clearInput: () => void;
}

/**
 * 聊天输入框Hook
 *
 * 封装输入框状态管理、自动调整高度等逻辑
 *
 * @example
 * ```tsx
 * const {
 *   input,
 *   textareaRef,
 *   handleTextareaInput,
 *   handleKeyDown,
 *   clearInput
 * } = useChatInput();
 *
 * // 在JSX中使用
 * <textarea
 *   ref={textareaRef}
 *   value={input}
 *   onChange={handleTextareaInput}
 *   onKeyDown={(e) => handleKeyDown(e, handleSend)}
 * />
 * ```
 */
export function useChatInput(): UseChatInputReturn {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 150) + "px";
    },
    []
  );

  const createKeyDownHandler = useCallback(
    (onSend: () => void) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    []
  );

  const clearInput = useCallback(() => {
    setInput("");
  }, []);

  return {
    input,
    setInput,
    textareaRef,
    handleTextareaInput,
    createKeyDownHandler,
    clearInput,
  };
}
