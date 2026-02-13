import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  MedicalAestheticsTerm,
  MEDICAL_AESTHETICS_CATEGORIES,
} from "@/type/medicalAesthetics";
import {
  medicalAestheticsListApi,
  createMedicalAestheticsApi,
  updateMedicalAestheticsApi,
  deleteMedicalAestheticsApi,
} from "@/api/medicalAesthetics";
import { toast } from "sonner";

// 表单验证schema
const formSchema = z.object({
  category: z.enum(["skin", "face", "eyes", "nose", "lips", "poster", "other"]),
  label: z.string().min(1, "请输入选项名称"),
  prompt: z.string().min(1, "请输入提示词"),
  description: z.string().optional(),
});

export type FormData = z.infer<typeof formSchema>;

export function useMedicalAestheticsConfig() {
  const [terms, setTerms] = useState<MedicalAestheticsTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<MedicalAestheticsTerm | null>(
    null,
  );
  const [deletingTerm, setDeletingTerm] =
    useState<MedicalAestheticsTerm | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "skin",
      label: "",
      prompt: "",
      description: "",
    },
  });

  // 加载数据
  const loadTerms = async () => {
    try {
      setLoading(true);
      const response = await medicalAestheticsListApi();

      // API 直接返回数组: { code: 0, msg: "...", data: [...] }
      if (response.code === 0 && response.data) {
        setTerms(response.data);
      } else {
        setTerms([]);
        toast.error(response.msg || "加载失败");
      }
    } catch (error) {
      toast.error("加载失败");
      console.error("加载医美配置失败:", error);
      setTerms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  // 筛选后的数据
  const filteredTerms =
    selectedCategory === "all"
      ? terms
      : terms.filter((term) => term.category === selectedCategory);

  // 按类别分组
  const termsByCategory = MEDICAL_AESTHETICS_CATEGORIES.map((cat) => ({
    ...cat,
    items: filteredTerms.filter((term) => term.category === cat.id),
  }));

  // 打开创建对话框
  const handleCreate = () => {
    setEditingTerm(null);
    form.reset({
      category: "skin",
      label: "",
      prompt: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (term: MedicalAestheticsTerm) => {
    setEditingTerm(term);
    form.reset({
      category: term.category as any,
      label: term.label,
      prompt: term.prompt,
      description: term.description || "",
    });
    setIsDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      setSubmitting(true);

      if (editingTerm) {
        // 更新
        const response = await updateMedicalAestheticsApi(editingTerm.id, data);
        if (response.code === 0) {
          toast.success("更新成功");
        } else {
          toast.error(response.msg || "更新失败");
          return;
        }
      } else {
        // 创建
        const response = await createMedicalAestheticsApi(data);
        if (response.code === 0) {
          toast.success("创建成功");
        } else {
          toast.error(response.msg || "创建失败");
          return;
        }
      }

      setIsDialogOpen(false);
      loadTerms();
    } catch (error) {
      toast.error(editingTerm ? "更新失败" : "创建失败");
      console.error("提交失败:", error);
    } finally {
      setSubmitting(false);
    }
  });

  // 删除
  const handleDelete = async () => {
    if (!deletingTerm) return;

    try {
      const response = await deleteMedicalAestheticsApi(
        deletingTerm.id.toString(),
      );
      if (response.code === 0) {
        toast.success("删除成功");
        setDeletingTerm(null);
        loadTerms();
      } else {
        toast.error(response.msg || "删除失败");
      }
    } catch (error) {
      toast.error("删除失败");
      console.error("删除失败:", error);
    }
  };

  return {
    // 状态
    terms,
    loading,
    selectedCategory,
    isDialogOpen,
    editingTerm,
    deletingTerm,
    submitting,
    filteredTerms,
    termsByCategory,

    // 表单
    form,

    // 方法
    setSelectedCategory,
    setIsDialogOpen,
    setDeletingTerm,
    handleCreate,
    handleEdit,
    handleSubmit,
    handleDelete,
    loadTerms,
  };
}
