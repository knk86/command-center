import type { Metadata } from "next";
import AIKBDashboard from "@/components/ai-kb/app-dashboard";

export const metadata: Metadata = {
  title: "FieldAI — Dashboard",
  description: "Your AI knowledge base dashboard",
};

export default function DashboardPage() {
  return <AIKBDashboard />;
}
