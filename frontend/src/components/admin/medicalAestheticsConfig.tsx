"use client";

import { MEDICAL_AESTHETICS_CATEGORIES } from "@/type/medicalAesthetics";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function MedicalAestheticsConfig() {
  const {
    terms,
    loading,
    selectedCategory,
    isDialogOpen,
    editingTerm,
    deletingTerm,
    submitting,
    filteredTerms,
    termsByCategory,
    form,
    setSelectedCategory,
    setIsDialogOpen,
    setDeletingTerm,
    handleCreate,
    handleEdit,
    handleSubmit,
    handleDelete,
  } = useMedicalAestheticsConfig();

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
            <h3 className="text-lg font-semibold">医美术语配置</h3>
            <p className="text-sm text-muted-foreground mt-1">
              共 {terms.length} 个配置项
            </p>
          </div>
          <Button onClick={handleCreate}>添加配置</Button>
        </div>

        {/* 分类筛选 */}
        <div className="flex gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择部位" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部部位</SelectItem>
              {MEDICAL_AESTHETICS_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 配置列表 */}
      {filteredTerms.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">暂无配置项</p>
          <Button className="mt-4" onClick={handleCreate}>
            添加第一个配置
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {termsByCategory.map((category) => {
            if (category.items.length === 0) return null;

            return (
              <div key={category.id} className="space-y-3">
                <h4 className="text-base font-semibold text-primary">
                  {category.label}
                </h4>
                <div className="grid gap-3">
                  {category.items.map((term) => (
                    <Card key={term.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-semibold">{term.label}</h5>
                            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                              {category.label}
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
              </div>
            );
          })}
        </div>
      )}

      {/* 创建/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTerm ? "编辑医美术语" : "添加医美术语"}
            </DialogTitle>
            <DialogDescription>
              {editingTerm
                ? "修改现有的医美术语配置"
                : "添加新的医美术语和提示词"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* 部位选择 */}
              <div className="grid gap-2">
                <Label htmlFor="category">部位 *</Label>
                <select
                  id="category"
                  {...form.register("category")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {MEDICAL_AESTHETICS_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {form.formState.errors.category && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.category.message}
                  </p>
                )}
              </div>

              {/* 选项名称 */}
              <div className="grid gap-2">
                <Label htmlFor="label">选项名称 *</Label>
                <Input
                  id="label"
                  {...form.register("label")}
                  placeholder="例如：美白提亮"
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
                <Input
                  id="prompt"
                  {...form.register("prompt")}
                  placeholder="例如：bright, fair skin"
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
              确定要删除术语 "{deletingTerm?.label}" 吗？此操作无法撤销。
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
