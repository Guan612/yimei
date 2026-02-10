"use client";

import { useState, useCallback, useRef } from "react";
import { uploadFileApi, getFileUrlApi } from "@/api/upload";

/**
 * 待上传图片信息
 */
export interface PendingImage {
  file: File;
  preview: string;
  url?: string;
  uploading: boolean;
}

/**
 * 图片上传Hook返回类型
 */
export interface UseChatImageUploadReturn {
  /** 待上传的图片 */
  pendingImage: PendingImage | null;
  /** 文件输入ref */
  fileInputRef: React.RefObject<HTMLInputElement>;
  /** 处理图片选择 */
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  /** 移除待上传图片 */
  removePendingImage: () => void;
  /** 触发文件选择 */
  triggerFileSelect: () => void;
}

/**
 * 聊天图片上传Hook
 *
 * 封装图片上传、预览、移除等逻辑
 *
 * @example
 * ```tsx
 * const {
 *   pendingImage,
 *   fileInputRef,
 *   handleImageSelect,
 *   removePendingImage,
 *   triggerFileSelect
 * } = useChatImageUpload();
 *
 * // 在JSX中使用
 * <input ref={fileInputRef} type="file" onChange={handleImageSelect} />
 * <button onClick={triggerFileSelect}>上传图片</button>
 * ```
 */
export function useChatImageUpload(): UseChatImageUploadReturn {
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 重置 input 以便重复选择同一文件
      e.target.value = "";

      const preview = URL.createObjectURL(file);
      setPendingImage({ file, preview, uploading: true });

      try {
        const fileId = await uploadFileApi(file);
        const urlRes = await getFileUrlApi(fileId);
        if (urlRes.code === 0 && urlRes.data) {
          setPendingImage((prev) =>
            prev ? { ...prev, url: urlRes.data!.url, uploading: false } : null
          );
        } else {
          setPendingImage((prev) =>
            prev ? { ...prev, uploading: false } : null
          );
        }
      } catch {
        setPendingImage((prev) =>
          prev ? { ...prev, uploading: false } : null
        );
      }
    },
    []
  );

  const removePendingImage = useCallback(() => {
    if (pendingImage?.preview) {
      URL.revokeObjectURL(pendingImage.preview);
    }
    setPendingImage(null);
  }, [pendingImage]);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    pendingImage,
    fileInputRef,
    handleImageSelect,
    removePendingImage,
    triggerFileSelect,
  };
}
