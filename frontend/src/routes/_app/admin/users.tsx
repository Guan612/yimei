import { createFileRoute } from "@tanstack/react-router";

function AdminUsersPage() {
  return (
    <div className="container mx-auto px-8 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
        <p className="mt-2 text-muted-foreground">
          管理系统用户、角色和权限
        </p>
      </div>

      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">用户管理功能开发中...</p>
      </div>
    </div>
  );
}


export const Route = createFileRoute("/_app/admin/users")({
  component: AdminUsersPage,
});
