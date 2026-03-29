"use client";

import { useEffect, useState } from "react";
import { Brain } from "lucide-react";

const statusMessages = [
  "Extracting document text...",
  "Analyzing against industry benchmarks...",
  "Checking 15 provision categories...",
  "Identifying deal patterns...",
  "Generating redline recommendations...",
  "Building your report...",
];

export function ProcessingView() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 4000);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        const increment = Math.random() * 3 + 0.5;
        return Math.min(prev + increment, 92);
      });
    }, 500);

    return () => {
      clearInterval(messageTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center px-4">
        {/* Animated brain icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute w-24 h-24 rounded-full bg-electric/10 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute w-20 h-20 rounded-full bg-electric/5" />
          <div className="relative w-16 h-16 rounded-2xl bg-electric/10 border border-electric/20 flex items-center justify-center">
            <Brain className="w-8 h-8 text-electric animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-white mb-2">
          Analyzing Your LOI
        </h2>
        <p className="text-sm text-slate-400 mb-8">
          Usually takes 30-60 seconds
        </p>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-electric to-electric-hover transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status message */}
        <div className="h-6">
          <p
            key={messageIndex}
            className="text-sm text-slate-400 animate-fade-in-up"
          >
            {statusMessages[messageIndex]}
          </p>
        </div>

        {/* Dots animation */}
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-electric/40 animate-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
