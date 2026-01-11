/**
 * Consent Provider Component
 * 
 * Wraps the app to provide consent context.
 * Renders the consent banner and manages script gating.
 */

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useConsentManager } from '@/hooks/useConsentManager';
import { ConsentBanner } from './ConsentBanner';
import { ConsentState, ConsentCategory, isCMPEnabled } from '@/config/cmp';

interface ConsentContextValue {
  /** Current consent state */
  consent: ConsentState;
  /** Whether analytics consent is granted */
  hasAnalytics: boolean;
  /** Whether marketing/ads consent is granted */
  hasMarketing: boolean;
  /** Whether consent is being loaded */
  isLoading: boolean;
  /** Open preferences modal (for footer link) */
  openPreferences: () => void;
}

const ConsentContext = createContext<ConsentContextValue>({
  consent: {
    categories: { necessary: true, analytics: false, marketing: false },
    timestamp: 0,
    version: '1.0.0',
    explicit: false,
  },
  hasAnalytics: false,
  hasMarketing: false,
  isLoading: true,
  openPreferences: () => {},
});

export function useConsent(): ConsentContextValue {
  return useContext(ConsentContext);
}

interface ConsentProviderProps {
  children: ReactNode;
}

export function ConsentProvider({ children }: ConsentProviderProps) {
  const {
    consent,
    hasAnalytics,
    hasMarketing,
    showBanner,
    isLoading,
    acceptAll,
    rejectAll,
    updateConsent,
    openPreferences,
  } = useConsentManager();

  // Log consent state in dev
  useEffect(() => {
    if (import.meta.env.DEV && !isLoading) {
      console.log('[ConsentProvider] Consent state:', {
        analytics: hasAnalytics,
        marketing: hasMarketing,
        explicit: consent.explicit,
        cmpEnabled: isCMPEnabled(),
      });
    }
  }, [hasAnalytics, hasMarketing, consent.explicit, isLoading]);

  const contextValue: ConsentContextValue = {
    consent,
    hasAnalytics,
    hasMarketing,
    isLoading,
    openPreferences,
  };

  return (
    <ConsentContext.Provider value={contextValue}>
      {children}
      {isCMPEnabled() && (
        <ConsentBanner
          show={showBanner}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onUpdateConsent={updateConsent}
          currentConsent={consent.categories}
        />
      )}
    </ConsentContext.Provider>
  );
}

/**
 * Hook to check if a script category should load
 */
export function useConsentGate(category: ConsentCategory): boolean {
  const { consent, isLoading } = useConsent();
  
  // Don't load until consent is resolved
  if (isLoading) return false;
  
  // Necessary always allowed
  if (category === 'necessary') return true;
  
  return consent.categories[category] ?? false;
}
