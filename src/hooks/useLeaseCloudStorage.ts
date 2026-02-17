import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  LeaseRedlineResponse,
  LeaseRedlineRevision,
  RevisionDecision,
  ChatMessage,
  DocumentType,
  OutputMode,
  DealFolder,
  DealDocument,
  AnalysisVersion,
  AnalysisComment,
  Collaborator,
  AuditAction,
  AuditEntry,
  ShareLink,
  ShareOptions,
  CustomClause,
  LeaseTemplate,
} from "@/lib/lease-redline/types";

// ── Helper ────────────────────────────────────────────────────────────

function generateToken(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    token += chars[array[i] % chars.length];
  }
  return token;
}

// ── Return-value types for the listing query ──────────────────────────

interface AnalysisListItem {
  id: string;
  title: string;
  document_type: DocumentType;
  output_mode: OutputMode;
  revisions_count: number;
  created_at: string;
}

interface AnalysisDetail {
  id: string;
  title: string;
  user_id: string;
  document_type: DocumentType;
  output_mode: OutputMode;
  document_text: string;
  revisions: LeaseRedlineRevision[];
  decisions: RevisionDecision[];
  chat_history: ChatMessage[];
  summary: string | null;
  risk_flags: string[];
  defined_terms: string[];
  raw_content: string | null;
  created_at: string;
  updated_at: string;
}

// ── Hook ──────────────────────────────────────────────────────────────

/**
 * Cloud persistence hook for lease analyses.
 *
 * Bridges the local-first workflow (no login required) with optional
 * cloud sync via Supabase.  Every method is a no-op when `userId` is
 * undefined so callers don't need conditional logic.
 */
export function useLeaseCloudStorage(userId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ────────────────────────────────────────────────────────────────────
  // 1. saveAnalysis
  // ────────────────────────────────────────────────────────────────────

  const saveAnalysis = useCallback(
    async (
      response: LeaseRedlineResponse,
      decisions: RevisionDecision[],
      chatMessages: ChatMessage[],
      documentText: string,
      title?: string
    ): Promise<string | null> => {
      if (!userId) return null;

      setIsLoading(true);
      setError(null);

      try {
        const analysisTitle =
          title ||
          `${response.documentType.replace(/_/g, " ")} analysis — ${new Date().toLocaleDateString()}`;

        const { data, error: insertError } = await supabase
          .from("lease_analyses" as any)
          .insert({
            user_id: userId,
            title: analysisTitle,
            document_type: response.documentType,
            output_mode: response.outputMode,
            document_text: documentText,
            revisions: JSON.parse(JSON.stringify(response.revisions)),
            decisions: JSON.parse(JSON.stringify(decisions)),
            chat_history: JSON.parse(JSON.stringify(chatMessages)),
            summary: response.summary || null,
            risk_flags: response.riskFlags,
            defined_terms: response.definedTerms,
            raw_content: response.rawContent || null,
          } as any)
          .select("id")
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        return (data as any)?.id ?? null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save analysis";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // ────────────────────────────────────────────────────────────────────
  // 2. loadAnalyses
  // ────────────────────────────────────────────────────────────────────

  const loadAnalyses = useCallback(async (): Promise<AnalysisListItem[]> => {
    if (!userId) return [];

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("lease_analyses" as any)
        .select("id, title, document_type, output_mode, revisions, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      const rows = (data ?? []) as any[];

      return rows.map((row) => ({
        id: row.id as string,
        title: row.title as string,
        document_type: row.document_type as DocumentType,
        output_mode: row.output_mode as OutputMode,
        revisions_count: Array.isArray(row.revisions) ? row.revisions.length : 0,
        created_at: row.created_at as string,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load analyses";
      setError(msg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ────────────────────────────────────────────────────────────────────
  // 3. loadAnalysis
  // ────────────────────────────────────────────────────────────────────

  const loadAnalysis = useCallback(
    async (id: string): Promise<AnalysisDetail | null> => {
      if (!userId) return null;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("lease_analyses" as any)
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (queryError) {
          throw new Error(queryError.message);
        }

        if (!data) return null;

        const row = data as any;

        return {
          id: row.id,
          title: row.title,
          user_id: row.user_id,
          document_type: row.document_type as DocumentType,
          output_mode: row.output_mode as OutputMode,
          document_text: row.document_text ?? "",
          revisions: (row.revisions ?? []) as LeaseRedlineRevision[],
          decisions: (row.decisions ?? []) as RevisionDecision[],
          chat_history: (row.chat_history ?? []) as ChatMessage[],
          summary: row.summary ?? null,
          risk_flags: (row.risk_flags ?? []) as string[],
          defined_terms: (row.defined_terms ?? []) as string[],
          raw_content: row.raw_content ?? null,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load analysis";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // ────────────────────────────────────────────────────────────────────
  // 4. deleteAnalysis
  // ────────────────────────────────────────────────────────────────────

  const deleteAnalysis = useCallback(
    async (id: string): Promise<boolean> => {
      if (!userId) return false;

      setIsLoading(true);
      setError(null);

      try {
        const { error: deleteError } = await supabase
          .from("lease_analyses" as any)
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to delete analysis";
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // ────────────────────────────────────────────────────────────────────
  // 5. saveVersion
  // ────────────────────────────────────────────────────────────────────

  const saveVersion = useCallback(
    async (
      analysisId: string,
      versionLabel: string,
      revisions: LeaseRedlineRevision[],
      decisions: RevisionDecision[],
      summary: string | undefined,
      riskFlags: string[]
    ): Promise<string | null> => {
      if (!userId) return null;

      setIsLoading(true);
      setError(null);

      try {
        // Determine next version number
        const { data: existing, error: countError } = await supabase
          .from("analysis_versions" as any)
          .select("version_number")
          .eq("analysis_id", analysisId)
          .order("version_number", { ascending: false })
          .limit(1);

        if (countError) {
          throw new Error(countError.message);
        }

        const nextVersion =
          existing && (existing as any[]).length > 0
            ? ((existing as any[])[0].version_number as number) + 1
            : 1;

        const { data, error: insertError } = await supabase
          .from("analysis_versions" as any)
          .insert({
            analysis_id: analysisId,
            user_id: userId,
            version_number: nextVersion,
            label: versionLabel,
            revisions: JSON.parse(JSON.stringify(revisions)),
            decisions: JSON.parse(JSON.stringify(decisions)),
            summary: summary || null,
            risk_flags: riskFlags,
          } as any)
          .select("id")
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        return (data as any)?.id ?? null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save version";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // ────────────────────────────────────────────────────────────────────
  // 6. loadVersions
  // ────────────────────────────────────────────────────────────────────

  const loadVersions = useCallback(
    async (analysisId: string): Promise<AnalysisVersion[]> => {
      if (!userId) return [];

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("analysis_versions" as any)
          .select("*")
          .eq("analysis_id", analysisId)
          .order("version_number", { ascending: true });

        if (queryError) {
          throw new Error(queryError.message);
        }

        const rows = (data ?? []) as any[];

        return rows.map((row) => ({
          id: row.id as string,
          analysisId: row.analysis_id as string,
          versionNumber: row.version_number as number,
          revisions: (row.revisions ?? []) as LeaseRedlineRevision[],
          decisions: (row.decisions ?? []) as RevisionDecision[],
          summary: row.summary ?? undefined,
          riskFlags: (row.risk_flags ?? []) as string[],
          createdAt: row.created_at as string,
          label: row.label ?? undefined,
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load versions";
        setError(msg);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // ────────────────────────────────────────────────────────────────────
  // 7. addComment
  // ────────────────────────────────────────────────────────────────────

  const addComment = useCallback(
    async (
      analysisId: string,
      content: string,
      revisionIndex?: number
    ): Promise<string | null> => {
      if (!userId) return null;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch the user's email for display purposes
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const userEmail = user?.email ?? "unknown";

        const { data, error: insertError } = await supabase
          .from("analysis_comments" as any)
          .insert({
            analysis_id: analysisId,
            user_id: userId,
            user_email: userEmail,
            content,
            revision_index: revisionIndex ?? null,
          } as any)
          .select("id")
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        return (data as any)?.id ?? null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to add comment";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // ────────────────────────────────────────────────────────────────────
  // 8. loadComments
  // ────────────────────────────────────────────────────────────────────

  const loadComments = useCallback(
    async (analysisId: string): Promise<AnalysisComment[]> => {
      if (!userId) return [];

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("analysis_comments" as any)
          .select("*")
          .eq("analysis_id", analysisId)
          .order("created_at", { ascending: true });

        if (queryError) {
          throw new Error(queryError.message);
        }

        const rows = (data ?? []) as any[];

        return rows.map((row) => ({
          id: row.id as string,
          analysisId: row.analysis_id as string,
          revisionIndex: row.revision_index ?? undefined,
          userId: row.user_id as string,
          userEmail: row.user_email as string,
          content: row.content as string,
          createdAt: row.created_at as string,
          resolvedAt: row.resolved_at ?? undefined,
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load comments";
        setError(msg);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // ────────────────────────────────────────────────────────────────────
  // 9. resolveComment
  // ────────────────────────────────────────────────────────────────────

  const resolveComment = useCallback(
    async (commentId: string): Promise<boolean> => {
      if (!userId) return false;

      setIsLoading(true);
      setError(null);

      try {
        const { error: updateError } = await supabase
          .from("analysis_comments" as any)
          .update({ resolved_at: new Date().toISOString() } as any)
          .eq("id", commentId);

        if (updateError) {
          throw new Error(updateError.message);
        }

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to resolve comment";
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // ────────────────────────────────────────────────────────────────────
  // 10. shareAnalysis
  // ────────────────────────────────────────────────────────────────────

  const shareAnalysis = useCallback(
    async (
      analysisId: string,
      options: ShareOptions
    ): Promise<ShareLink | null> => {
      if (!userId) return null;

      setIsLoading(true);
      setError(null);

      try {
        const token = generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (options.expiresInDays ?? 7));

        const { data, error: insertError } = await supabase
          .from("share_links" as any)
          .insert({
            analysis_id: analysisId,
            created_by: userId,
            token,
            recipient_email: options.recipientEmail || null,
            include_chat: options.includeChat,
            include_financials: options.includeFinancials,
            message: options.message || null,
            expires_at: expiresAt.toISOString(),
            view_count: 0,
          } as any)
          .select("*")
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        if (!data) return null;

        const row = data as any;

        return {
          id: row.id as string,
          analysisId: row.analysis_id as string,
          token: row.token as string,
          createdBy: row.created_by as string,
          recipientEmail: row.recipient_email ?? undefined,
          expiresAt: row.expires_at as string,
          viewCount: (row.view_count ?? 0) as number,
          createdAt: row.created_at as string,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to share analysis";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // ────────────────────────────────────────────────────────────────────
  // 11. logAudit
  // ────────────────────────────────────────────────────────────────────

  const logAudit = useCallback(
    async (
      action: AuditAction,
      analysisId?: string,
      details?: Record<string, unknown>
    ): Promise<boolean> => {
      if (!userId) return false;

      // Audit logging should never block the UI or surface errors to the
      // user, so we intentionally do NOT set isLoading / error here.
      try {
        const { error: insertError } = await supabase
          .from("audit_trail" as any)
          .insert({
            user_id: userId,
            action,
            analysis_id: analysisId || null,
            details: details ? JSON.parse(JSON.stringify(details)) : null,
          } as any);

        if (insertError) {
          console.error("[useLeaseCloudStorage] audit log error:", insertError.message);
          return false;
        }

        return true;
      } catch (err) {
        console.error("[useLeaseCloudStorage] audit log error:", err);
        return false;
      }
    },
    [userId]
  );

  // ────────────────────────────────────────────────────────────────────
  // 12. loadAuditTrail
  // ────────────────────────────────────────────────────────────────────

  const loadAuditTrail = useCallback(
    async (analysisId?: string): Promise<AuditEntry[]> => {
      if (!userId) return [];

      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("audit_trail" as any)
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(200);

        if (analysisId) {
          query = query.eq("analysis_id", analysisId);
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          throw new Error(queryError.message);
        }

        const rows = (data ?? []) as any[];

        return rows.map((row) => ({
          id: row.id as string,
          analysisId: row.analysis_id ?? undefined,
          userId: row.user_id as string,
          action: row.action as AuditAction,
          details: row.details ?? undefined,
          createdAt: row.created_at as string,
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load audit trail";
        setError(msg);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // ────────────────────────────────────────────────────────────────────

  return {
    isLoading,
    error,
    saveAnalysis,
    loadAnalyses,
    loadAnalysis,
    deleteAnalysis,
    saveVersion,
    loadVersions,
    addComment,
    loadComments,
    resolveComment,
    shareAnalysis,
    logAudit,
    loadAuditTrail,
  };
}
