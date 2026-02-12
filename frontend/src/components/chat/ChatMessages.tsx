import ReactMarkdown from "react-markdown";

interface ChatMessagesProps {
  messages: any[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onSend: (text: string) => void;
  setLightboxUrl: (url: string) => void;
}

export function ChatMessages({
  messages,
  messagesEndRef,
  onSend,
  setLightboxUrl,
}: ChatMessagesProps) {
  return (
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
                  onClick={() => onSend(q)}
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
                    {msg.imageUrls.map((url: string, idx: number) => (
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
  );
}
