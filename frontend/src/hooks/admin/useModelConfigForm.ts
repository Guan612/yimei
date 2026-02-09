import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ModelConfig, CreateModelConfigDto } from "@/type/modelconfig";

// Zod验证Schema
const modelConfigSchema = z.object({
  name: z.string().min(1, "配置名称不能为空"),
  provider: z.enum(["openai", "stability", "aliyun", "gemini"], {
    required_error: "请选择Provider类型",
  }),
  type: z.enum(["image-gen", "text-gen", "embedding"], {
    required_error: "请选择服务类型",
  }),
  modelId: z.string().optional(),
  baseUrl: z.string().min(1, "API基础URL不能为空").url("请输入有效的URL"),
  apiKey: z.string().min(1, "API Key不能为空"),
  enabled: z.boolean().default(true),
  priority: z.coerce.number().int().default(0),
  description: z.string().optional(),
});

type ModelConfigFormData = z.infer<typeof modelConfigSchema>;

export interface UseModelConfigFormReturn {
  // 对话框状态
  isOpen: boolean;
  open: () => void;
  close: () => void;

  // 编辑模式
  editingConfig: ModelConfig | null;
  isEditMode: boolean;

  // react-hook-form实例
  form: ReturnType<typeof useForm<ModelConfigFormData>>;

  // 操作
  startCreate: () => void;
  startEdit: (config: ModelConfig) => void;
  getFormData: () => CreateModelConfigDto;
}

const defaultValues: ModelConfigFormData = {
  name: "",
  provider: "openai",
  type: "" as any,
  baseUrl: "",
  apiKey: "",
  enabled: true,
  priority: 0,
  description: "",
};

export function useModelConfigForm(): UseModelConfigFormReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ModelConfig | null>(null);

  // 使用react-hook-form
  const form = useForm<ModelConfigFormData>({
    resolver: zodResolver(modelConfigSchema),
    defaultValues,
  });

  const open = () => setIsOpen(true);

  const close = () => {
    setIsOpen(false);
    setEditingConfig(null);
    form.reset(defaultValues);
  };

  const startCreate = () => {
    setEditingConfig(null);
    form.reset(defaultValues);
    open();
  };

  const startEdit = (config: ModelConfig) => {
    setEditingConfig(config);
    form.reset({
      name: config.name,
      provider: config.provider,
      type: config.type,
      modelId: config.modelId || "",
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      enabled: config.enabled,
      priority: config.priority,
      description: config.description || "",
    });
    open();
  };

  const getFormData = (): CreateModelConfigDto => {
    const values = form.getValues();
    return {
      name: values.name,
      provider: values.provider,
      type: values.type,
      modelId: values.modelId || undefined,
      baseUrl: values.baseUrl,
      apiKey: values.apiKey,
      enabled: values.enabled,
      priority: values.priority,
      description: values.description || undefined,
    };
  };

  return {
    isOpen,
    open,
    close,
    editingConfig,
    isEditMode: !!editingConfig,
    form,
    startCreate,
    startEdit,
    getFormData,
  };
}
