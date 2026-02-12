interface ChatInputProps {
  input: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  pendingImage: any;
  streaming: boolean;
  handleTextareaInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  createKeyDownHandler: (onSend: () => void) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePendingImage: () => void;
  handleSend: () => void;
}

export function ChatInput({
  input,
  textareaRef,
  fileInputRef,
  pendingImage,
  streaming,
  handleTextareaInput,
  createKeyDownHandler,
  handleImageSelect,
  removePendingImage,
  handleSend,
}: ChatInputProps) {
  return (
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
            onClick={handleSend}
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
  );
}
