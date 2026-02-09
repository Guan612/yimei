import { createFileRoute } from "@tanstack/react-router";
import AdminMedicalAestheticsPage from "@/app/admin/medical-aesthetics/page";

export const Route = createFileRoute("/admin/medical-aesthetics")({
  component: AdminMedicalAestheticsPage,
});
