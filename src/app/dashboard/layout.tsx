import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | RedlineIQ",
  description: "View your LOI analysis history, download results, and track your redlining activity.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
