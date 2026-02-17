/**
 * Learning Engine for the Lease Redline Agent
 *
 * Captures feedback signals (accept/reject decisions, chat corrections,
 * parsing failures), derives rules from patterns, and produces instructions
 * that are injected into future analysis prompts — so the agent improves
 * over time without manual intervention.
 *
 * Storage: localStorage (local-first), with optional Supabase sync.
 */

// ── Types ────────────────────────────────────────────────────────────

export type RuleType =
  | "avoid"      // Don't flag / don't change this kind of thing
  | "prefer"     // User prefers a certain approach
  | "correct"    // Fix a known mistake the agent keeps making
  | "enforce";   // Always apply this rule going forward

export type SignalKind =
  | "revision_accepted"
  | "revision_rejected"
  | "revision_modified"
  | "chat_correction"    // User told the agent it was wrong in chat
  | "parse_failure"      // Agent returned unparseable output
  | "too_aggressive"     // User flagged the redline as too heavy
  | "missing_issue";     // User pointed out something the agent missed

export interface LearnedRule {
  id: string;
  type: RuleType;
  category: string;      // e.g. "rent", "TI", "CAM", "assignment", "style"
  trigger: string;       // short description of what fires this rule
  instruction: string;   // what to tell the agent
  confidence: number;    // 0-1, increases with repeated signals
  occurrences: number;   // how many times this pattern was observed
  createdAt: string;
  lastTriggered: string;
}

export interface FeedbackSignal {
  kind: SignalKind;
  category?: string;         // clause category
  clauseNumber?: number;
  riskLevel?: string;
  detail?: string;           // free-text context (e.g. user's chat message)
  originalInstruction?: string;  // what the agent originally said
  userCorrection?: string;       // what the user wanted instead
}

// ── Storage Keys ─────────────────────────────────────────────────────

const RULES_KEY = "lease-redline-learned-rules";
const SIGNALS_KEY = "lease-redline-signals-buffer";
const RULE_DERIVATION_THRESHOLD = 2; // signals needed before a rule is created
const MAX_RULES = 50;
const MAX_BUFFERED_SIGNALS = 200;

// ── Helpers ──────────────────────────────────────────────────────────

function generateId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable — silently degrade
  }
}

// ── Core Engine ──────────────────────────────────────────────────────

/**
 * Get all learned rules from storage.
 */
export function getLearnedRules(): LearnedRule[] {
  return loadJSON<LearnedRule[]>(RULES_KEY, []);
}

/**
 * Save the full rules list.
 */
export function saveLearnedRules(rules: LearnedRule[]): void {
  saveJSON(RULES_KEY, rules.slice(0, MAX_RULES));
}

/**
 * Get the buffered signals awaiting pattern analysis.
 */
export function getSignalBuffer(): FeedbackSignal[] {
  return loadJSON<FeedbackSignal[]>(SIGNALS_KEY, []);
}

/**
 * Record a new feedback signal and trigger rule derivation.
 * Returns any newly created or updated rules.
 */
export function recordSignal(signal: FeedbackSignal): LearnedRule[] {
  const buffer = getSignalBuffer();
  buffer.push(signal);
  saveJSON(SIGNALS_KEY, buffer.slice(-MAX_BUFFERED_SIGNALS));

  // Attempt to derive rules from accumulated signals
  return deriveRules(buffer);
}

/**
 * Record a batch of signals at once (e.g. after an analysis is completed
 * and the user has made accept/reject decisions on all revisions).
 */
export function recordSignalBatch(signals: FeedbackSignal[]): LearnedRule[] {
  const buffer = getSignalBuffer();
  buffer.push(...signals);
  saveJSON(SIGNALS_KEY, buffer.slice(-MAX_BUFFERED_SIGNALS));
  return deriveRules(buffer);
}

// ── Rule Derivation ──────────────────────────────────────────────────

/**
 * Analyze accumulated signals and derive new rules or strengthen existing ones.
 */
function deriveRules(signals: FeedbackSignal[]): LearnedRule[] {
  const rules = getLearnedRules();
  const newOrUpdated: LearnedRule[] = [];

  // Pattern 1: Repeated rejections in the same category → "avoid" rule
  deriveFromRejections(signals, rules, newOrUpdated);

  // Pattern 2: Chat corrections → "correct" rule
  deriveFromChatCorrections(signals, rules, newOrUpdated);

  // Pattern 3: "too aggressive" signals → "prefer" rule for lighter touch
  deriveFromAggressivenessSignals(signals, rules, newOrUpdated);

  // Pattern 4: Missing issues → "enforce" rule
  deriveFromMissingIssues(signals, rules, newOrUpdated);

  // Pattern 5: Consistent acceptance patterns → "prefer" rule
  deriveFromAcceptancePatterns(signals, rules, newOrUpdated);

  // Save updated rules
  if (newOrUpdated.length > 0) {
    saveLearnedRules(rules);
  }

  return newOrUpdated;
}

function deriveFromRejections(
  signals: FeedbackSignal[],
  rules: LearnedRule[],
  newOrUpdated: LearnedRule[]
): void {
  const rejections = signals.filter((s) => s.kind === "revision_rejected");
  const byCat = groupBy(rejections, (s) => s.category || "unknown");

  for (const [category, catSignals] of Object.entries(byCat)) {
    if (catSignals.length < RULE_DERIVATION_THRESHOLD) continue;

    const existing = rules.find(
      (r) => r.type === "avoid" && r.category === category
    );

    if (existing) {
      existing.occurrences += catSignals.length;
      existing.confidence = Math.min(0.95, existing.confidence + 0.05 * catSignals.length);
      existing.lastTriggered = new Date().toISOString();
      newOrUpdated.push(existing);
    } else {
      const rule: LearnedRule = {
        id: generateId(),
        type: "avoid",
        category,
        trigger: `User rejected ${catSignals.length}+ revisions in "${category}" category`,
        instruction: `Be more conservative with "${category}" revisions. The user has rejected multiple suggestions in this area — only flag genuinely critical issues, not minor improvements.`,
        confidence: Math.min(0.7, 0.3 + 0.1 * catSignals.length),
        occurrences: catSignals.length,
        createdAt: new Date().toISOString(),
        lastTriggered: new Date().toISOString(),
      };
      rules.push(rule);
      newOrUpdated.push(rule);
    }
  }
}

function deriveFromChatCorrections(
  signals: FeedbackSignal[],
  rules: LearnedRule[],
  newOrUpdated: LearnedRule[]
): void {
  const corrections = signals.filter((s) => s.kind === "chat_correction");

  for (const signal of corrections) {
    if (!signal.detail) continue;

    // Check if we already have a similar correction rule
    const existing = rules.find(
      (r) =>
        r.type === "correct" &&
        r.category === (signal.category || "general") &&
        r.trigger.toLowerCase().includes(signal.detail!.toLowerCase().slice(0, 30))
    );

    if (existing) {
      existing.occurrences++;
      existing.confidence = Math.min(0.95, existing.confidence + 0.1);
      existing.lastTriggered = new Date().toISOString();
      newOrUpdated.push(existing);
    } else {
      const rule: LearnedRule = {
        id: generateId(),
        type: "correct",
        category: signal.category || "general",
        trigger: signal.detail.slice(0, 100),
        instruction: signal.userCorrection
          ? `When handling "${signal.category || "general"}" clauses: ${signal.userCorrection}`
          : `User corrected the agent regarding: ${signal.detail.slice(0, 200)}. Adjust approach accordingly.`,
        confidence: 0.5,
        occurrences: 1,
        createdAt: new Date().toISOString(),
        lastTriggered: new Date().toISOString(),
      };
      rules.push(rule);
      newOrUpdated.push(rule);
    }
  }
}

function deriveFromAggressivenessSignals(
  signals: FeedbackSignal[],
  rules: LearnedRule[],
  newOrUpdated: LearnedRule[]
): void {
  const aggressive = signals.filter((s) => s.kind === "too_aggressive");

  if (aggressive.length < RULE_DERIVATION_THRESHOLD) return;

  const existing = rules.find(
    (r) => r.type === "prefer" && r.category === "style"
  );

  if (existing) {
    existing.occurrences += aggressive.length;
    existing.confidence = Math.min(0.95, existing.confidence + 0.1);
    existing.lastTriggered = new Date().toISOString();
    newOrUpdated.push(existing);
  } else {
    const rule: LearnedRule = {
      id: generateId(),
      type: "prefer",
      category: "style",
      trigger: `User flagged ${aggressive.length}+ revisions as too aggressive`,
      instruction:
        "User prefers a less aggressive approach. Focus redlines on genuinely problematic clauses. Do not flag standard market provisions as issues. When in doubt, leave the original language intact.",
      confidence: Math.min(0.8, 0.4 + 0.1 * aggressive.length),
      occurrences: aggressive.length,
      createdAt: new Date().toISOString(),
      lastTriggered: new Date().toISOString(),
    };
    rules.push(rule);
    newOrUpdated.push(rule);
  }
}

function deriveFromMissingIssues(
  signals: FeedbackSignal[],
  rules: LearnedRule[],
  newOrUpdated: LearnedRule[]
): void {
  const missing = signals.filter((s) => s.kind === "missing_issue");

  for (const signal of missing) {
    if (!signal.detail) continue;

    const rule: LearnedRule = {
      id: generateId(),
      type: "enforce",
      category: signal.category || "general",
      trigger: signal.detail.slice(0, 100),
      instruction: `Always check for and flag: ${signal.detail.slice(0, 200)}. This was previously missed and the user requires it.`,
      confidence: 0.6,
      occurrences: 1,
      createdAt: new Date().toISOString(),
      lastTriggered: new Date().toISOString(),
    };
    rules.push(rule);
    newOrUpdated.push(rule);
  }
}

function deriveFromAcceptancePatterns(
  signals: FeedbackSignal[],
  rules: LearnedRule[],
  newOrUpdated: LearnedRule[]
): void {
  const accepted = signals.filter((s) => s.kind === "revision_accepted");
  const byCat = groupBy(accepted, (s) => s.category || "unknown");

  for (const [category, catSignals] of Object.entries(byCat)) {
    if (catSignals.length < 3) continue;

    const existing = rules.find(
      (r) => r.type === "prefer" && r.category === category && r.trigger.includes("accepted")
    );

    if (existing) {
      existing.occurrences += catSignals.length;
      existing.confidence = Math.min(0.95, existing.confidence + 0.03 * catSignals.length);
      existing.lastTriggered = new Date().toISOString();
      newOrUpdated.push(existing);
    } else {
      const rule: LearnedRule = {
        id: generateId(),
        type: "prefer",
        category,
        trigger: `User accepted ${catSignals.length}+ revisions in "${category}"`,
        instruction: `User consistently accepts "${category}" revisions. Continue thorough review of this area — the user values these suggestions.`,
        confidence: Math.min(0.7, 0.3 + 0.05 * catSignals.length),
        occurrences: catSignals.length,
        createdAt: new Date().toISOString(),
        lastTriggered: new Date().toISOString(),
      };
      rules.push(rule);
      newOrUpdated.push(rule);
    }
  }
}

// ── Prompt Injection ─────────────────────────────────────────────────

/**
 * Format learned rules as additional instructions for the system prompt.
 * Only includes rules with sufficient confidence.
 */
export function formatRulesForPrompt(minConfidence = 0.4): string {
  const rules = getLearnedRules().filter(
    (r) => r.confidence >= minConfidence
  );

  if (rules.length === 0) return "";

  const sorted = [...rules].sort((a, b) => b.confidence - a.confidence);

  const lines = sorted.map((r) => {
    const prefix =
      r.type === "avoid"
        ? "AVOID"
        : r.type === "enforce"
          ? "ALWAYS"
          : r.type === "correct"
            ? "CORRECTION"
            : "PREFERENCE";
    return `- [${prefix}] (${r.category}) ${r.instruction}`;
  });

  return `\nLEARNED RULES FROM USER FEEDBACK (apply these):
${lines.join("\n")}`;
}

/**
 * Detect correction signals from a chat message.
 * Returns a signal if the message appears to correct the agent.
 */
export function detectChatCorrection(
  userMessage: string,
  previousAssistantMessage?: string
): FeedbackSignal | null {
  const lower = userMessage.toLowerCase();

  const correctionPhrases = [
    "that's wrong",
    "that's incorrect",
    "that is wrong",
    "that is incorrect",
    "you're wrong",
    "you are wrong",
    "not correct",
    "too aggressive",
    "too much redlining",
    "too many changes",
    "don't change",
    "don't flag",
    "don't touch",
    "leave it",
    "leave that",
    "keep the original",
    "not an issue",
    "that's fine as is",
    "that's standard",
    "that's market",
    "you missed",
    "you didn't catch",
    "you overlooked",
    "should have flagged",
    "why didn't you",
  ];

  const matched = correctionPhrases.find((p) => lower.includes(p));
  if (!matched) return null;

  // Classify the signal
  let kind: SignalKind = "chat_correction";
  if (
    lower.includes("too aggressive") ||
    lower.includes("too much") ||
    lower.includes("too many")
  ) {
    kind = "too_aggressive";
  } else if (
    lower.includes("you missed") ||
    lower.includes("didn't catch") ||
    lower.includes("overlooked") ||
    lower.includes("should have") ||
    lower.includes("why didn't")
  ) {
    kind = "missing_issue";
  }

  return {
    kind,
    detail: userMessage.slice(0, 300),
    originalInstruction: previousAssistantMessage?.slice(0, 200),
    userCorrection: userMessage.slice(0, 300),
  };
}

/**
 * Build signals from a set of revision decisions.
 * Call this when the user finishes reviewing an analysis.
 */
export function buildDecisionSignals(
  revisions: { category?: string; clauseNumber: number; riskLevel?: string; reason: string }[],
  decisions: string[]
): FeedbackSignal[] {
  const signals: FeedbackSignal[] = [];

  for (let i = 0; i < revisions.length; i++) {
    const rev = revisions[i];
    const decision = decisions[i];
    if (!decision || decision === "pending") continue;

    signals.push({
      kind:
        decision === "accepted"
          ? "revision_accepted"
          : decision === "rejected"
            ? "revision_rejected"
            : "revision_modified",
      category: rev.category || "other",
      clauseNumber: rev.clauseNumber,
      riskLevel: rev.riskLevel,
      detail: rev.reason,
    });
  }

  return signals;
}

/**
 * Remove a rule by ID.
 */
export function removeRule(ruleId: string): void {
  const rules = getLearnedRules().filter((r) => r.id !== ruleId);
  saveLearnedRules(rules);
}

/**
 * Clear all learned rules and signals (full reset).
 */
export function clearAllLearning(): void {
  saveJSON(RULES_KEY, []);
  saveJSON(SIGNALS_KEY, []);
}

/**
 * Decay confidence of rules that haven't been triggered recently.
 * Call periodically (e.g. on app load) to prevent stale rules.
 */
export function decayStaleRules(maxAgeDays = 30): void {
  const rules = getLearnedRules();
  const now = Date.now();
  let changed = false;

  for (const rule of rules) {
    const lastTriggered = new Date(rule.lastTriggered).getTime();
    const ageDays = (now - lastTriggered) / (1000 * 60 * 60 * 24);

    if (ageDays > maxAgeDays) {
      rule.confidence = Math.max(0.1, rule.confidence * 0.8);
      changed = true;
    }
  }

  // Remove rules that have decayed below usefulness
  const filtered = rules.filter((r) => r.confidence >= 0.15);
  if (changed || filtered.length < rules.length) {
    saveLearnedRules(filtered);
  }
}

// ── Utility ──────────────────────────────────────────────────────────

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}
