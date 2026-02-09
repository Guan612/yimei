'use client';

import { useBeforeAfterSlider } from '@/hooks/facesim';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  mode?: 'slider' | 'sideBySide';
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  mode = 'slider'
}: BeforeAfterSliderProps) {
  const {
    sliderPosition,
    containerRef,
    handleMouseDown,
    handleTouchStart,
  } = useBeforeAfterSlider();

  if (mode === 'sideBySide') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-center text-sm text-gray-600 mb-2">治疗前</p>
          <img src={beforeImage} alt="治疗前" className="w-full rounded-lg" />
        </div>
        <div>
          <p className="text-center text-sm text-gray-600 mb-2">模拟效果</p>
          <img src={afterImage} alt="模拟效果" className="w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/4] overflow-hidden rounded-lg cursor-ew-resize select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <img
        src={beforeImage}
        alt="治疗前"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={afterImage}
          alt="模拟效果"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-[#00A0E9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
        治疗前
      </div>
      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
        模拟效果
      </div>
    </div>
  );
}
