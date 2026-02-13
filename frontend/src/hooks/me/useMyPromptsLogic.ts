"use client";

import { useState } from "react";
import type {
  medicalAestheticsRespons,
  creatMedicalAesthetics,
  PaginationInfo,
} from "@/type/medicalAesthetics";
import { MEDICAL_AESTHETICS_CATEGORIES } from "@/type/medicalAesthetics";

/**
 * 我的提示词组件逻辑Hook
 * 处理对话框状态、表单状态等UI逻辑
 */
export function useMyPromptsLogic(
  prompts: medicalAestheticsRespons[],
  pagination: PaginationInfo | null,
  changePage: (page: number) => Promise<void>
) {
  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<medicalAestheticsRespons | null>(null);
  const [deletingPrompt, setDeletingPrompt] = useState<medicalAestheticsRespons | null>(null);

  // 表单状态
  const [formData, setFormData] = useState<creatMedicalAesthetics>({
    category: "skin",
    label: "",
    prompt: "",
    description: "",
  });

  // 打开新建对话框
  const handleCreate = () => {
    setEditingPrompt(null);
    setFormData({
      category: "skin",
      label: "",
      prompt: "",
      description: "",
    });
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (prompt: medicalAestheticsRespons) => {
    setEditingPrompt(prompt);
    setFormData({
      category: prompt.category as any,
      label: prompt.label,
      prompt: prompt.prompt,
      description: prompt.description || "",
    });
    setDialogOpen(true);
  };

  // 打开删除对话框
  const handleDeleteClick = (prompt: medicalAestheticsRespons) => {
    setDeletingPrompt(prompt);
    setDeleteDialogOpen(true);
  };

  // 关闭对话框
  const closeDialog = () => {
    setDialogOpen(false);
  };

  // 关闭删除对话框
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingPrompt(null);
  };

  // 更新表单数据
  const updateFormData = (data: Partial<creatMedicalAesthetics>) => {
    setFormData({ ...formData, ...data });
  };

  // 获取分类标签
  const getCategoryLabel = (category: string) => {
    return (
      MEDICAL_AESTHETICS_CATEGORIES.find((c) => c.id === category)?.label ||
      category
    );
  };

  // 页面跳转
  const goToPage = (page: number) => {
    if (pagination && page >= 1 && page <= pagination.totalPages) {
      changePage(page);
    }
  };

  // 上一页
  const goToPreviousPage = () => {
    if (pagination && pagination.page > 1) {
      changePage(pagination.page - 1);
    }
  };

  // 下一页
  const goToNextPage = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      changePage(pagination.page + 1);
    }
  };

  return {
    // 对话框状态
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    editingPrompt,
    deletingPrompt,

    // 表单状态
    formData,
    updateFormData,

    // 分页信息（从后端返回的）
    pagination,

    // 操作函数
    handleCreate,
    handleEdit,
    handleDeleteClick,
    closeDialog,
    closeDeleteDialog,
    getCategoryLabel,
    goToPage,
    goToPreviousPage,
    goToNextPage,
  };
}
