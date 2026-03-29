"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqData } from "@/data/faq-data";

const faqs = faqData;

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-sm sm:text-base font-medium text-white group-hover:text-electric transition-colors pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-electric" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-48 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm text-slate-400 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-electric tracking-wide uppercase mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400">
            Everything you need to know about CREagentic.
          </p>
        </div>

        {/* Accordion */}
        <div>
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

