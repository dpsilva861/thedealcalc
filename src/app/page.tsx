import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SelfLearning } from "@/components/landing/SelfLearning";
import { Pricing } from "@/components/landing/Pricing";
import { Comparison } from "@/components/landing/Comparison";
import { FAQ } from "@/components/landing/FAQ";
import { faqData } from "@/data/faq-data";
import { Testimonials } from "@/components/landing/Testimonials";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";

export default function Home() {
  return (
    <>
      {/* Schema Markup */}
      <SchemaMarkup type="SoftwareApplication" />
      <SchemaMarkup
        type="FAQPage"
        data={{
          faqs: faqData.map((f) => ({
            question: f.question,
            answer: f.answer,
          })),
        }}
      />
      <SchemaMarkup
        type="HowTo"
        data={{
          howToName: "How to Redline a CRE LOI with CREagentic",
          howToDescription:
            "Upload your letter of intent, let AI analyze every provision against industry benchmarks, and download professional redlines.",
          steps: [
            {
              name: "Upload Your LOI",
              text: "Drop a PDF, DOCX, or paste text. CREagentic supports any LOI format from any market.",
            },
            {
              name: "AI Analyzes Every Provision",
              text: "The engine checks against industry-standard benchmarks, identifies risks, and generates specific redline language.",
            },
            {
              name: "Download Your Redlines",
              text: "Get a professional DOCX with tracked changes and a PDF executive summary, ready to send.",
            },
          ],
        }}
      />

      {/* Page Sections */}
      <Hero />
      <HowItWorks />
      <SelfLearning />
      <Pricing />
      <Comparison />
      <Testimonials />
      <FAQ />
    </>
  );
}
