import { createFileRoute, Outlet } from "@tanstack/react-router";

function PosterGenLayout() {
  return <Outlet />;
}

export const Route = createFileRoute("/_app/poster-gen")({
  component: PosterGenLayout,
});
