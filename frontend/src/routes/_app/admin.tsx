import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

function AdminLayout() {
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export const Route = createFileRoute("/_app/admin")({
  component: AdminLayout,
});
