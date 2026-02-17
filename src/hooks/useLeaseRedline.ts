import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  LeaseRedlineRequest,
  LeaseRedlineResponse,
  LeaseRedlineState,
} from "@/lib/lease-redline/types";

interface AnalyzeOptions {
  learnedRules?: string;
}

const MAX_RETRIES = 2;
const RETRY_DELAYS = [2000, 4000];

export function useLeaseRedline() {
  const [state, setState] = useState<LeaseRedlineState>({
    isLoading: false,
    error: null,
    response: null,
  });

  // Guard against rapid double-submissions
  const inflightRef = useRef(false);

  const analyze = useCallback(async (request: LeaseRedlineRequest, options?: AnalyzeOptions) => {
    if (inflightRef.current) return null;
    inflightRef.current = true;
    setState({ isLoading: true, error: null, response: null });

    let lastError = "";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke(
          "lease-redline",
          {
            body: {
              documentText: request.documentText,
              documentType: request.documentType,
              outputMode: request.outputMode,
              additionalInstructions: request.additionalInstructions,
              learnedRules: options?.learnedRules,
            },
          }
        );

        if (error) {
          throw new Error(error.message || "Failed to analyze document");
        }

        if (data?.error) {
          // Don't retry client errors (4xx)
          if (typeof data.error === "string" && (
            data.error.includes("required") ||
            data.error.includes("Invalid") ||
            data.error.includes("exceeds") ||
            data.error.includes("at least")
          )) {
            throw new Error(data.error);
          }
          throw new Error(data.error);
        }

        const response: LeaseRedlineResponse = {
          revisions: data.revisions || [],
          summary: data.summary || undefined,
          riskFlags: data.riskFlags || [],
          definedTerms: data.definedTerms || [],
          documentType: data.documentType,
          outputMode: data.outputMode,
          rawContent: data.rawContent || "",
          tokenUsage: data.tokenUsage || undefined,
        };

        setState({ isLoading: false, error: null, response });
        inflightRef.current = false;
        return response;
      } catch (err) {
        lastError =
          err instanceof Error ? err.message : "An unexpected error occurred";

        // Don't retry validation errors
        if (
          lastError.includes("required") ||
          lastError.includes("Invalid") ||
          lastError.includes("exceeds") ||
          lastError.includes("at least")
        ) {
          break;
        }

        // Retry transient errors with delay
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAYS[attempt])
          );
          continue;
        }
      }
    }

    setState({ isLoading: false, error: lastError, response: null });
    inflightRef.current = false;
    return null;
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, response: null });
    inflightRef.current = false;
  }, []);

  return {
    ...state,
    analyze,
    reset,
  };
}
