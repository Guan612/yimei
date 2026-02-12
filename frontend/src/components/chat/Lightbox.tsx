interface LightboxProps {
  lightboxUrl: string | null;
  onClose: () => void;
}

export function Lightbox({ lightboxUrl, onClose }: LightboxProps) {
  if (!lightboxUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-8 cursor-pointer"
      onClick={onClose}
    >
      <img
        src={lightboxUrl}
        alt="放大预览"
        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-lg hover:bg-white/40 transition-colors cursor-pointer"
      >
        ×
      </button>
    </div>
  );
}
