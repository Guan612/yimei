import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppHeader } from "@/components/layout/AppHeader";
import { useRouteGuard } from "@/hooks/auth/useRouteGuard";

function AppLayout() {
  useRouteGuard();

  return (
    <div className="min-h-screen bg-(--cream)">
      <AppHeader />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});
