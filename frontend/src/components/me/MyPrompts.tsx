"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { useMyPrompts } from "@/hooks/me/useMyPrompts";
import {
  MEDICAL_AESTHETICS_CATEGORIES,
  type medicalAestheticsRespons,
  type creatMedicalAesthetics,
} from "@/type/medicalAesthetics";

/**
 * 我的提示词组件
 *
 * 用于管理用户个人的提示词
 */
export function MyPrompts() {
  const { prompts, loading, submitting, createPrompt, updatePrompt, deletePrompt } =
    useMyPrompts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<medicalAestheticsRespons | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPrompt, setDeletingPrompt] = useState<medicalAestheticsRespons | null>(
    null
  );

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

  // 提交表单
  const handleSubmit = async () => {
    if (editingPrompt) {
      const success = await updatePrompt(editingPrompt.id, formData);
      if (success) {
        setDialogOpen(false);
      }
    } else {
      const success = await createPrompt(formData);
      if (success) {
        setDialogOpen(false);
      }
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (deletingPrompt) {
      const success = await deletePrompt(deletingPrompt.id);
      if (success) {
        setDeleteDialogOpen(false);
        setDeletingPrompt(null);
      }
    }
  };

  // 获取分类标签
  const getCategoryLabel = (category: string) => {
    return (
      MEDICAL_AESTHETICS_CATEGORIES.find((c) => c.id === category)?.label ||
      category
    );
  };

  return (
    <>
      <Card className="card-elegant rounded-2xl p-8 opacity-0 animate-fade-up delay-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg text-[var(--charcoal)] font-light">
            我的提示词
          </h3>
          <Button
            onClick={handleCreate}
            size="sm"
            className="gap-2 bg-[var(--rose-gold)] hover:bg-[var(--rose-gold)]/90 text-white"
          >
            <Plus className="w-4 h-4" />
            新建提示词
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--rose-gold)]" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--warm-gray)] text-sm">
              暂无提示词，点击上方按钮创建
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="p-4 rounded-xl border border-[var(--warm-gray-light)]/30 hover:border-[var(--rose-gold)] hover:bg-[var(--rose-gold-pale)]/30 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-[var(--rose-gold-pale)] text-[var(--rose-gold)] text-xs">
                        {getCategoryLabel(prompt.category)}
                      </span>
                      <h4 className="text-sm font-medium text-[var(--charcoal)]">
                        {prompt.label}
                      </h4>
                    </div>
                    <p className="text-sm text-[var(--warm-gray)] line-clamp-2">
                      {prompt.prompt}
                    </p>
                    {prompt.description && (
                      <p className="text-xs text-[var(--warm-gray)]/70">
                        {prompt.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(prompt)}
                      className="h-8 w-8 p-0 hover:bg-[var(--rose-gold-pale)] hover:text-[var(--rose-gold)]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(prompt)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 新建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? "编辑提示词" : "新建提示词"}
            </DialogTitle>
            <DialogDescription>
              {editingPrompt
                ? "编辑您的个人提示词信息"
                : "创建一个新的个人提示词"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">分类</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICAL_AESTHETICS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="label">标签名称</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
                placeholder="例如：双眼皮、隆鼻..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prompt">提示词</Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) =>
                  setFormData({ ...formData, prompt: e.target.value })
                }
                placeholder="输入提示词内容..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">描述（可选）</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="输入描述..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                submitting || !formData.label || !formData.prompt
              }
              className="bg-[var(--rose-gold)] hover:bg-[var(--rose-gold)]/90 text-white"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPrompt ? "更新" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除提示词「{deletingPrompt?.label}」吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingPrompt(null);
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
