import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
export const Route = createRootRoute({
  component: () => (
    <>
      <Toaster />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
