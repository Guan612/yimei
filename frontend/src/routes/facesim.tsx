import { createFileRoute } from "@tanstack/react-router";
import FaceSimPage from "@/app/facesim/page";

export const Route = createFileRoute("/facesim")({
  component: FaceSimPage,
});
