"use client";

import { useState, useCallback, useRef } from "react";
import { generateImgApi } from "@/api/imagegen";
import { useJobPolling } from "@/hooks/common/useJobPolling";
import type { ChatAction } from "@/type/chat";
import { toast } from "sonner";

/**
 * 生成的图片信息
 */
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  loading?: boolean;
  progress?: number;
}

/**
 * 图片生成Hook返回类型
 */
export interface UseChatImageGenerationReturn {
  /** 生成的图片列表 */
  images: GeneratedImage[];
  /** 当前选中的图片ID */
  selectedImage: string | null;
  /** 正在生成的消息ID集合 */
  generatingMsgIds: Set<string>;
  /** Lightbox显示的图片URL */
  lightboxUrl: string | null;
  /** 设置选中图片 */
  setSelectedImage: (id: string | null) => void;
  /** 设置Lightbox图片 */
  setLightboxUrl: (url: string | null) => void;
  /** 处理图片生成 */
  handleGenerateImage: (
    action: ChatAction,
    msgId?: string
  ) => Promise<void>;
  /** 标记消息为生成中 */
  markMessageGenerating: (msgId: string, generating: boolean) => void;
  /** 获取当前显示的图片 */
  currentImage: GeneratedImage | undefined;
  /** 当前任务进度 (0-100) */
  currentProgress: number;
}

/**
 * 聊天图片生成Hook
 *
 * 封装AI图片生成、图片列表管理、Lightbox等逻辑，支持异步任务和进度跟踪
 *
 * @example
 * ```tsx
 * const {
 *   images,
 *   selectedImage,
 *   handleGenerateImage,
 *   setSelectedImage,
 *   currentImage,
 *   currentProgress
 * } = useChatImageGeneration({
 *   onImageGenerated: (url, msgId) => {
 *     console.log('图片生成成功', url);
 *   }
 * });
 *
 * // 生成图片
 * await handleGenerateImage(action, messageId);
 * ```
 */
export function useChatImageGeneration(options?: {
  onImageGenerated?: (url: string, msgId?: string) => void;
}): UseChatImageGenerationReturn {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatingMsgIds, setGeneratingMsgIds] = useState<Set<string>>(
    new Set()
  );
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // 异步任务相关状态
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [currentGeneratingImgId, setCurrentGeneratingImgId] = useState<string | null>(null);
  const currentMsgIdRef = useRef<string | undefined>(undefined);

  const markMessageGenerating = useCallback(
    (msgId: string, generating: boolean) => {
      setGeneratingMsgIds((prev) => {
        const next = new Set(prev);
        if (generating) {
          next.add(msgId);
        } else {
          next.delete(msgId);
        }
        return next;
      });
    },
    []
  );

  // 使用轮询 hook
  useJobPolling(jobId, {
    interval: 2000,
    onComplete: (result) => {
      console.log('[useChatImageGeneration] 图片生成完成', result);

      // 更新图片状态
      if (currentGeneratingImgId) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === currentGeneratingImgId
              ? { ...img, url: result.imageUrl, loading: false, progress: 100 }
              : img
          )
        );
      }

      // 清理状态
      setJobId(null);
      setCurrentProgress(0);
      setCurrentGeneratingImgId(null);

      const msgId = currentMsgIdRef.current;
      if (msgId) {
        markMessageGenerating(msgId, false);
      }

      // 回调通知外部
      if (options?.onImageGenerated) {
        options.onImageGenerated(result.imageUrl, msgId);
      }

      toast.success("图片生成成功！");
      currentMsgIdRef.current = undefined;
    },
    onError: (errorMsg) => {
      console.error('[useChatImageGeneration] 图片生成失败', errorMsg);

      // 移除生成失败的图片
      if (currentGeneratingImgId) {
        setImages((prev) => prev.filter((img) => img.id !== currentGeneratingImgId));
        if (selectedImage === currentGeneratingImgId) {
          setSelectedImage(null);
        }
      }

      // 清理状态
      setJobId(null);
      setCurrentProgress(0);
      setCurrentGeneratingImgId(null);

      const msgId = currentMsgIdRef.current;
      if (msgId) {
        markMessageGenerating(msgId, false);
      }

      toast.error("图片生成失败", {
        description: errorMsg,
      });
      currentMsgIdRef.current = undefined;
    },
    onProgress: (progress) => {
      console.log('[useChatImageGeneration] 进度更新:', progress);
      setCurrentProgress(progress);

      // 更新图片的进度
      if (currentGeneratingImgId) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === currentGeneratingImgId
              ? { ...img, progress }
              : img
          )
        );
      }
    },
  });

  const handleGenerateImage = useCallback(
    async (action: ChatAction, msgId?: string) => {
      // 标记消息正在生图
      if (msgId) {
        markMessageGenerating(msgId, true);
        currentMsgIdRef.current = msgId;
      }

      // 创建临时图片占位符
      const imgId = Date.now().toString();
      const placeholderImg: GeneratedImage = {
        id: imgId,
        url: "",
        prompt: action.prompt,
        loading: true,
        progress: 0,
      };

      setImages((prev) => [placeholderImg, ...prev]);
      setSelectedImage(imgId);
      setCurrentGeneratingImgId(imgId);
      setCurrentProgress(0);

      try {
        const req: {
          prompt: string;
          referenceImageUrl?: string;
          referenceImageBase64?: string;
          referenceImageMimeType?: string;
        } = { prompt: action.prompt };

        // 如果 action 带有用户上传的图片，前端下载转 base64 传给生图 API
        if (action.imageUrls && action.imageUrls.length > 0) {
          try {
            const imgResp = await fetch(action.imageUrls[0]);
            const blob = await imgResp.blob();
            const mimeType = blob.type || "image/jpeg";
            const arrayBuffer = await blob.arrayBuffer();
            const base64 = btoa(
              new Uint8Array(arrayBuffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ""
              )
            );
            req.referenceImageBase64 = base64;
            req.referenceImageMimeType = mimeType;
          } catch {
            // 下载失败则回退传 URL
            req.referenceImageUrl = action.imageUrls[0];
          }
        }

        const res = await generateImgApi(req);
        console.log('[useChatImageGeneration] API 响应:', res);

        if (res.code !== 0 || !res.data) {
          const errorMsg = res.msg || "图片生成任务提交失败";

          // 移除占位图片
          setImages((prev) => prev.filter((img) => img.id !== imgId));
          setSelectedImage(null);
          setCurrentGeneratingImgId(null);

          if (msgId) {
            markMessageGenerating(msgId, false);
          }

          toast.error(errorMsg);
          currentMsgIdRef.current = undefined;
          return;
        }

        // 设置 jobId，触发轮询
        console.log('[useChatImageGeneration] 设置 jobId:', res.data.jobId);
        setJobId(res.data.jobId);
        toast.success("任务已提交，正在生成中...", {
          description: `任务ID: ${res.data.jobId}`,
        });
      } catch (error) {
        console.error('[useChatImageGeneration] 图片生成失败', error);

        // 移除占位图片
        setImages((prev) => prev.filter((img) => img.id !== imgId));
        setSelectedImage(null);
        setCurrentGeneratingImgId(null);

        if (msgId) {
          markMessageGenerating(msgId, false);
        }

        const errorMsg = error instanceof Error ? error.message : "图片生成失败";
        toast.error("提交失败", {
          description: errorMsg,
        });
        currentMsgIdRef.current = undefined;
      }
    },
    [markMessageGenerating, options]
  );

  const currentImage = images.find((img) => img.id === selectedImage);

  return {
    images,
    selectedImage,
    generatingMsgIds,
    lightboxUrl,
    setSelectedImage,
    setLightboxUrl,
    handleGenerateImage,
    markMessageGenerating,
    currentImage,
    currentProgress,
  };
}
