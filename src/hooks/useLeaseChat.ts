import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeFinancialModel } from "@/lib/lease-redline/financial-models";
import type {
  ChatMessage,
  ChatContext,
  ChatResponse,
  LeaseRedlineResponse,
  RevisionDecision,
  UserPreferences,
  FinancialModelInputs,
} from "@/lib/lease-redline/types";

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Build a compact revisions summary for the chat context.
 * Keeps it under ~2000 chars to avoid bloating the prompt.
 */
function buildRevisionsSummary(
  response: LeaseRedlineResponse,
  decisions: RevisionDecision[]
): string {
  return response.revisions
    .map((rev, i) => {
      const status = decisions[i] || "pending";
      return `#${rev.clauseNumber} [${(rev.riskLevel || "low").toUpperCase()}] [${rev.category || "other"}] [${status}]: ${rev.reason}`;
    })
    .join("\n");
}

export function useLeaseChat(
  response: LeaseRedlineResponse | null,
  decisions: RevisionDecision[],
  userPreferences?: UserPreferences
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef(false);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!response || inflightRef.current || !userMessage.trim()) return;
      inflightRef.current = true;
      setError(null);

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: userMessage.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const context: ChatContext = {
          documentType: response.documentType,
          outputMode: response.outputMode,
          revisionsSummary: buildRevisionsSummary(response, decisions),
          riskFlags: response.riskFlags,
          definedTerms: response.definedTerms,
          decisions,
          conversationHistory: [...messages, userMsg].slice(-20),
          userPreferences,
        };

        const { data, error: fnError } = await supabase.functions.invoke(
          "lease-redline-chat",
          { body: { message: userMessage.trim(), context } }
        );

        if (fnError) {
          throw new Error(fnError.message || "Chat request failed");
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        const chatResponse = data as ChatResponse;

        // If the AI suggested a financial model, compute it client-side
        let financialModel = undefined;
        if (chatResponse.financialModel && chatResponse.financialModel.type && chatResponse.financialModel.inputs) {
          try {
            financialModel = computeFinancialModel(
              chatResponse.financialModel as FinancialModelInputs
            );
          } catch {
            // Financial model computation failed — still show the message
          }
        }

        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: chatResponse.message,
          timestamp: Date.now(),
          reasoning: chatResponse.reasoning,
          financialModel,
          suggestions: chatResponse.suggestions,
          revisionRef: chatResponse.revisionRef ?? undefined,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Chat failed";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        inflightRef.current = false;
      }
    },
    [response, decisions, messages, userPreferences]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}
