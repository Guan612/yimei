import { createFileRoute } from "@tanstack/react-router";
import AdminProvidersPage from "@/app/admin/providers/page";

export const Route = createFileRoute("/admin/providers")({
  component: AdminProvidersPage,
});
