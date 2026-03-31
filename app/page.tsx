import Dashboard from "@/components/dashboard-provider";

// Force dynamic rendering — avoids SSR/hydration mismatch with DnD aria-describedby IDs
export const dynamic = "force-dynamic";

export default function Home() {
  return <Dashboard />;
}
