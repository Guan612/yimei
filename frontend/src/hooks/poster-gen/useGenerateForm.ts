import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";
import { useImageGeneration } from "./useImageGeneration";
import { usePromptTerms } from "./usePromptTerms";
import { useProviderInfo } from "./useProviderInfo";
import type { GenerateImageRequest } from "@/type/imagegen";

// 使用 Zod 定义表单 schema
export const formSchema = z.object({
  prompt: z.string().min(1, "请输入提示词").max(2000, "提示词不能超过2000字符"),
  negativePrompt: z.string().max(2000, "负面提示词不能超过2000字符").optional(),
  promptInjectPosition: z.enum(["prepend", "append"]),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]),
  steps: z.number().int().min(10, "最少10步").max(150, "最多150步"),
  cfgScale: z.number().min(1, "最小值为1").max(20, "最大值为20"),
  // Gemini 参数 - 定义为可选字符串，在提交时处理
  imageSize: z.string().optional(),
  // OpenAI 参数 - 定义为可选字符串，在提交时处理
  quality: z.string().optional(),
  outputFormat: z.string().optional(),
  outputCompression: z.number().int().min(0, "最小值为0").max(100, "最大值为100").optional(),
  background: z.string().optional(),
});

// 从 schema 推导类型
export type FormData = z.infer<typeof formSchema>;

export function useGenerateForm() {
  // 图片生成相关
  const { generate, isGenerating, progress, cancel } = useImageGeneration();

  // Provider 信息
  const {
    selectedProviderId,
    isGeminiProvider,
    isOpenAIProvider,
    isGPTImageModel,
    isDallE3,
  } = useProviderInfo();

  // 提示词库管理
  const {
    filteredTerms,
    loadingTerms,
    promptInjectIds,
    injectSearch,
    setInjectSearch,
    toggleInjectId,
    clearSelection,
    selectFiltered,
  } = usePromptTerms();

  // 高级选项显示状态
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 使用 react-hook-form + Zod resolver
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      negativePrompt: "",
      promptInjectPosition: "prepend",
      aspectRatio: "1:1",
      steps: 30,
      cfgScale: 7,
      outputCompression: 100,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  // 监听表单值
  const outputFormat = watch("outputFormat");
  const steps = watch("steps");
  const cfgScale = watch("cfgScale");
  const outputCompression = watch("outputCompression");

  // 表单提交处理
  const onSubmit = async (data: FormData) => {
    console.log('=== Form Submit ===', data);
    console.log('selectedProviderId:', selectedProviderId);
    console.log('promptInjectIds:', promptInjectIds);

    // 辅助函数：将空字符串转换为 undefined
    const emptyToUndefined = <T>(value: string | undefined): T | undefined => {
      return value && value !== "" ? (value as T) : undefined;
    };

    const requestData: GenerateImageRequest = {
      prompt: data.prompt.trim(),
      negativePrompt: data.negativePrompt?.trim() || undefined,
      configId: selectedProviderId,
      aspectRatio: data.aspectRatio,
      steps: data.steps,
      cfgScale: data.cfgScale,
      // 图片质量和分辨率参数 - 将空字符串转换为 undefined
      imageSize: emptyToUndefined<"1K" | "2K" | "4K">(data.imageSize),
      quality: emptyToUndefined<"auto" | "high" | "medium" | "low" | "hd" | "standard">(data.quality),
      outputFormat: emptyToUndefined<"png" | "jpeg" | "webp">(data.outputFormat),
      outputCompression: data.outputCompression,
      background: emptyToUndefined<"transparent" | "opaque" | "auto">(data.background),
      ...(promptInjectIds.length > 0
        ? {
            promptInjectIds,
            promptInjectPosition: data.promptInjectPosition,
          }
        : {}),
    };

    console.log('requestData:', requestData);
    await generate(requestData);
  };

  // 处理表单提交错误
  const onError = (errors: any) => {
    console.log('=== Form Validation Errors ===', errors);
  };

  // 组合handleSubmit
  const onFormSubmit = handleSubmit(onSubmit, onError);

  // 切换高级选项显示
  const toggleAdvanced = () => setShowAdvanced(!showAdvanced);

  return {
    // 表单相关
    register,
    onFormSubmit,
    errors,

    // 监听的表单值
    outputFormat,
    steps,
    cfgScale,
    outputCompression,

    // 生成状态
    isGenerating,
    progress,
    cancel,

    // Provider 信息
    isGeminiProvider,
    isOpenAIProvider,
    isGPTImageModel,
    isDallE3,

    // 提示词库
    filteredTerms,
    loadingTerms,
    promptInjectIds,
    injectSearch,
    setInjectSearch,
    toggleInjectId,
    clearSelection,
    selectFiltered,

    // 高级选项
    showAdvanced,
    toggleAdvanced,
  };
}
