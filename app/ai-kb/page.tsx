import type { Metadata } from "next";
import AIKBLanding from "@/components/ai-kb/landing";

export const metadata: Metadata = {
  title: "FieldAI — AI Knowledge Base for Field Service Technicians",
  description: "Instant AI-powered manual lookup, voice search, and troubleshooting guides for HVAC, plumbing, and electrical technicians. $49/tech/month.",
};

export default function AIKBPage() {
  return <AIKBLanding />;
}
