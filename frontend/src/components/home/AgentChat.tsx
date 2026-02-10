"use client";

import { useState, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { tokenAtom } from "@/store/auth";
import { uploadFileApi, getFileUrlApi } from "@/api/upload";

const MAX_IMAGES = 5;

interface PendingImage {
  id: string;
  preview: string;
  url?: string;
  uploading: boolean;
}

const quickTags = [
  { label: "美学咨询", text: "我想改善面部皮肤状态" },
  { label: "祛斑方案", text: "我脸上有色斑，想了解祛斑方案" },
  { label: "活动海报", text: "帮我做一张春节医美活动海报" },
  { label: "双眼皮模拟", text: "我想做双眼皮，帮我模拟效果" },
  { label: "项目对比", text: "玻尿酸和肉毒素有什么区别" },
];

export function AgentChat() {
  const navigate = useNavigate();
  const token = useAtomValue(tokenAtom);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const hasUploading = pendingImages.some((img) => img.uploading);
  const allReady = pendingImages.length > 0 && pendingImages.every((img) => !img.uploading && img.url);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";

    const remaining = MAX_IMAGES - pendingImages.length;
    const toAdd = files.slice(0, remaining);

    for (const file of toAdd) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const preview = URL.createObjectURL(file);
      setPendingImages((prev) => [...prev, { id, preview, uploading: true }]);

      (async () => {
        try {
          const fileId = await uploadFileApi(file);
          const urlRes = await getFileUrlApi(fileId);
          if (urlRes.code === 0 && urlRes.data) {
            setPendingImages((prev) =>
              prev.map((img) =>
                img.id === id ? { ...img, url: urlRes.data!.url, uploading: false } : img
              )
            );
          } else {
            setPendingImages((prev) =>
              prev.map((img) =>
                img.id === id ? { ...img, uploading: false } : img
              )
            );
          }
        } catch {
          setPendingImages((prev) =>
            prev.map((img) =>
              img.id === id ? { ...img, uploading: false } : img
            )
          );
        }
      })();
    }
  }, [pendingImages.length]);

  const removePendingImage = useCallback((id: string) => {
    setPendingImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const handleGo = (text?: string) => {
    const message = (text || input).trim();
    const readyUrls = pendingImages.filter((img) => img.url).map((img) => img.url!);
    if (!message && readyUrls.length === 0) return;
    if (hasUploading) return;

    if (!token) {
      navigate({ to: "/login" });
      return;
    }

    const params = new URLSearchParams();
    if (message) params.set("q", message);
    if (readyUrls.length > 0) params.set("imgs", readyUrls.join(","));

    for (const img of pendingImages) {
      if (img.preview) URL.revokeObjectURL(img.preview);
    }
    setPendingImages([]);

    navigate({ to: `/chat?${params.toString()}` });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGo();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* 输入框区域 */}
      <div className="relative rounded-2xl border border-[var(--warm-gray-light)]/30 bg-white/80 backdrop-blur-md shadow-xl overflow-hidden transition-all hover:shadow-2xl hover:border-[var(--rose-gold-light)]/40">
        {/* 图片预览区域 */}
        {pendingImages.length > 0 && (
          <div className="px-5 pt-4 pb-1 flex items-start gap-2 flex-wrap">
            {pendingImages.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.preview}
                  alt="待发送图片"
                  className="w-16 h-16 object-cover rounded-lg border border-[var(--warm-gray-light)]/30 shadow-sm"
                />
                {img.uploading && (
                  <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => removePendingImage(img.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--charcoal)]/80 text-white flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))}
            {allReady && (
              <span className="text-[10px] text-[var(--warm-gray-light)] self-end mb-1">
                {pendingImages.length}张图片已就绪
              </span>
            )}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder={pendingImages.length > 0 ? "描述你想对这些图片做什么..." : "告诉我你的需求，如美学咨询、海报设计、医美问答..."}
          rows={pendingImages.length > 0 ? 2 : 3}
          className="w-full px-6 pt-5 pb-3 bg-transparent text-[var(--charcoal)] text-base placeholder:text-[var(--warm-gray-light)] resize-none outline-none leading-relaxed"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />

        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={pendingImages.length >= MAX_IMAGES}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--cream-dark)]/60 text-[var(--warm-gray)] hover:text-[var(--rose-gold)] hover:bg-[var(--rose-gold-pale)]/50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={pendingImages.length >= MAX_IMAGES ? `最多上传${MAX_IMAGES}张图片` : "上传图片"}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
            <span className="text-[10px] text-[var(--warm-gray-light)] tracking-wide">
              {pendingImages.length > 0
                ? `${pendingImages.length}/${MAX_IMAGES} 张`
                : "Enter 开始对话"}
            </span>
          </div>

          <button
            onClick={() => handleGo()}
            disabled={(!input.trim() && !allReady) || hasUploading}
            className={`
              flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer
              ${
                (input.trim() || allReady) && !hasUploading
                  ? "bg-[var(--rose-gold)] text-white hover:bg-[var(--rose-gold-dark)] shadow-sm hover:shadow-md"
                  : "bg-[var(--warm-gray-light)]/20 text-[var(--warm-gray-light)] cursor-not-allowed"
              }
            `}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
            开始对话
          </button>
        </div>
      </div>

      {/* 快捷标签 */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        {quickTags.map((tag) => (
          <button
            key={tag.label}
            onClick={() => handleGo(tag.text)}
            className="
              flex items-center gap-1 px-3 py-1.5 rounded-full text-xs
              bg-white/60 backdrop-blur-sm border border-[var(--warm-gray-light)]/20
              text-[var(--warm-gray)] hover:text-[var(--rose-gold)] hover:border-[var(--rose-gold-light)]/40
              hover:bg-white/80 transition-all cursor-pointer
            "
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}
