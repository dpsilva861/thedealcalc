import { useState, useEffect, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { LeaseInput } from "@/components/lease-redline/LeaseInput";
import { RedlineOutput } from "@/components/lease-redline/RedlineOutput";
import { ChatPanel } from "@/components/lease-redline/ChatPanel";
import { InlineRedlineViewer } from "@/components/lease-redline/InlineRedlineViewer";
import { ShareDialog } from "@/components/lease-redline/ShareDialog";
import { VersionComparisonView } from "@/components/lease-redline/VersionComparisonView";
import { CollaborationPanel } from "@/components/lease-redline/CollaborationPanel";
import { RedlineAnalyticsDashboard } from "@/components/lease-redline/RedlineAnalyticsDashboard";
import { BulkActionsToolbar } from "@/components/lease-redline/BulkActionsToolbar";
import { NegotiationTimeline } from "@/components/lease-redline/NegotiationTimeline";
import { SideBySideView } from "@/components/lease-redline/SideBySideView";
import { TemplateComparisonPanel } from "@/components/lease-redline/TemplateComparisonPanel";
import { ClauseLibraryPanel } from "@/components/lease-redline/ClauseLibraryPanel";
import { TrackChangesImport } from "@/components/lease-redline/TrackChangesImport";
import { ConsistencyCheckPanel } from "@/components/lease-redline/ConsistencyCheckPanel";
import { DealStatusBoard } from "@/components/lease-redline/DealStatusBoard";
import { useLeaseRedline } from "@/hooks/useLeaseRedline";
import { useLeaseChat } from "@/hooks/useLeaseChat";
import { useLeaseMemory } from "@/hooks/useLeaseMemory";
import { useLeaseLearning } from "@/hooks/useLeaseLearning";
import { useVersionHistory } from "@/hooks/useVersionHistory";
import { useAuditTrail } from "@/hooks/useAuditTrail";
import { useRedlineTimer } from "@/hooks/useRedlineTimer";
import { useNegotiationRounds } from "@/hooks/useNegotiationRounds";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useDealFolders } from "@/hooks/useDealFolders";
import { useClauseLibrary } from "@/hooks/useClauseLibrary";
import { useTemplateComparison } from "@/hooks/useTemplateComparison";
import { useCrossDocConsistency } from "@/hooks/useCrossDocConsistency";
import { exportWithTrackChanges, downloadBlob } from "@/lib/lease-redline/docx-export";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  LeaseRedlineRequest,
  RevisionDecision,
  AnalysisComment,
  DocumentType,
  DocxImportResult,
} from "@/lib/lease-redline/types";
import {
  Shield,
  ShieldAlert,
  Scale,
  AlertTriangle,
  Loader2,
  FileSearch,
  ListChecks,
  FileOutput,
  BarChart3,
  Columns2,
  Clock,
  BookOpen,
  GitCompareArrows,
  FileUp,
  Building2,
  Download,
} from "lucide-react";

const ANALYSIS_STEPS = [
  { label: "Parsing document structure...", icon: FileSearch, pct: 15 },
  { label: "Identifying clauses and defined terms...", icon: FileSearch, pct: 30 },
  { label: "Evaluating risk levels...", icon: AlertTriangle, pct: 50 },
  { label: "Generating redline revisions...", icon: ListChecks, pct: 70 },
  { label: "Applying quality controls...", icon: Shield, pct: 85 },
  { label: "Formatting output...", icon: FileOutput, pct: 95 },
];

function AnalysisProgress() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < ANALYSIS_STEPS.length - 1 ? s + 1 : s));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = ANALYSIS_STEPS[step];
  const Icon = current.icon;

  return (
    <Card className="border-primary/20">
      <CardContent className="py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground text-center">
            {current.label}
          </p>
          <div className="w-full max-w-sm">
            <Progress value={current.pct} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">
            This typically takes 30-90 seconds depending on document length
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeaseRedline() {
  const { isLoading, error, response, analyze, reset } = useLeaseRedline();
  const { preferences, saveToHistory, getContextualSuggestions } = useLeaseMemory();
  const learning = useLeaseLearning();
  const versionHistory = useVersionHistory();
  const audit = useAuditTrail();
  const timer = useRedlineTimer();
  const negotiation = useNegotiationRounds();
  const dealFolders = useDealFolders();
  const clauseLibrary = useClauseLibrary();
  const templateComparison = useTemplateComparison();
  const crossDocConsistency = useCrossDocConsistency();

  // Lift decisions state so both RedlineOutput and ChatPanel can access it
  const [decisions, setDecisions] = useState<RevisionDecision[]>([]);
  const [documentText, setDocumentText] = useState("");
  const [analysisId] = useState(() => `analysis_${Date.now()}`);
  const [documentType, setDocumentType] = useState<DocumentType>("lease");

  // UI panel toggles
  const [showInlineView, setShowInlineView] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showTemplateCompare, setShowTemplateCompare] = useState(false);
  const [showClauseLibrary, setShowClauseLibrary] = useState(false);
  const [showTrackChangesImport, setShowTrackChangesImport] = useState(false);
  const [showConsistency, setShowConsistency] = useState(false);
  const [showDealBoard, setShowDealBoard] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // Local comments (localStorage-based for now)
  const [comments, setComments] = useState<AnalysisComment[]>([]);

  // Keyboard shortcuts
  const shortcuts = useKeyboardShortcuts({
    revisionCount: response?.revisions.length || 0,
    decisions,
    onDecisionsChange: setDecisions,
    enabled: !!response && !showShare,
  });

  // Initialize decisions when response arrives + start timer phases
  useEffect(() => {
    if (response) {
      setDecisions(response.revisions.map(() => "pending" as RevisionDecision));
      audit.logAction("analysis_created", analysisId, {
        documentType: response.documentType,
        outputMode: response.outputMode,
        revisionCount: response.revisions.length,
      });
      // Transition timer to human review phase
      timer.startPhase("human_review");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  // Get learned rules once for the current session
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const learnedRulesPrompt = useMemo(() => learning.getRulesForPrompt(), [learning.rules]);

  // Build clause library context for prompt injection
  const clauseLibraryContext = useMemo(() => {
    const relevant = clauseLibrary.getClausesForPrompt(documentType);
    if (relevant.length === 0) return "";
    const sorted = [...relevant]
      .sort((a, b) => (b.acceptanceCount || 0) - (a.acceptanceCount || 0))
      .slice(0, 15);
    const lines = sorted.map(
      (c) => `- [${c.category.toUpperCase()}] "${c.label}": ${c.language.slice(0, 300)}`
    );
    return `\nUSER'S STANDARD CLAUSE POSITIONS (use this language when applicable):\n${lines.join("\n")}`;
  }, [clauseLibrary.getClausesForPrompt, documentType]);

  // Chat options with learning integration
  const chatOptions = useMemo(
    () => ({
      learnedRules: learnedRulesPrompt,
      onCorrectionDetected: learning.learnFromChat,
    }),
    [learnedRulesPrompt, learning.learnFromChat]
  );

  const chat = useLeaseChat(response, decisions, preferences, chatOptions);

  // Submit handler that injects learned rules + clause library + starts timer
  const handleSubmit = useCallback(
    async (request: LeaseRedlineRequest) => {
      setDocumentText(request.documentText);
      setDocumentType(request.documentType);
      // Start timer session
      timer.startSession(analysisId, request.documentType);
      timer.startPhase("ai_analysis");
      return analyze(request, {
        learnedRules: learnedRulesPrompt,
        clauseLibraryContext: clauseLibraryContext || undefined,
      });
    },
    [analyze, learnedRulesPrompt, clauseLibraryContext, timer, analysisId]
  );

  const handleReset = useCallback(() => {
    // Complete timer and learn from decisions before resetting
    if (response) {
      timer.endPhase();
      timer.completeSession(response.revisions.length);
      learning.learnFromDecisions(response, decisions);
      // Auto-learn clauses from accepted revisions
      clauseLibrary.learnFromDecisions(
        response.revisions.map((r) => ({
          category: r.category,
          clauseNumber: r.clauseNumber,
          riskLevel: r.riskLevel,
          reason: r.reason,
          cleanReplacement: r.cleanReplacement,
        })),
        decisions
      );
      saveToHistory(response, decisions, chat.messages);
    }
    chat.clearChat();
    setDecisions([]);
    setDocumentText("");
    setShowInlineView(false);
    setShowShare(false);
    setShowVersionHistory(false);
    setShowComments(false);
    setShowAnalytics(false);
    setShowSideBySide(false);
    setShowTimeline(false);
    setShowTemplateCompare(false);
    setShowClauseLibrary(false);
    setShowTrackChangesImport(false);
    setShowConsistency(false);
    setShowDealBoard(false);
    setSelectedDealId(null);
    setComments([]);
    shortcuts.clearFocus();
    reset();
  }, [response, decisions, chat, learning, saveToHistory, reset, timer, shortcuts]);

  // Version save handler
  const handleSaveVersion = useCallback(() => {
    if (!response) return;
    const versions = versionHistory.getVersions(analysisId);
    versionHistory.saveVersion(
      analysisId,
      response.revisions,
      decisions,
      response.summary,
      response.riskFlags,
      `Round ${versions.length + 1}`
    );
    audit.logAction("analysis_viewed", analysisId, { action: "version_saved" });
  }, [response, decisions, analysisId, versionHistory, audit]);

  // Comment handlers
  const handleAddComment = useCallback(
    (content: string, revisionIndex?: number) => {
      const comment: AnalysisComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        analysisId,
        revisionIndex,
        userId: "local",
        userEmail: "You",
        content,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, comment]);
      audit.logAction("comment_added", analysisId, { revisionIndex });
    },
    [analysisId, audit]
  );

  const handleResolveComment = useCallback(
    (commentId: string) => {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, resolvedAt: new Date().toISOString() }
            : c
        )
      );
    },
    []
  );

  // Export audit
  const handleShare = useCallback(() => {
    setShowShare(true);
    audit.logAction("analysis_shared", analysisId);
  }, [analysisId, audit]);

  // Track changes DOCX export
  const handleTrackChangesExport = useCallback(async () => {
    if (!response || !documentText) return;
    timer.startPhase("export");
    try {
      const blob = await exportWithTrackChanges(
        documentText,
        response.revisions,
        decisions
      );
      downloadBlob(blob, `redline-track-changes-${Date.now()}.docx`);
      audit.logAction("analysis_exported", analysisId, { format: "docx_track_changes" });
    } catch {
      /* export failed silently */
    }
    timer.endPhase();
  }, [response, documentText, decisions, timer, audit, analysisId]);

  // Track changes import handler
  const handleTrackChangesImported = useCallback((result: DocxImportResult) => {
    if (result.plainText) {
      setDocumentText(result.plainText);
    }
  }, []);

  const contextualSuggestions = getContextualSuggestions();
  const currentVersions = versionHistory.getVersions(analysisId);
  const dealRounds = selectedDealId
    ? negotiation.getRoundsForDeal(selectedDealId)
    : [];
  const dealSummary = selectedDealId
    ? negotiation.getSummary(selectedDealId)
    : null;

  return (
    <Layout>
      <Helmet>
        <title>
          Lease Redlining Agent | Landlord Representation | TheDealCalc
        </title>
        <meta
          name="description"
          content="AI-powered commercial lease and LOI redlining tool for landlord representation. Institutional-grade analysis covering rent, TI, CAM, use clauses, and more."
        />
        <meta name="robots" content="index, follow" />
        <link
          rel="canonical"
          href="https://thedealcalc.com/lease-redline"
        />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-warm opacity-50" />
        <div className="relative container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light border border-primary/20 text-primary text-sm font-medium mb-4">
              <Shield className="h-4 w-4" />
              <span>Landlord Representation</span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Commercial Lease{" "}
              <span className="text-primary">Redlining Agent</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              AI-powered lease and LOI review from an institutional landlord
              perspective. Paste your document and receive detailed redline
              analysis covering rent structure, TI, CAM, use clauses, and more.
            </p>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-primary" />
                <span>Institutional Standards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" />
                <span>NOI Protection</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <span>Risk Flagging</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Top toolbar — always visible */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Button
              variant={showDealBoard ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1"
              onClick={() => setShowDealBoard(!showDealBoard)}
            >
              <Building2 className="h-3.5 w-3.5" />
              Deals
            </Button>
            <Button
              variant={showAnalytics ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </Button>
            <Button
              variant={showClauseLibrary ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1"
              onClick={() => setShowClauseLibrary(!showClauseLibrary)}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Clauses
            </Button>
            <Button
              variant={showTemplateCompare ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1"
              onClick={() => setShowTemplateCompare(!showTemplateCompare)}
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              Templates
            </Button>
            <Button
              variant={showTrackChangesImport ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1"
              onClick={() => setShowTrackChangesImport(!showTrackChangesImport)}
            >
              <FileUp className="h-3.5 w-3.5" />
              Import Changes
            </Button>
            <Button
              variant={showConsistency ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1"
              onClick={() => setShowConsistency(!showConsistency)}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Consistency
            </Button>
            {response && documentText && (
              <>
                <Button
                  variant={showSideBySide ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setShowSideBySide(!showSideBySide)}
                >
                  <Columns2 className="h-3.5 w-3.5" />
                  Side-by-Side
                </Button>
                <Button
                  variant={showTimeline ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setShowTimeline(!showTimeline)}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Timeline
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={handleTrackChangesExport}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Track Changes
                </Button>
              </>
            )}
          </div>

          {/* Top panels row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {showDealBoard && (
              <div className="md:col-span-1">
                <DealStatusBoard
                  deals={dealFolders.deals}
                  onCreateDeal={dealFolders.createDeal}
                  onUpdateDeal={dealFolders.updateDeal}
                  onDeleteDeal={dealFolders.deleteDeal}
                  onSelectDeal={setSelectedDealId}
                  selectedDealId={selectedDealId}
                />
              </div>
            )}
            {showAnalytics && (
              <div className="md:col-span-1">
                <RedlineAnalyticsDashboard
                  getAnalytics={timer.getAnalytics}
                  currentPhase={timer.currentPhase}
                  getElapsedMs={timer.getElapsedMs}
                  getSessionElapsedMs={timer.getSessionElapsedMs}
                  onClearHistory={timer.clearHistory}
                  onClose={() => setShowAnalytics(false)}
                />
              </div>
            )}
          </div>

          {/* Secondary panels */}
          {showClauseLibrary && (
            <div className="mb-6">
              <ClauseLibraryPanel
                clauses={clauseLibrary.clauses}
                onAddClause={clauseLibrary.addClause}
                onUpdateClause={clauseLibrary.updateClause}
                onDeleteClause={clauseLibrary.deleteClause}
                onExport={clauseLibrary.exportClauses}
                onImport={clauseLibrary.importClause}
                onClose={() => setShowClauseLibrary(false)}
              />
            </div>
          )}

          {showTemplateCompare && (
            <div className="mb-6">
              <TemplateComparisonPanel
                templates={templateComparison.templates}
                onCreateTemplate={templateComparison.createTemplate}
                onDeleteTemplate={templateComparison.deleteTemplate}
                onCompare={templateComparison.compareAgainstTemplate}
                documentText={documentText || undefined}
                onClose={() => setShowTemplateCompare(false)}
              />
            </div>
          )}

          {showTrackChangesImport && (
            <div className="mb-6">
              <TrackChangesImport
                onImportComplete={handleTrackChangesImported}
                onClose={() => setShowTrackChangesImport(false)}
              />
            </div>
          )}

          {/* Negotiation Timeline */}
          {showTimeline && selectedDealId && (
            <div className="mb-6">
              <NegotiationTimeline
                dealId={selectedDealId}
                rounds={dealRounds}
                summary={dealSummary}
                onCreateRound={negotiation.createRound}
                onUpdateStatus={negotiation.updateRoundStatus}
                onUpdateNotes={negotiation.updateRoundNotes}
                onDeleteRound={negotiation.deleteRound}
                onClose={() => setShowTimeline(false)}
              />
            </div>
          )}
          {showTimeline && !selectedDealId && (
            <div className="mb-6 p-4 rounded-lg border bg-muted/30 text-center text-sm text-muted-foreground">
              <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
              Select a deal from the Deal Pipeline to view its negotiation timeline.
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Learning indicator */}
          {learning.rules.length > 0 && !response && !isLoading && (
            <div className="mb-4 text-xs text-muted-foreground text-center">
              Agent has learned {learning.rules.length} rule{learning.rules.length !== 1 ? "s" : ""} from your feedback
            </div>
          )}

          {/* Progress indicator while loading */}
          {isLoading && (
            <div className="mb-6">
              <AnalysisProgress />
            </div>
          )}

          {/* Show input or output + panels */}
          {response ? (
            <div className="space-y-6">
              {/* Bulk Actions Toolbar */}
              <BulkActionsToolbar
                revisions={response.revisions}
                decisions={decisions}
                focusedIndex={shortcuts.focusedIndex}
                onBulkAcceptVisible={shortcuts.bulkAcceptVisible}
                onBulkRejectVisible={shortcuts.bulkRejectVisible}
                onBulkAcceptByRisk={shortcuts.bulkAcceptByRisk}
                onBulkRejectByRisk={shortcuts.bulkRejectByRisk}
                onBulkAcceptByCategory={shortcuts.bulkAcceptByCategory}
                onBulkRejectByCategory={shortcuts.bulkRejectByCategory}
                onResetAll={shortcuts.resetAllDecisions}
              />

              <RedlineOutput
                response={response}
                onReset={handleReset}
                decisions={decisions}
                onDecisionsChange={setDecisions}
                onShare={handleShare}
                onSaveVersion={handleSaveVersion}
                onViewInline={() => setShowInlineView(!showInlineView)}
                onViewHistory={() => setShowVersionHistory(!showVersionHistory)}
                onOpenComments={() => setShowComments(!showComments)}
              />

              {/* Side-by-Side View */}
              {showSideBySide && documentText && (
                <SideBySideView
                  originalText={documentText}
                  revisions={response.revisions}
                  decisions={decisions}
                  onClose={() => setShowSideBySide(false)}
                />
              )}

              {/* Inline Document View */}
              {showInlineView && documentText && (
                <InlineRedlineViewer
                  originalText={documentText}
                  revisions={response.revisions}
                  decisions={decisions}
                />
              )}

              {/* Cross-Document Consistency */}
              {showConsistency && (
                <ConsistencyCheckPanel
                  issues={[]}
                  onClose={() => setShowConsistency(false)}
                />
              )}

              {/* Version Comparison */}
              {showVersionHistory && (
                <VersionComparisonView
                  versions={currentVersions}
                  onCompare={(a, b) => versionHistory.compareVersions(analysisId, a, b)}
                  onClose={() => setShowVersionHistory(false)}
                />
              )}

              {/* Share Dialog */}
              {showShare && (
                <ShareDialog
                  response={response}
                  decisions={decisions}
                  onClose={() => setShowShare(false)}
                />
              )}

              {/* Comments */}
              {showComments && (
                <CollaborationPanel
                  comments={comments}
                  currentUserEmail="You"
                  onAddComment={handleAddComment}
                  onResolveComment={handleResolveComment}
                  onClose={() => setShowComments(false)}
                  revisionCount={response.revisions.length}
                />
              )}

              {/* Chat Panel — appears after analysis */}
              <ChatPanel
                messages={chat.messages}
                isLoading={chat.isLoading}
                error={chat.error}
                onSendMessage={chat.sendMessage}
                onClear={chat.clearChat}
                contextualSuggestions={contextualSuggestions}
              />
            </div>
          ) : (
            <LeaseInput onSubmit={handleSubmit} isLoading={isLoading} />
          )}
        </div>
      </section>

      {/* Features Grid */}
      {!response && !isLoading && (
        <section className="py-12 md:py-16 bg-cream-dark">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
              What the Agent Analyzes
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {FEATURE_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="p-5 rounded-xl bg-card border border-border shadow-card"
                >
                  <h3 className="font-semibold text-foreground mb-2">
                    {card.title}
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 shrink-0">
                          •
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}

const FEATURE_CARDS = [
  {
    title: "Rent & Economics",
    items: [
      "Base rent escalations (3%+ annual)",
      "FMV resets for renewal options",
      "CPI floors and caps",
      "Percentage rent structures",
      "Below-market option detection",
    ],
  },
  {
    title: "Tenant Improvements",
    items: [
      "Vanilla shell delivery scope",
      "TI allowance amortization (8%+ rate)",
      "Early termination repayment",
      "Specialty infrastructure allocation",
      "Landlord vs tenant work delineation",
    ],
  },
  {
    title: "Operating Expenses",
    items: [
      "CAM recoverability (NNN)",
      "Administrative fee inclusion (10-15%)",
      "Capital expenditure pass-throughs",
      "Audit rights and limitations",
      "Tax & insurance escalations",
    ],
  },
  {
    title: "Use & Exclusives",
    items: [
      "Permitted use breadth",
      "Exclusive scope restrictions",
      "Radius restriction analysis",
      "Co-tenancy clause review",
      "Dark rent provisions",
    ],
  },
  {
    title: "Risk & Liability",
    items: [
      "Assignment & subletting controls",
      "Guaranty requirements & burn-off",
      "Default & remedies (cross-default)",
      "Casualty & condemnation",
      "Insurance requirements (CGL, property)",
    ],
  },
  {
    title: "Document Types",
    items: [
      "Full lease agreements",
      "Letters of Intent (LOI)",
      "Amendments & addenda",
      "Work letters",
      "Guaranties & estoppels",
    ],
  },
];
