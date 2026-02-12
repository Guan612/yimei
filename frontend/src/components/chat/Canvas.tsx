import { ImageProgress } from "./ImageProgress";

interface CanvasProps {
  images: any[];
  currentImage: any;
  selectedImage: string | null;
  setSelectedImage: (id: string) => void;
  setLightboxUrl: (url: string) => void;
}

export function Canvas({
  images,
  currentImage,
  selectedImage,
  setSelectedImage,
  setLightboxUrl,
}: CanvasProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--cream)]">
      {images.length === 0 && !currentImage ? (
        /* Empty Canvas State */
        <div className="flex-1 flex items-center justify-center">
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
        </div>
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
                  {images.map((img: any) => (
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
                {images.filter((img: any) => img.url && !img.loading).length > 0 && (
                  <button
                    onClick={async () => {
                      const downloadable = images.filter((img: any) => img.url && !img.loading);
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
  );
}
