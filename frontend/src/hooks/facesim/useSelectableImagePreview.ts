import { useRef, useState, useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  originalImageAtom,
  editedImageAtom,
  selectedAreaAtom,
  isProcessingAtom,
  type RectangleSelection,
} from '@/store/facesim';
import { toast } from 'sonner';

export type ViewMode = 'single' | 'sideBySide' | 'slider';
export type DrawMode = 'rectangle' | 'freehand';

export interface UseSelectableImagePreviewReturn {
  // Atoms
  originalImage: ReturnType<typeof useAtomValue<typeof originalImageAtom>>;
  editedImage: ReturnType<typeof useAtomValue<typeof editedImageAtom>>;
  selectedArea: ReturnType<typeof useAtom<typeof selectedAreaAtom>>[0];
  setSelectedArea: ReturnType<typeof useAtom<typeof selectedAreaAtom>>[1];
  isProcessing: boolean;

  // Refs
  containerRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;

  // Draw mode
  drawMode: DrawMode;
  setDrawMode: (mode: DrawMode) => void;
  isDrawing: boolean;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Slider
  sliderPosition: number;
  isDraggingSlider: boolean;
  handleSliderMouseDown: (e: React.MouseEvent) => void;
  handleSliderMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSliderMouseUp: () => void;

  // Drawing
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: () => void;
  getCurrentDrawing: () =>
    | { type: 'rectangle'; rect: RectangleSelection }
    | { type: 'freehand'; points: Array<{ x: number; y: number }> }
    | null;

  // Actions
  handleClearSelection: () => void;
  handleDownload: (type: 'original' | 'edited') => Promise<void>;

  // Computed
  displayImage: string | undefined;
}

export function useSelectableImagePreview(): UseSelectableImagePreviewReturn {
  const originalImage = useAtomValue(originalImageAtom);
  const editedImage = useAtomValue(editedImageAtom);
  const [selectedArea, setSelectedArea] = useAtom(selectedAreaAtom);
  const isProcessing = useAtomValue(isProcessingAtom);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 绘制模式
  const [drawMode, setDrawMode] = useState<DrawMode>('freehand');
  const [isDrawing, setIsDrawing] = useState(false);

  // 矩形选择
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);

  // 自由绘制
  const [freehandPoints, setFreehandPoints] = useState<Array<{ x: number; y: number }>>([]);

  // 对比模式
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // 当前显示的图片（优先显示编辑后的图片）
  const displayImage = editedImage?.url || originalImage?.url;

  // 如果有编辑后的图片，自动切换到对比模式
  useEffect(() => {
    if (editedImage && originalImage) {
      setViewMode('sideBySide');
    } else if (!editedImage && originalImage) {
      setViewMode('single');
    }
  }, [editedImage, originalImage]);

  useEffect(() => {
    // 重置选区当图片改变时
    if (!displayImage) {
      setSelectedArea(null);
    }
  }, [displayImage, setSelectedArea]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!displayImage || isProcessing || viewMode !== 'single') return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);

    if (drawMode === 'rectangle') {
      setStartPoint({ x, y });
      setCurrentPoint({ x, y });
    } else {
      setFreehandPoints([{ x, y }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (drawMode === 'rectangle') {
      if (!startPoint) return;
      setCurrentPoint({ x, y });
    } else {
      setFreehandPoints((prev) => [...prev, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    if (drawMode === 'rectangle') {
      if (!startPoint || !currentPoint) return;

      const x = Math.min(startPoint.x, currentPoint.x);
      const y = Math.min(startPoint.y, currentPoint.y);
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.y - startPoint.y);

      if (width > 2 && height > 2) {
        setSelectedArea({
          type: 'rectangle',
          x,
          y,
          width,
          height,
        });
        toast.success('区域已选中');
      }

      setStartPoint(null);
      setCurrentPoint(null);
    } else {
      if (freehandPoints.length < 3) {
        toast.error('路径太短，请绘制更大的区域');
        setFreehandPoints([]);
      } else {
        const xs = freehandPoints.map((p) => p.x);
        const ys = freehandPoints.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        setSelectedArea({
          type: 'freehand',
          points: freehandPoints,
          boundingBox: {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          },
        });
        toast.success('区域已选中');
        setFreehandPoints([]);
      }
    }

    setIsDrawing(false);
  };

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingSlider(true);
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSlider) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleSliderMouseUp = () => {
    setIsDraggingSlider(false);
  };

  const handleClearSelection = () => {
    setSelectedArea(null);
    toast.info('已清除选区');
  };

  const handleDownload = async (type: 'original' | 'edited') => {
    const url = type === 'original' ? originalImage?.url : editedImage?.url;
    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `facesim-${type}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      toast.success('图片下载成功！');
    } catch (error) {
      toast.error('下载失败，请重试');
    }
  };

  const getCurrentDrawing = ():
    | { type: 'rectangle'; rect: RectangleSelection }
    | { type: 'freehand'; points: Array<{ x: number; y: number }> }
    | null => {
    if (!isDrawing) return null;

    if (drawMode === 'rectangle') {
      if (!startPoint || !currentPoint) return null;

      const x = Math.min(startPoint.x, currentPoint.x);
      const y = Math.min(startPoint.y, currentPoint.y);
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.y - startPoint.y);

      return {
        type: 'rectangle',
        rect: { type: 'rectangle', x, y, width, height },
      };
    } else {
      if (freehandPoints.length === 0) return null;
      return {
        type: 'freehand',
        points: freehandPoints,
      };
    }
  };

  return {
    // Atoms
    originalImage,
    editedImage,
    selectedArea,
    setSelectedArea,
    isProcessing,

    // Refs
    containerRef,
    canvasRef,

    // Draw mode
    drawMode,
    setDrawMode,
    isDrawing,

    // View mode
    viewMode,
    setViewMode,

    // Slider
    sliderPosition,
    isDraggingSlider,
    handleSliderMouseDown,
    handleSliderMove,
    handleSliderMouseUp,

    // Drawing
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getCurrentDrawing,

    // Actions
    handleClearSelection,
    handleDownload,

    // Computed
    displayImage,
  };
}
