import { useState, useCallback } from "react";
import type { DealFolder, DealDocument, DocumentType } from "@/lib/lease-redline/types";

const DEALS_KEY = "lease-redline-deals";
const MAX_DEALS = 50;

/**
 * Local-first hook for managing multi-document deal folders.
 * Stores deal folders and their documents in localStorage.
 */
export function useDealFolders() {
  const [deals, setDealsState] = useState<DealFolder[]>(() => {
    try {
      const stored = localStorage.getItem(DEALS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist deals to localStorage
  const persistDeals = (next: DealFolder[]): DealFolder[] => {
    try {
      localStorage.setItem(DEALS_KEY, JSON.stringify(next));
    } catch {
      // localStorage full or unavailable
    }
    return next;
  };

  // Create a new deal folder
  const createDeal = useCallback(
    (
      name: string,
      propertyAddress?: string,
      tenantName?: string,
      jurisdiction?: string
    ): string => {
      const id = `deal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const now = new Date().toISOString();

      const newDeal: DealFolder = {
        id,
        name,
        propertyAddress,
        tenantName,
        documents: [],
        createdAt: now,
        updatedAt: now,
        jurisdiction,
      };

      setDealsState((prev) => {
        const next = [newDeal, ...prev].slice(0, MAX_DEALS);
        return persistDeals(next);
      });

      return id;
    },
    []
  );

  // Update fields on a deal folder
  const updateDeal = useCallback(
    (dealId: string, updates: Partial<DealFolder>) => {
      setDealsState((prev) => {
        const next = prev.map((deal) =>
          deal.id === dealId
            ? { ...deal, ...updates, id: deal.id, updatedAt: new Date().toISOString() }
            : deal
        );
        return persistDeals(next);
      });
    },
    []
  );

  // Delete a deal folder and all its documents
  const deleteDeal = useCallback((dealId: string) => {
    setDealsState((prev) => {
      const next = prev.filter((deal) => deal.id !== dealId);
      return persistDeals(next);
    });
  }, []);

  // Add a document to a deal folder
  const addDocument = useCallback(
    (dealId: string, fileName: string, documentType: DocumentType): string => {
      const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const newDoc: DealDocument = {
        id: docId,
        dealId,
        documentType,
        fileName,
        uploadedAt: new Date().toISOString(),
        status: "pending",
      };

      setDealsState((prev) => {
        const next = prev.map((deal) =>
          deal.id === dealId
            ? {
                ...deal,
                documents: [...deal.documents, newDoc],
                updatedAt: new Date().toISOString(),
              }
            : deal
        );
        return persistDeals(next);
      });

      return docId;
    },
    []
  );

  // Remove a document from a deal folder
  const removeDocument = useCallback((dealId: string, documentId: string) => {
    setDealsState((prev) => {
      const next = prev.map((deal) =>
        deal.id === dealId
          ? {
              ...deal,
              documents: deal.documents.filter((doc) => doc.id !== documentId),
              updatedAt: new Date().toISOString(),
            }
          : deal
      );
      return persistDeals(next);
    });
  }, []);

  // Update a document's status and optional analysisId
  const updateDocumentStatus = useCallback(
    (
      dealId: string,
      documentId: string,
      status: DealDocument["status"],
      analysisId?: string
    ) => {
      setDealsState((prev) => {
        const next = prev.map((deal) =>
          deal.id === dealId
            ? {
                ...deal,
                documents: deal.documents.map((doc) =>
                  doc.id === documentId
                    ? { ...doc, status, ...(analysisId !== undefined ? { analysisId } : {}) }
                    : doc
                ),
                updatedAt: new Date().toISOString(),
              }
            : deal
        );
        return persistDeals(next);
      });
    },
    []
  );

  // Get a single deal by id
  const getDeal = useCallback(
    (dealId: string): DealFolder | null => {
      return deals.find((deal) => deal.id === dealId) ?? null;
    },
    [deals]
  );

  return {
    deals,
    createDeal,
    updateDeal,
    deleteDeal,
    addDocument,
    removeDocument,
    updateDocumentStatus,
    getDeal,
  };
}
