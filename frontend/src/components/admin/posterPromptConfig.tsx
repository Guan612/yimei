"use client";

import { useMedicalAestheticsConfig } from "@/hooks/admin/useMedicalAestheticsConfig";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect } from "react";

export function PosterPromptConfig() {
  const {
    terms,
    loading,
    isDialogOpen,
    editingTerm,
    deletingTerm,
    submitting,
    form,
    setIsDialogOpen,
    setDeletingTerm,
    handleCreate,
    handleEdit,
    handleSubmit,
    handleDelete,
  } = useMedicalAestheticsConfig();

  // 强制将 category 设置为 poster
  useEffect(() => {
    form.setValue("category", "poster");
  }, [isDialogOpen, form]);

  // 只显示 poster 类别的数据
  const posterTerms = terms.filter((term) => term.category === "poster");

  // 加载中状态
  if (loading && terms.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">海报提示词配置</h3>
            <p className="text-sm text-muted-foreground mt-1">
              共 {posterTerms.length} 个配置项
            </p>
          </div>
          <Button onClick={handleCreate}>添加配置</Button>
        </div>
      </div>

      {/* 配置列表 */}
      {posterTerms.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">暂无配置项</p>
          <Button className="mt-4" onClick={handleCreate}>
            添加第一个配置
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {posterTerms.map((term) => (
            <Card key={term.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-semibold">{term.label}</h5>
                    <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                      海报提示词
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    提示词: {term.prompt}
                  </p>
                  {term.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {term.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(term)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeletingTerm(term)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 创建/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTerm ? "编辑海报提示词" : "添加海报提示词"}
            </DialogTitle>
            <DialogDescription>
              {editingTerm
                ? "修改现有的海报提示词配置"
                : "添加新的海报提示词和描述"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* 隐藏的 category 字段 */}
              <input type="hidden" {...form.register("category")} value="poster" />

              {/* 选项名称 */}
              <div className="grid gap-2">
                <Label htmlFor="label">选项名称 *</Label>
                <Input
                  id="label"
                  {...form.register("label")}
                  placeholder="例如：科技风格"
                />
                {form.formState.errors.label && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.label.message}
                  </p>
                )}
              </div>

              {/* 提示词 */}
              <div className="grid gap-2">
                <Label htmlFor="prompt">提示词 *</Label>
                <Textarea
                  id="prompt"
                  {...form.register("prompt")}
                  placeholder="例如：futuristic, tech style, modern design"
                  rows={3}
                />
                {form.formState.errors.prompt && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.prompt.message}
                  </p>
                )}
              </div>

              {/* 描述信息 */}
              <div className="grid gap-2">
                <Label htmlFor="description">描述信息</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="配置说明（可选）"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? editingTerm
                    ? "更新中..."
                    : "创建中..."
                  : editingTerm
                    ? "更新"
                    : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!deletingTerm}
        onOpenChange={(open) => !open && setDeletingTerm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除提示词 "{deletingTerm?.label}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
