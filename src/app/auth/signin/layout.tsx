import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | CREagentic",
  description: "Sign in to CREagentic to access your LOI analysis dashboard and history.",
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
