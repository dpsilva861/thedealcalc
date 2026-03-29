import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GoogleAnalytics } from "@/components/Analytics";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CREagentic | AI Agents for Commercial Real Estate",
  description:
    "AI agent platform for commercial real estate. LOI redlining, lease analysis, and more. Upload a document, get institutional-grade analysis in seconds. Starting at $2 per use.",
  keywords: [
    "LOI redlining",
    "commercial real estate",
    "letter of intent",
    "CRE",
    "AI redlining",
    "lease negotiation",
    "LOI review",
    "deal analysis",
    "AI agents",
    "CRE technology",
  ],
  authors: [{ name: "CREagentic" }],
  openGraph: {
    title: "CREagentic | AI Agents for Commercial Real Estate",
    description:
      "AI agent platform for commercial real estate. Upload a document, get institutional-grade analysis in seconds. Starting at $2 per use.",
    type: "website",
    siteName: "CREagentic",
  },
  twitter: {
    card: "summary_large_image",
    title: "CREagentic | AI Agents for Commercial Real Estate",
    description:
      "AI agent platform for commercial real estate. Upload a document, get institutional-grade analysis in seconds. Starting at $2 per use.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} font-sans antialiased bg-navy text-white`}
      >
        <GoogleAnalytics />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
