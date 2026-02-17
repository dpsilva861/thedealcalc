/**
 * useNegotiationRounds — Tracks negotiation rounds per deal.
 *
 * Models the real workflow: Round 1 (your redline) → Round 2 (their response) →
 * Round 3 (your counter), with timing between rounds and status tracking.
 */

import { useState, useCallback } from "react";
import type {
  NegotiationRound,
  NegotiationSummary,
  RoundStatus,
  RoundParty,
} from "@/lib/lease-redline/types";

const STORAGE_KEY = "lease-redline-negotiation-rounds";
const MAX_ROUNDS_PER_DEAL = 50;

function loadAllRounds(): NegotiationRound[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAllRounds(rounds: NegotiationRound[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds));
  } catch {
    /* storage full */
  }
}

export function useNegotiationRounds() {
  const [rounds, setRounds] = useState<NegotiationRound[]>(loadAllRounds);

  const persist = useCallback((updated: NegotiationRound[]) => {
    setRounds(updated);
    saveAllRounds(updated);
  }, []);

  /** Get all rounds for a specific deal, ordered by round number */
  const getRoundsForDeal = useCallback(
    (dealId: string): NegotiationRound[] => {
      return rounds
        .filter((r) => r.dealId === dealId)
        .sort((a, b) => a.roundNumber - b.roundNumber);
    },
    [rounds]
  );

  /** Create a new round */
  const createRound = useCallback(
    (
      dealId: string,
      party: RoundParty,
      opts?: { analysisId?: string; documentText?: string; notes?: string }
    ): string => {
      const dealRounds = rounds.filter((r) => r.dealId === dealId);
      if (dealRounds.length >= MAX_ROUNDS_PER_DEAL) {
        throw new Error("Maximum rounds reached for this deal");
      }

      const roundNumber =
        dealRounds.length > 0
          ? Math.max(...dealRounds.map((r) => r.roundNumber)) + 1
          : 1;

      const id = `round_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const round: NegotiationRound = {
        id,
        dealId,
        roundNumber,
        party,
        status: party === "us" ? "drafting" : "received",
        analysisId: opts?.analysisId,
        documentText: opts?.documentText,
        revisionsAccepted: 0,
        revisionsRejected: 0,
        revisionsOpen: 0,
        notes: opts?.notes,
        receivedAt: party === "counterparty" ? now : undefined,
        createdAt: now,
        updatedAt: now,
      };

      persist([round, ...rounds]);
      return id;
    },
    [rounds, persist]
  );

  /** Update a round's status */
  const updateRoundStatus = useCallback(
    (roundId: string, status: RoundStatus) => {
      const now = new Date().toISOString();
      persist(
        rounds.map((r) => {
          if (r.id !== roundId) return r;
          return {
            ...r,
            status,
            sentAt: status === "sent" ? now : r.sentAt,
            updatedAt: now,
          };
        })
      );
    },
    [rounds, persist]
  );

  /** Update round revision counts (after user accepts/rejects) */
  const updateRoundCounts = useCallback(
    (
      roundId: string,
      counts: { accepted: number; rejected: number; open: number }
    ) => {
      persist(
        rounds.map((r) => {
          if (r.id !== roundId) return r;
          return {
            ...r,
            revisionsAccepted: counts.accepted,
            revisionsRejected: counts.rejected,
            revisionsOpen: counts.open,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [rounds, persist]
  );

  /** Update round notes */
  const updateRoundNotes = useCallback(
    (roundId: string, notes: string) => {
      persist(
        rounds.map((r) => {
          if (r.id !== roundId) return r;
          return { ...r, notes, updatedAt: new Date().toISOString() };
        })
      );
    },
    [rounds, persist]
  );

  /** Delete a round */
  const deleteRound = useCallback(
    (roundId: string) => {
      persist(rounds.filter((r) => r.id !== roundId));
    },
    [rounds, persist]
  );

  /** Get a summary of the negotiation for a deal */
  const getSummary = useCallback(
    (dealId: string): NegotiationSummary | null => {
      const dealRounds = getRoundsForDeal(dealId);
      if (dealRounds.length === 0) return null;

      const current = dealRounds[dealRounds.length - 1];

      // Calculate elapsed days from first round
      const firstCreated = new Date(dealRounds[0].createdAt).getTime();
      const elapsedDays = Math.round(
        (Date.now() - firstCreated) / (1000 * 60 * 60 * 24)
      );

      // Calculate avg response time between rounds
      const responseTimes: number[] = [];
      for (let i = 1; i < dealRounds.length; i++) {
        const prev = dealRounds[i - 1];
        const curr = dealRounds[i];
        const prevTime = prev.sentAt || prev.createdAt;
        const currTime = curr.receivedAt || curr.createdAt;
        const diffMs =
          new Date(currTime).getTime() - new Date(prevTime).getTime();
        if (diffMs > 0) {
          responseTimes.push(diffMs / (1000 * 60 * 60 * 24));
        }
      }
      const avgResponseTimeDays =
        responseTimes.length > 0
          ? Math.round(
              (responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length) * 10
            ) / 10
          : 0;

      // Count concessions (rounds where revisions were accepted)
      const ourRounds = dealRounds.filter((r) => r.party === "us");
      const theirRounds = dealRounds.filter((r) => r.party === "counterparty");
      const concessionsMade = ourRounds.reduce(
        (s, r) => s + r.revisionsAccepted,
        0
      );
      const concessionsReceived = theirRounds.reduce(
        (s, r) => s + r.revisionsAccepted,
        0
      );

      return {
        dealId,
        totalRounds: dealRounds.length,
        currentRound: current.roundNumber,
        currentParty: current.party,
        currentStatus: current.status,
        elapsedDays,
        avgResponseTimeDays,
        concessionsMade,
        concessionsReceived,
      };
    },
    [getRoundsForDeal]
  );

  return {
    rounds,
    getRoundsForDeal,
    createRound,
    updateRoundStatus,
    updateRoundCounts,
    updateRoundNotes,
    deleteRound,
    getSummary,
  };
}
