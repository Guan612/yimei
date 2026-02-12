import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAtomValue, useSetAtom } from "jotai";
import { tokenAtom, userInfoAtom } from "@/store/auth";
import {
  useChatMessages,
  useChatImageUpload,
  useChatImageGeneration,
  useChatInput,
} from "@/hooks/chat";
import { ChatAction } from "@/type/chat";

export interface UseChatPageReturn {
  // Messages
  messages: any[];
  streaming: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;

  // Images
  images: any[];
  selectedImage: string | null;
  currentImage: any;
  generatingMsgIds: Set<string>;
  lightboxUrl: string | null;
  setSelectedImage: (id: string) => void;
  setLightboxUrl: (url: string | null) => void;

  // Input
  input: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleTextareaInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  createKeyDownHandler: (onSend: () => void) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;

  // Image upload
  pendingImage: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePendingImage: () => void;
  triggerFileSelect: () => void;

  // Actions
  handleSend: (text?: string, imageUrlsOverride?: string[]) => Promise<void>;
  handleLogout: () => void;
}

export function useChatPage(): UseChatPageReturn {
  const navigate = useNavigate();
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const searchParams = useMemo(() => new URLSearchParams(searchStr), [searchStr]);
  const token = useAtomValue(tokenAtom);
  const setToken = useSetAtom(tokenAtom);
  const setUserInfo = useSetAtom(userInfoAtom);

  const initialSent = useRef(false);
  const updateMessageRef = useRef<any>(null);

  // 图片生成完成回调
  const onImageGenerated = useCallback((url: string, msgId?: string) => {
    if (msgId && updateMessageRef.current) {
      updateMessageRef.current(msgId, {
        generatingImage: false,
        generatedImageUrl: url,
      });
    }
  }, []);

  // 图片生成hook
  const {
    images,
    selectedImage,
    generatingMsgIds,
    lightboxUrl,
    setSelectedImage,
    setLightboxUrl,
    handleGenerateImage: generateImage,
    currentImage,
  } = useChatImageGeneration({
    onImageGenerated,
  });

  // 消息完成回调
  const onMessageComplete = useCallback(
    (msg: any, action?: ChatAction) => {
      // 自动触发生图
      if (action && msg.id) {
        const currentImageUrls = msg.imageUrls;
        const actionWithImages: ChatAction =
          currentImageUrls && currentImageUrls.length > 0
            ? { ...action, imageUrls: currentImageUrls }
            : action;

        // 标记消息正在生成图片
        if (updateMessageRef.current) {
          updateMessageRef.current(msg.id, { generatingImage: true });
        }

        // 调用图片生成
        generateImage(actionWithImages, msg.id);
      }
    },
    [generateImage]
  );

  const onError = useCallback(
    (error: string) => {
      if (error === "请先登录") {
        navigate({ to: "/login" });
      }
    },
    [navigate]
  );

  // 使用消息管理hook
  const {
    messages,
    streaming,
    messagesEndRef,
    handleSend: sendMessage,
    updateMessage,
  } = useChatMessages({
    token,
    onMessageComplete,
    onError,
  });

  // 存储updateMessage到ref
  useEffect(() => {
    updateMessageRef.current = updateMessage;
  }, [updateMessage]);

  // 图片上传hook
  const {
    pendingImage,
    fileInputRef,
    handleImageSelect,
    removePendingImage,
    triggerFileSelect,
  } = useChatImageUpload();

  // 输入框hook
  const {
    input,
    textareaRef,
    handleTextareaInput,
    createKeyDownHandler,
    clearInput,
  } = useChatInput();

  const handleSend = useCallback(
    async (text?: string, imageUrlsOverride?: string[]) => {
      const message = (text || input).trim();
      if (!message || streaming) return;
      if (pendingImage?.uploading) return;

      if (!token) {
        navigate({ to: "/login" });
        return;
      }

      const currentImageUrls =
        imageUrlsOverride || (pendingImage?.url ? [pendingImage.url] : undefined);

      // 发送消息
      await sendMessage(message, currentImageUrls);

      // 清理
      if (!text) clearInput();
      if (pendingImage) {
        URL.revokeObjectURL(pendingImage.preview);
        removePendingImage();
      }
    },
    [input, streaming, pendingImage, token, navigate, sendMessage, clearInput, removePendingImage]
  );

  // 初始URL参数处理
  useEffect(() => {
    if (initialSent.current) return;
    const q = searchParams.get("q");
    const imgs = searchParams.get("imgs");
    if (q && token) {
      initialSent.current = true;
      const imageUrls = imgs ? imgs.split(",").filter(Boolean) : undefined;
      handleSend(q, imageUrls);
    }
  }, [searchParams, token, handleSend]);

  const handleLogout = useCallback(() => {
    setToken(null);
    setUserInfo({ userId: 0, loginId: "", nickname: "", role: 0 });
    navigate({ to: "/" });
  }, [setToken, setUserInfo, navigate]);

  return {
    messages,
    streaming,
    messagesEndRef,
    images,
    selectedImage,
    currentImage,
    generatingMsgIds,
    lightboxUrl,
    setSelectedImage,
    setLightboxUrl,
    input,
    textareaRef,
    handleTextareaInput,
    createKeyDownHandler,
    pendingImage,
    fileInputRef,
    handleImageSelect,
    removePendingImage,
    triggerFileSelect,
    handleSend,
    handleLogout,
  };
}
