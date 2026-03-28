import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analysis Results | RedlineIQ",
  description: "View your LOI redline analysis results, download DOCX with tracked changes, and get negotiation strategy recommendations.",
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
