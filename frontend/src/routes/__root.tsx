import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
export const Route = createRootRoute({
  component: () => (
    <>
      <Toaster position="top-center" className="bg-rose-gold-light"/>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
