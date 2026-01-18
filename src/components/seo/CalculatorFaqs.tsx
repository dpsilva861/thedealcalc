/**
 * Reusable FAQ Section Component
 * 
 * Renders FAQ content using the exact same strings that are passed
 * to FAQPage JSON-LD, ensuring single source of truth.
 */

import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FAQ } from "@/lib/seo/faqs";

interface CalculatorFaqsProps {
  faqs: FAQ[];
  heading?: string;
}

export function CalculatorFaqs({ faqs, heading = "Frequently Asked Questions" }: CalculatorFaqsProps) {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-cream-dark">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2 className="font-display text-3xl font-bold text-foreground">
              {heading}
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-background border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
