"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UploadZone, type UploadResult } from "@/components/redline/UploadZone";
import { OptionsPanel, type RedlineOptions } from "@/components/redline/OptionsPanel";
import { ProcessingView } from "@/components/redline/ProcessingView";
import { FileText, CreditCard, ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

type FlowState = "upload" | "processing" | "error";

function RedlineFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [flowState, setFlowState] = useState<FlowState>("upload");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [options, setOptions] = useState<RedlineOptions>({
    perspective: "landlord",
    mode: "standard",
    propertyType: "retail",
    dealType: "new_lease",
  });

  const handleUploadComplete = useCallback((result: UploadResult) => {
    setUploadResult(result);
    setError(null);
    try {
      sessionStorage.setItem("redlineiq_upload", JSON.stringify(result));
    } catch {
      // sessionStorage may be unavailable
    }
    setOptions((prev) => ({
      ...prev,
      propertyType: result.detectedPropertyType || prev.propertyType,
      dealType: result.detectedDealType || prev.dealType,
    }));
  }, []);

  const handleClear = useCallback(() => {
    setUploadResult(null);
    setError(null);
    try {
      sessionStorage.removeItem("redlineiq_upload");
    } catch {
      // ignore
    }
  }, []);

  const handleCheckout = async () => {
    if (!uploadResult) return;
    setIsCheckingOut(true);
    setError(null);

    try {
      sessionStorage.setItem("redlineiq_options", JSON.stringify(options));

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/redline`,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to create checkout session");
        return;
      }

      window.location.href = data.data.url;
    } catch {
      setError("Failed to initiate payment. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const triggerRedline = useCallback(
    async (sessionId: string) => {
      setFlowState("processing");

      let text = "";
      let filename = "uploaded-loi";
      let storedOptions: RedlineOptions = {
        perspective: "landlord",
        mode: "standard",
        propertyType: "retail",
        dealType: "new_lease",
      };

      try {
        const storedUpload = sessionStorage.getItem("redlineiq_upload");
        if (storedUpload) {
          const parsed = JSON.parse(storedUpload);
          text = parsed.text;
          filename = parsed.filename;
        }
        const storedOpts = sessionStorage.getItem("redlineiq_options");
        if (storedOpts) {
          storedOptions = JSON.parse(storedOpts);
        }
      } catch {
        // ignore
      }

      if (!text) {
        setError("Upload data was lost. Please upload your document again.");
        setFlowState("upload");
        return;
      }

      try {
        const res = await fetch("/api/redline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            perspective: storedOptions.perspective,
            mode: storedOptions.mode,
            propertyType: storedOptions.propertyType,
            dealType: storedOptions.dealType,
            sessionId,
            filename,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          setError(data.error || "Analysis failed. Please try again.");
          setFlowState("error");
          return;
        }

        try {
          sessionStorage.removeItem("redlineiq_upload");
          sessionStorage.removeItem("redlineiq_options");
        } catch {
          // ignore
        }

        router.push(`/results/${data.data.jobId}`);
      } catch {
        setError("Analysis failed. Please try again.");
        setFlowState("error");
      }
    },
    [router]
  );

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      trackEvent("payment_completed");
      triggerRedline(sessionId);
    }
  }, [searchParams, triggerRedline]);

  if (flowState === "processing") {
    return <ProcessingView />;
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-electric/10 border border-electric/20 mb-4">
            <FileText className="w-3.5 h-3.5 text-electric" />
            <span className="text-xs font-medium text-electric">LOI Redline Analysis</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Upload Your LOI
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Upload a PDF, DOCX, or paste your LOI text. Our AI will analyze every provision against industry-standard benchmarks.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Upload Zone */}
        <div className="mb-6">
          <UploadZone
            onUploadComplete={handleUploadComplete}
            onClear={handleClear}
            uploadResult={uploadResult}
          />
        </div>

        {/* Options Panel */}
        <div className="mb-6">
          <OptionsPanel options={options} onChange={setOptions} />
        </div>

        {/* Payment + Submit */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-white">1 LOI Redline</p>
              <p className="text-xs text-slate-500">Full analysis with DOCX and PDF output</p>
            </div>
            <p className="text-2xl font-bold text-white">$2.00</p>
          </div>

          <button
            onClick={handleCheckout}
            disabled={!uploadResult || isCheckingOut}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-electric hover:bg-electric-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-electric/20 hover:shadow-electric/30"
          >
            {isCheckingOut ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Redirecting to payment...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Analyze My LOI
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {!uploadResult && (
            <p className="text-xs text-slate-600 text-center mt-3">
              Upload a document above to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RedlinePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-electric border-t-transparent animate-spin" />
        </div>
      }
    >
      <RedlineFlow />
    </Suspense>
  );
}
