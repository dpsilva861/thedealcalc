import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload LOI | CREagentic",
  description:
    "Upload your commercial real estate LOI for AI-powered redline analysis. Get institutional-grade results in 60 seconds for $2.",
};

export default function RedlineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
