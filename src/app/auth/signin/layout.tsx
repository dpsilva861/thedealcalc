import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | RedlineIQ",
  description: "Sign in to RedlineIQ to access your LOI analysis dashboard and history.",
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
