import { createFileRoute } from "@tanstack/react-router";
import AdminStatsPage from "@/app/admin/stats/page";

export const Route = createFileRoute("/admin/stats")({
  component: AdminStatsPage,
});
