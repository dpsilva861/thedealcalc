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
  title: "RedlineIQ | AI-Powered LOI Redlining for Commercial Real Estate",
  description:
    "Redline any commercial real estate LOI in 60 seconds. AI-powered analysis with tracked changes output. $2 per document. No subscription.",
  keywords: [
    "LOI redlining",
    "commercial real estate",
    "letter of intent",
    "CRE",
    "AI redlining",
    "lease negotiation",
    "LOI review",
    "deal analysis",
  ],
  authors: [{ name: "RedlineIQ" }],
  openGraph: {
    title: "RedlineIQ | AI-Powered LOI Redlining for Commercial Real Estate",
    description:
      "Redline any commercial real estate LOI in 60 seconds. AI-powered analysis with tracked changes output. $2 per document.",
    type: "website",
    siteName: "RedlineIQ",
  },
  twitter: {
    card: "summary_large_image",
    title: "RedlineIQ | AI-Powered CRE LOI Redlining",
    description:
      "Redline any commercial real estate LOI in 60 seconds. $2 per document. No subscription.",
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
