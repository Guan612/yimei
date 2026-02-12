import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/admin/")({
  component: AdminIndex,
});

function AdminIndex() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="font-bold text-6xl">
        欢迎来到医美管理后台
      </div>
    </div>
  );
}
