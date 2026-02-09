'use client';

import { useImageUploader } from '@/hooks/facesim';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  isLoading?: boolean;
}

export default function ImageUploader({ onUpload, isLoading }: ImageUploaderProps) {
  const {
    fileInputRef,
    videoRef,
    isCameraActive,
    startCamera,
    stopCamera,
    capturePhoto,
    handleFileSelect,
    triggerFileInput
  } = useImageUploader({ onUpload });

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!isCameraActive ? (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
            <button
              onClick={triggerFileInput}
              disabled={isLoading}
              className="px-6 py-3 bg-[#00A0E9] text-white rounded-lg hover:bg-[#0088c7] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '上传中...' : '选择图片'}
            </button>
          </div>
          <button
            onClick={startCamera}
            disabled={isLoading}
            className="w-full px-6 py-3 border-2 border-[#00A0E9] text-[#00A0E9] rounded-lg hover:bg-[#00A0E9] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            使用摄像头拍照
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <div className="flex gap-4">
            <button
              onClick={capturePhoto}
              className="flex-1 px-6 py-3 bg-[#00A0E9] text-white rounded-lg hover:bg-[#0088c7]"
            >
              拍照
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
