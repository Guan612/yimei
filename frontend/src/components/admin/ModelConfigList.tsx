"use client";

import {
  useModelConfigList,
  useModelConfigForm,
  useModelConfigCRUD,
  useDeleteDialog,
} from "@/hooks/admin";
import type { ModelConfig } from "@/type/modelconfig";
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
import { Switch } from "@/components/ui/switch";
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

export function ModelConfigList() {
  // 使用hooks管理列表数据
  const list = useModelConfigList();

  // 使用hooks管理表单 (react-hook-form)
  const formDialog = useModelConfigForm();

  // 使用hooks管理CRUD操作
  const crud = useModelConfigCRUD({
    onSuccess: () => {
      list.reload();
    },
  });

  // 使用hooks管理删除确认对话框
  const deleteDialog = useDeleteDialog<ModelConfig>({
    onDelete: async (config) => {
      return await crud.remove(config.id);
    },
    onSuccess: () => {
      list.reload();
    },
  });

  // 提交表单(创建或更新) - 使用react-hook-form
  const handleSubmit = formDialog.form.handleSubmit(async () => {
    const formData = formDialog.getFormData();

    let success: boolean;
    if (formDialog.isEditMode && formDialog.editingConfig) {
      success = await crud.update(formDialog.editingConfig.id, formData);
    } else {
      success = await crud.create(formData);
    }

    if (success) {
      formDialog.close();
    }
  });

  // 加载中状态
  if (list.loading && list.configs.length === 0) {
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
      {/* 操作栏和筛选 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">模型配置列表</h3>
            <p className="text-sm text-muted-foreground mt-1">
              共 {list.total} 个配置
            </p>
          </div>
          <Button onClick={formDialog.startCreate}>添加配置</Button>
        </div>

        {/* 筛选条件 */}
        <div className="flex gap-3">
          <Select
            value={list.query.provider || "all"}
            onValueChange={(value) =>
              list.handleFilterChange("provider", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Provider类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部Provider</SelectItem>
              <SelectItem value="stability">Stability</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="aliyun">阿里云</SelectItem>
              <SelectItem value="gemini">Google Gemini</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={list.query.type || "all"}
            onValueChange={(value) =>
              list.handleFilterChange("type", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="服务类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="image-gen">图像生成</SelectItem>
              <SelectItem value="text-gen">文本生成</SelectItem>
              <SelectItem value="embedding">向量嵌入</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={
              list.query.enabled === undefined
                ? "all"
                : list.query.enabled
                  ? "enabled"
                  : "disabled"
            }
            onValueChange={(value) =>
              list.handleFilterChange(
                "enabled",
                value === "all" ? undefined : value === "enabled"
              )
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="启用状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="enabled">已启用</SelectItem>
              <SelectItem value="disabled">已禁用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 配置列表 */}
      {list.configs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">暂无模型配置</p>
          <Button className="mt-4" onClick={formDialog.startCreate}>
            添加第一个配置
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {list.configs.map((config) => (
            <Card key={config.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold">{config.name}</h4>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {config.provider}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                      {config.type}
                    </span>
                    {!config.enabled && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        已禁用
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      优先级: {config.priority}
                    </span>
                  </div>
                  {config.modelId && (
                    <p className="text-sm text-muted-foreground mt-1">
                      模型: {config.modelId}
                    </p>
                  )}
                  {config.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {config.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    API地址: {config.baseUrl}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => formDialog.startEdit(config)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => crud.validate(config.id)}
                  >
                    验证
                  </Button>
                  <Button
                    variant={config.enabled ? "outline" : "default"}
                    size="sm"
                    onClick={() => crud.toggleEnabled(config)}
                  >
                    {config.enabled ? "禁用" : "启用"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteDialog.openDelete(config)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 分页 */}
      {list.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={list.page === 1}
            onClick={() => list.setPage(list.page - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {list.page} / {list.totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={list.page === list.totalPages}
            onClick={() => list.setPage(list.page + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 创建/编辑对话框 - 使用react-hook-form */}
      <Dialog open={formDialog.isOpen} onOpenChange={formDialog.close}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formDialog.isEditMode ? "编辑模型配置" : "创建模型配置"}
            </DialogTitle>
            <DialogDescription>
              {formDialog.isEditMode
                ? "修改现有的模型配置信息"
                : "添加新的AI模型配置"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* 配置名称 */}
              <div className="grid gap-2">
                <Label htmlFor="name">配置名称 *</Label>
                <Input
                  id="name"
                  {...formDialog.form.register("name")}
                  placeholder="例如：OpenAI DALL-E 3"
                />
                {formDialog.form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {formDialog.form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Provider类型 */}
                <div className="grid gap-2">
                  <Label htmlFor="provider">Provider类型 *</Label>
                  <select
                    id="provider"
                    {...formDialog.form.register("provider")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="stability">Stability AI</option>
                    <option value="aliyun">阿里云</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                  {formDialog.form.formState.errors.provider && (
                    <p className="text-sm text-red-500">
                      {formDialog.form.formState.errors.provider.message}
                    </p>
                  )}
                </div>

                {/* 服务类型 */}
                <div className="grid gap-2">
                  <Label htmlFor="type">服务类型 *</Label>
                  <select
                    id="type"
                    {...formDialog.form.register("type")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="" disabled>请选择服务类型</option>
                    <option value="image-gen">图像生成</option>
                    <option value="text-gen">文本生成</option>
                    <option value="embedding">向量嵌入</option>
                  </select>
                  {formDialog.form.formState.errors.type && (
                    <p className="text-sm text-red-500">
                      {formDialog.form.formState.errors.type.message}
                    </p>
                  )}
                </div>
              </div>

              {/* 模型ID */}
              <div className="grid gap-2">
                <Label htmlFor="modelId">模型ID</Label>
                <Input
                  id="modelId"
                  {...formDialog.form.register("modelId")}
                  placeholder="例如：dall-e-3"
                />
              </div>

              {/* API基础URL */}
              <div className="grid gap-2">
                <Label htmlFor="baseUrl">API基础URL *</Label>
                <Input
                  id="baseUrl"
                  {...formDialog.form.register("baseUrl")}
                  placeholder="https://api.openai.com/v1"
                />
                {formDialog.form.formState.errors.baseUrl && (
                  <p className="text-sm text-red-500">
                    {formDialog.form.formState.errors.baseUrl.message}
                  </p>
                )}
              </div>

              {/* API Key */}
              <div className="grid gap-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  {...formDialog.form.register("apiKey")}
                  placeholder="sk-..."
                />
                {formDialog.form.formState.errors.apiKey && (
                  <p className="text-sm text-red-500">
                    {formDialog.form.formState.errors.apiKey.message}
                  </p>
                )}
              </div>

              {/* 优先级 */}
              <div className="grid gap-2">
                <Label htmlFor="priority">优先级</Label>
                <Input
                  id="priority"
                  type="number"
                  {...formDialog.form.register("priority")}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  数字越大优先级越高
                </p>
              </div>

              {/* 描述信息 */}
              <div className="grid gap-2">
                <Label htmlFor="description">描述信息</Label>
                <Textarea
                  id="description"
                  {...formDialog.form.register("description")}
                  placeholder="配置说明..."
                  rows={3}
                />
              </div>

              {/* 启用状态 */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formDialog.form.watch("enabled")}
                  onCheckedChange={(checked) =>
                    formDialog.form.setValue("enabled", checked)
                  }
                />
                <Label htmlFor="enabled">启用此配置</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={formDialog.close}
                disabled={crud.submitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={crud.submitting}>
                {crud.submitting
                  ? formDialog.isEditMode
                    ? "更新中..."
                    : "创建中..."
                  : formDialog.isEditMode
                    ? "更新"
                    : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.closeDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除配置 "{deleteDialog.deletingItem?.name}"
              吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={deleteDialog.confirmDelete}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
