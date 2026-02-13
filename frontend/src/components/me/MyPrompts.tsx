"use client";

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
import { Plus, Edit2, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useMyPrompts } from "@/hooks/me/useMyPrompts";
import { useMyPromptsLogic } from "@/hooks/me/useMyPromptsLogic";
import { MEDICAL_AESTHETICS_CATEGORIES } from "@/type/medicalAesthetics";

/**
 * 我的提示词组件
 *
 * 用于管理用户个人的提示词
 */
export function MyPrompts() {
  const { prompts, pagination, loading, submitting, changePage, createPrompt, updatePrompt, deletePrompt } =
    useMyPrompts();

  const {
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    editingPrompt,
    deletingPrompt,
    formData,
    updateFormData,
    handleCreate,
    handleEdit,
    handleDeleteClick,
    closeDialog,
    closeDeleteDialog,
    getCategoryLabel,
    goToPage,
    goToPreviousPage,
    goToNextPage,
  } = useMyPromptsLogic(prompts, pagination, changePage);

  // 提交表单
  const handleSubmit = async () => {
    if (editingPrompt) {
      const success = await updatePrompt(editingPrompt.id, formData);
      if (success) {
        closeDialog();
      }
    } else {
      const success = await createPrompt(formData);
      if (success) {
        closeDialog();
      }
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (deletingPrompt) {
      const success = await deletePrompt(deletingPrompt.id);
      if (success) {
        closeDeleteDialog();
      }
    }
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

            {/* 分页控件 */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={pagination.page === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={pagination.page === page ? "default" : "ghost"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className={
                        pagination.page === page
                          ? "h-8 w-8 p-0 bg-[var(--rose-gold)] hover:bg-[var(--rose-gold)]/90 text-white"
                          : "h-8 w-8 p-0"
                      }
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={pagination.page === pagination.totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
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
                  updateFormData({ category: value as any })
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
                  updateFormData({ label: e.target.value })
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
                  updateFormData({ prompt: e.target.value })
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
                  updateFormData({ description: e.target.value })
                }
                placeholder="输入描述..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
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
      <Dialog open={deleteDialogOpen} onOpenChange={closeDeleteDialog}>
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
              onClick={closeDeleteDialog}
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
