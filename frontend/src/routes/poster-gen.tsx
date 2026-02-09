import { createFileRoute } from "@tanstack/react-router";
import PosterGenPage from "@/app/poster-gen/page";

export const Route = createFileRoute("/poster-gen")({
  component: PosterGenPage,
});
