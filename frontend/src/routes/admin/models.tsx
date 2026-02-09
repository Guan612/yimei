import { createFileRoute } from "@tanstack/react-router";
import AdminModelsPage from "@/app/admin/models/page";

export const Route = createFileRoute("/admin/models")({
  component: AdminModelsPage,
});
