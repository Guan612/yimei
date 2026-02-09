import { useState, useRef, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  originalImageAtom,
  selectedAreaAtom,
  editPromptAtom,
  isProcessingAtom,
  editedImageAtom,
  errorMessageAtom,
  type SelectionArea,
} from "@/store/facesim";
import { editImageApi } from "@/api/facesim";
import { toast } from "sonner";
import { medicalAestheticsListApi } from "@/api/medicalAesthetics";
import { MedicalAestheticsTerm } from "@/type/medicalAesthetics";

export interface UseFaceSimEditFormReturn {
  // Refs
  fileInputRef: React.RefObject<HTMLInputElement>;

  // State
  medicalAestheticsTerm: MedicalAestheticsTerm[] | undefined;
  originalImage: ReturnType<typeof useAtom<typeof originalImageAtom>>[0];
  selectedArea: ReturnType<typeof useAtomValue<typeof selectedAreaAtom>>;
  editPrompt: string;
  isProcessing: boolean;
  isDragging: boolean;
  selectedCategory: string;
  showTerms: boolean;
  includeLocationInPrompt: boolean;

  // Setters
  setEditPrompt: (value: string | ((prev: string) => string)) => void;
  setSelectedCategory: (category: string) => void;
  setShowTerms: (show: boolean) => void;
  setIncludeLocationInPrompt: (include: boolean) => void;

  // Handlers
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleGenerate: () => Promise<void>;
  handleReset: () => void;
  handleSelectTerm: (term: MedicalAestheticsTerm) => void;

  // Computed
  filteredTerms: MedicalAestheticsTerm[];
}

export function useFaceSimEditForm(): UseFaceSimEditFormReturn {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [medicalAestheticsTerm, setMedicalAestheticsTermLsit] =
    useState<MedicalAestheticsTerm[]>();

  const [originalImage, setOriginalImage] = useAtom(originalImageAtom);
  const selectedArea = useAtomValue(selectedAreaAtom);
  const [editPrompt, setEditPrompt] = useAtom(editPromptAtom);
  const [isProcessing, setIsProcessing] = useAtom(isProcessingAtom);
  const setEditedImage = useSetAtom(editedImageAtom);
  const setError = useSetAtom(errorMessageAtom);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("skin");
  const [showTerms, setShowTerms] = useState(false);
  const [includeLocationInPrompt, setIncludeLocationInPrompt] = useState(true);

  const getMedicalAestheticsTerm = async () => {
    const res = await medicalAestheticsListApi();
    if (res.code == 0 && res.data) {
      setMedicalAestheticsTermLsit(res.data);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片文件");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setOriginalImage({ url, file });
      setEditedImage(null);
      toast.success("图片上传成功");
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  useEffect(() => {
    getMedicalAestheticsTerm();
  }, [showTerms]);

  // 生成选区位置描述
  const getSelectionDescription = (area: SelectionArea): string => {
    if (!area) return "";

    if (area.type === "rectangle") {
      let position = "";
      if (area.x < 33) position = "左";
      else if (area.x > 66) position = "右";
      else position = "中";

      if (area.y < 33) position += "上";
      else if (area.y > 66) position += "下";
      else position += "中";

      return `聚焦于图片的${position}部位（位置: ${area.x.toFixed(0)}%, ${area.y.toFixed(0)}%，大小: ${area.width.toFixed(0)}% × ${area.height.toFixed(0)}%）`;
    } else {
      const bb = area.boundingBox;
      let position = "";
      if (bb.x < 33) position = "左";
      else if (bb.x > 66) position = "右";
      else position = "中";

      if (bb.y < 33) position += "上";
      else if (bb.y > 66) position += "下";
      else position += "中";

      return `聚焦于图片的${position}部位（自由选区，边界框: ${bb.x.toFixed(0)}%, ${bb.y.toFixed(0)}%，大小: ${bb.width.toFixed(0)}% × ${bb.height.toFixed(0)}%）`;
    }
  };

  const handleGenerate = async () => {
    if (!originalImage) {
      toast.error("请先上传图片");
      return;
    }

    if (!editPrompt.trim()) {
      toast.error("请输入编辑提示词");
      return;
    }

    if (!originalImage.file) {
      toast.error("图片文件丢失，请重新上传");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 如果没有选择区域，使用整张图片作为默认选区
      const effectiveSelection: SelectionArea = selectedArea || {
        type: "rectangle",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };

      const selectionDesc = includeLocationInPrompt && selectedArea
        ? getSelectionDescription(selectedArea)
        : "";
      const fullPrompt = selectionDesc
        ? `${selectionDesc}。${editPrompt.trim()}`
        : editPrompt.trim();

      const result = await editImageApi({
        imageFile: originalImage.file,
        selection: effectiveSelection,
        prompt: fullPrompt,
      });

      setEditedImage({
        url: result.imageUrl,
        timestamp: Date.now(),
      });

      toast.success("图片编辑成功！");
    } catch (error: any) {
      const errorMsg = error.message || "编辑失败";
      setError(errorMsg);
      toast.error("生成失败", {
        description: errorMsg,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setEditPrompt("");
    setError(null);
    toast.info("已重置");
  };

  const handleSelectTerm = (term: MedicalAestheticsTerm) => {
    setEditPrompt((prev) => {
      if (prev.trim()) {
        return `${prev}，${term.prompt}`;
      }
      return term.prompt;
    });
    toast.success(`已添加: ${term.label}`);
  };

  const filteredTerms = medicalAestheticsTerm
    ? medicalAestheticsTerm.filter((term) => term.category === selectedCategory)
    : [];

  return {
    // Refs
    fileInputRef,

    // State
    medicalAestheticsTerm,
    originalImage,
    selectedArea,
    editPrompt,
    isProcessing,
    isDragging,
    selectedCategory,
    showTerms,
    includeLocationInPrompt,

    // Setters
    setEditPrompt,
    setSelectedCategory,
    setShowTerms,
    setIncludeLocationInPrompt,

    // Handlers
    handleFileInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleGenerate,
    handleReset,
    handleSelectTerm,

    // Computed
    filteredTerms,
  };
}
