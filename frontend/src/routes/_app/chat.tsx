import { createFileRoute } from "@tanstack/react-router";

import { useState, useEffect, Suspense, useMemo, useRef, useCallback } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAtomValue, useSetAtom } from "jotai";
import { tokenAtom, userInfoAtom } from "@/store/auth";
import ReactMarkdown from "react-markdown";
import {
  useChatMessages,
  useChatImageUpload,
  useChatImageGeneration,
  useChatInput,
} from "@/hooks/chat";
import { ChatAction } from "@/type/chat";


function ImageProgress({ loading }: { loading: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      setProgress(100);
      return;
    }
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timer);
          return 95;
        }
        // 前期快，后期慢
        const increment = prev < 30 ? 3 : prev < 60 ? 2 : prev < 80 ? 1 : 0.3;
        return Math.min(prev + increment, 95);
      });
    }, 500);
    return () => clearInterval(timer);
  }, [loading]);

  return (
    <span className="text-2xl font-light text-[#8090b8] tracking-wide">
      {Math.round(progress)}%
    </span>
  );
}

function ChatPageContent() {
  const navigate = useNavigate();
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const searchParams = useMemo(() => new URLSearchParams(searchStr), [searchStr]);
  const token = useAtomValue(tokenAtom);
  const setToken = useSetAtom(tokenAtom);
  const setUserInfo = useSetAtom(userInfoAtom);

  const initialSent = useRef(false);

  // 使用ref来存储updateMessage，避免循环依赖
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

  const handleLogout = () => {
    setToken(null);
    setUserInfo({ userId: 0, loginId: "", nickname: "", role: 0 });
    navigate({ to: "/" });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Left Chat Sidebar + Right Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat Sidebar */}
        <div className="w-130 flex-shrink-0 flex flex-col border-r border-[var(--warm-gray-light)]/20 bg-white/60">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3 px-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[var(--rose-gold)] to-[var(--rose-gold-light)] flex items-center justify-center">
                    <span className="text-white text-lg font-light">A</span>
                  </div>
                  <p className="text-[var(--warm-gray)] text-xs leading-relaxed">
                    你好！我是医美智能助手。<br />告诉我你的需求吧。
                  </p>
                  <div className="flex flex-col gap-1.5 mt-3">
                    {[
                      "我想改善面部皮肤状态",
                      "帮我做一张活动海报",
                      "玻尿酸和肉毒素的区别",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="w-full px-3 py-2 rounded-lg text-xs text-left bg-[var(--rose-gold-pale)]/50 border border-[var(--rose-gold-light)]/20 text-[var(--charcoal-light)] hover:bg-[var(--rose-gold-pale)] hover:border-[var(--rose-gold-light)]/40 transition-all cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] space-y-1.5">
                      {msg.imageUrls && msg.imageUrls.length > 0 && (
                        <div className="flex justify-end gap-1 flex-wrap">
                          {msg.imageUrls.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`上传图片 ${idx + 1}`}
                              onClick={() => setLightboxUrl(url)}
                              className="max-w-[160px] max-h-[120px] object-cover rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          ))}
                        </div>
                      )}
                      <div className="rounded-2xl rounded-tr-sm px-3 py-2 bg-gradient-to-r from-[var(--rose-gold)] to-[var(--rose-gold-light)] text-white text-xs leading-relaxed whitespace-pre-wrap break-words shadow-sm">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-[var(--rose-gold)] to-[var(--rose-gold-light)] flex items-center justify-center mt-0.5">
                      <span className="text-white text-[8px] font-medium">A</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      {msg.loading ? (
                        <div className="flex items-center gap-1.5 py-1">
                          <span className="text-xs text-[var(--warm-gray)] font-medium">思考中</span>
                          <span className="w-1 h-1 rounded-full bg-[var(--rose-gold-light)] animate-bounce" />
                          <span className="w-1 h-1 rounded-full bg-[var(--rose-gold-light)] animate-bounce" style={{ animationDelay: "0.15s" }} />
                          <span className="w-1 h-1 rounded-full bg-[var(--rose-gold-light)] animate-bounce" style={{ animationDelay: "0.3s" }} />
                        </div>
                      ) : (
                        <>
                          <div className="rounded-2xl rounded-tl-sm px-3 py-2 bg-white border border-[var(--warm-gray-light)]/20 shadow-sm">
                            <div className="text-xs leading-relaxed break-words text-[var(--charcoal)] prose prose-sm max-w-none prose-p:my-0.5 prose-headings:my-1.5 prose-headings:text-xs prose-headings:text-[var(--charcoal)] prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0 prose-pre:bg-[var(--cream-dark)] prose-pre:text-[10px] prose-pre:border prose-pre:border-[var(--warm-gray-light)]/20 prose-code:text-[var(--rose-gold)] prose-code:text-[10px] prose-strong:text-[var(--charcoal)] prose-a:text-[var(--rose-gold)]">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          </div>
                          {/* 生图中 - 渐变卡片 loading */}
                          {msg.generatingImage && (
                            <div className="mt-2 relative w-[220px] h-[160px] rounded-xl overflow-hidden bg-[#f0f0f8] shadow-sm">
                              <div className="absolute inset-0 animate-canvas-glow">
                                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[var(--rose-gold-pale)] opacity-60 blur-2xl" />
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-[var(--rose-gold-light)] opacity-30 blur-2xl" />
                              </div>
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <svg className="w-8 h-8 text-[#b0b8d0] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                  <rect x="3" y="3" width="18" height="18" rx="3" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16l5-5a2 2 0 012.8 0L15 15m-2-2l1.5-1.5a2 2 0 012.8 0L21 15" />
                                  <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
                                </svg>
                                <span className="text-xs text-[#8090b8]">生成中...</span>
                              </div>
                            </div>
                          )}
                          {/* 生图完成 - 显示图片 */}
                          {msg.generatedImageUrl && !msg.generatingImage && (
                            <img
                              src={msg.generatedImageUrl}
                              alt="生成图片"
                              onClick={() => setLightboxUrl(msg.generatedImageUrl!)}
                              className="mt-2 max-w-[240px] rounded-xl shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-[var(--warm-gray-light)]/20 p-3 bg-white/40">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            {pendingImage && (
              <div className="mb-2 flex items-center gap-2 px-1">
                <div className="relative group">
                  <img
                    src={pendingImage.preview}
                    alt="待发送图片"
                    className="w-14 h-14 object-cover rounded-lg border border-[var(--warm-gray-light)]/30 shadow-sm"
                  />
                  {pendingImage.uploading && (
                    <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  )}
                  <button
                    onClick={removePendingImage}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--charcoal)] text-white flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    ×
                  </button>
                </div>
                <span className="text-[10px] text-[var(--warm-gray-light)]">
                  {pendingImage.uploading ? "上传中..." : "图片已就绪"}
                </span>
              </div>
            )}
            <div className="rounded-xl border border-[var(--warm-gray-light)]/30 bg-white overflow-hidden focus-within:border-[var(--rose-gold-light)]/60 focus-within:shadow-sm transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={createKeyDownHandler(handleSend)}
                placeholder="输入你的需求..."
                rows={1}
                className="w-full px-3 pt-2.5 pb-1.5 bg-transparent text-[var(--charcoal)] text-xs placeholder:text-[var(--warm-gray-light)] resize-none outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between px-2.5 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!!pendingImage}
                    className="flex items-center justify-center w-6 h-6 rounded-md text-[var(--warm-gray)] hover:text-[var(--rose-gold)] hover:bg-[var(--rose-gold-pale)]/50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="上传图片"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                  </button>
                  <span className="text-[9px] text-[var(--warm-gray-light)]">
                    Enter 发送
                  </span>
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && !pendingImage?.url) || streaming || !!pendingImage?.uploading}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer ${
                    (input.trim() || pendingImage?.url) && !streaming && !pendingImage?.uploading
                      ? "bg-gradient-to-r from-[var(--rose-gold)] to-[var(--rose-gold-light)] text-white hover:opacity-90 shadow-sm"
                      : "bg-[var(--cream-dark)] text-[var(--warm-gray-light)] cursor-not-allowed"
                  }`}
                >
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--cream)]">
          {images.length === 0 && !currentImage ? (
            /* Empty Canvas State */
            (<div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-white border border-[var(--warm-gray-light)]/20 shadow-sm flex items-center justify-center">
                  <svg className="w-10 h-10 text-[var(--rose-gold-light)]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[var(--warm-gray)] font-light">画布</p>
                  <p className="text-xs text-[var(--warm-gray-light)] mt-1">
                    在左侧对话中生成图片，结果将展示在这里
                  </p>
                </div>
              </div>
            </div>)
          ) : (
            <>
              {/* Canvas Main Image */}
              <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                {currentImage ? (
                  currentImage.loading ? (
                    <div className="relative w-[400px] h-[500px] rounded-2xl overflow-hidden bg-[#f0f0f8] shadow-sm">
                      {/* 流动渐变光效 */}
                      <div className="absolute inset-0 animate-canvas-glow">
                        <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-[var(--rose-gold-pale)] opacity-60 blur-3xl" />
                        <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-[var(--rose-gold-light)] opacity-30 blur-3xl" />
                      </div>
                      {/* 中心内容 */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <svg className="w-14 h-14 text-[#b0b8d0] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16l5-5a2 2 0 012.8 0L15 15m-2-2l1.5-1.5a2 2 0 012.8 0L21 15" />
                          <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
                        </svg>
                        <ImageProgress loading={currentImage.loading} />
                      </div>
                    </div>
                  ) : currentImage.url ? (
                    <div className="max-w-full max-h-full flex flex-col items-center gap-4">
                      <img
                        src={currentImage.url}
                        alt="Generated"
                        onClick={() => setLightboxUrl(currentImage.url)}
                        className="max-w-[480px] max-h-[360px] object-contain rounded-xl shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
                      />
                      <div className="flex items-center gap-3">
                        <p className="text-[10px] text-[var(--warm-gray-light)] max-w-lg text-center line-clamp-2">
                          {currentImage.prompt}
                        </p>
                        <button
                          onClick={async () => {
                            try {
                              const resp = await fetch(currentImage.url);
                              const blob = await resp.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `generated-${currentImage.id}.png`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch {
                              window.open(currentImage.url, "_blank");
                            }
                          }}
                          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-[var(--warm-gray)] hover:text-[var(--rose-gold)] hover:bg-[var(--rose-gold-pale)]/50 border border-[var(--warm-gray-light)]/20 hover:border-[var(--rose-gold-light)]/40 transition-all cursor-pointer"
                          title="下载图片"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          下载
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <p className="text-sm text-[var(--warm-gray)]">生成失败</p>
                      <p className="text-xs text-[var(--warm-gray-light)]">请在对话中重新尝试</p>
                    </div>
                  )
                ) : null}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 0 && (
                <div className="flex-shrink-0 border-t border-[var(--warm-gray-light)]/20 bg-white/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-2 overflow-x-auto flex-1">
                      {images.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => setSelectedImage(img.id)}
                          className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            selectedImage === img.id
                              ? "border-[var(--rose-gold)] shadow-md"
                              : "border-[var(--warm-gray-light)]/30 hover:border-[var(--rose-gold-light)]"
                          }`}
                        >
                          {img.loading ? (
                            <div className="w-full h-full bg-[var(--cream-dark)] flex items-center justify-center">
                              <svg className="w-3 h-3 text-[var(--rose-gold-light)] animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            </div>
                          ) : img.url ? (
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[var(--cream-dark)] flex items-center justify-center">
                              <span className="text-[8px] text-[var(--warm-gray-light)]">失败</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {images.filter((img) => img.url && !img.loading).length > 0 && (
                      <button
                        onClick={async () => {
                          const downloadable = images.filter((img) => img.url && !img.loading);
                          for (let i = 0; i < downloadable.length; i++) {
                            try {
                              const resp = await fetch(downloadable[i].url);
                              const blob = await resp.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `generated-${downloadable[i].id}.png`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch {
                              window.open(downloadable[i].url, "_blank");
                            }
                            if (i < downloadable.length - 1) {
                              await new Promise((r) => setTimeout(r, 300));
                            }
                          }
                        }}
                        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-[var(--warm-gray)] hover:text-[var(--rose-gold)] hover:bg-[var(--rose-gold-pale)]/50 border border-[var(--warm-gray-light)]/20 hover:border-[var(--rose-gold-light)]/40 transition-all cursor-pointer"
                        title="批量下载所有图片"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        全部下载
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Lightbox 图片放大弹窗 */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="放大预览"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-lg hover:bg-white/40 transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[var(--cream)]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[var(--rose-gold)] to-[var(--rose-gold-light)] flex items-center justify-center animate-pulse">
            <span className="text-white text-lg font-light">A</span>
          </div>
          <p className="text-[var(--warm-gray)] text-xs">加载中...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}


export const Route = createFileRoute("/_app/chat")({
  component: ChatPage,
});
