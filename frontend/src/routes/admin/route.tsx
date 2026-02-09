import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useRouteGuard } from '@/hooks/auth/useRouteGuard';

function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRouteGuard();

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}


export const Route = createFileRoute("/admin")({
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});
