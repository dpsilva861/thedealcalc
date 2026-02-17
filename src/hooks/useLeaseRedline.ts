import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  LeaseRedlineRequest,
  LeaseRedlineResponse,
  LeaseRedlineState,
} from "@/lib/lease-redline/types";

export function useLeaseRedline() {
  const [state, setState] = useState<LeaseRedlineState>({
    isLoading: false,
    error: null,
    response: null,
  });

  const analyze = useCallback(async (request: LeaseRedlineRequest) => {
    setState({ isLoading: true, error: null, response: null });

    try {
      const { data, error } = await supabase.functions.invoke("lease-redline", {
        body: {
          documentText: request.documentText,
          documentType: request.documentType,
          outputMode: request.outputMode,
          additionalInstructions: request.additionalInstructions,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to analyze document");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const response: LeaseRedlineResponse = {
        revisions: data.revisions || [],
        summary: data.summary || undefined,
        riskFlags: data.riskFlags || [],
        documentType: data.documentType,
        outputMode: data.outputMode,
        rawContent: data.rawContent || "",
      };

      setState({ isLoading: false, error: null, response });
      return response;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setState({ isLoading: false, error: message, response: null });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, response: null });
  }, []);

  return {
    ...state,
    analyze,
    reset,
  };
}
