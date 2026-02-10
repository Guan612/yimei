"use client";

import { useState, useCallback } from "react";
import { generateImgApi } from "@/api/imagegen";
import type { ImageGenerationResponse } from "@/type/imagegen";
import type { ChatAction } from "@/api/chat";

/**
 * 生成的图片信息
 */
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  loading?: boolean;
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
}

/**
 * 聊天图片生成Hook
 *
 * 封装AI图片生成、图片列表管理、Lightbox等逻辑
 *
 * @example
 * ```tsx
 * const {
 *   images,
 *   selectedImage,
 *   handleGenerateImage,
 *   setSelectedImage,
 *   currentImage
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

  const handleGenerateImage = useCallback(
    async (action: ChatAction, msgId?: string) => {
      // 标记消息正在生图
      if (msgId) {
        markMessageGenerating(msgId, true);
      }

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
        if (res.code === 0 && res.data) {
          const data = res.data as ImageGenerationResponse;
          // 生图完成后才加入 images 数组并选中
          const imgId = Date.now().toString();
          const newImg: GeneratedImage = {
            id: imgId,
            url: data.imageUrl,
            prompt: action.prompt,
            loading: false,
          };
          setImages((prev) => [newImg, ...prev]);
          setSelectedImage(imgId);

          // 回调通知外部
          if (options?.onImageGenerated) {
            options.onImageGenerated(data.imageUrl, msgId);
          }

          return data.imageUrl;
        }
      } catch (error) {
        console.error("图片生成失败", error);
      } finally {
        if (msgId) {
          markMessageGenerating(msgId, false);
        }
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
  };
}
