import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | CREagentic",
  description: "View your LOI analysis history, download results, and track your redlining activity.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
