import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning Dashboard | RedlineIQ Admin",
  description: "Admin dashboard for monitoring the RedlineIQ self-learning engine.",
};

export default function AdminLearningLayout({ children }: { children: React.ReactNode }) {
  return children;
}
