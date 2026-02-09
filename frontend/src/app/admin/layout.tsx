'use client';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useRouteGuard } from '@/hooks/auth/useRouteGuard';

export default function AdminLayout({
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
