import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learning Dashboard | CREagentic Admin",
  description: "Admin dashboard for monitoring the CREagentic self-learning engine.",
};

export default function AdminLearningLayout({ children }: { children: React.ReactNode }) {
  return children;
}
