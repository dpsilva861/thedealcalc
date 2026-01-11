/**
 * Consent Banner Component
 * 
 * GDPR/CCPA compliant consent banner with:
 * - Accept All / Reject All buttons
 * - Manage Preferences option
 * - Accessible (keyboard nav, ARIA, focus trap)
 * - No layout shift (fixed position)
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, Settings, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ConsentCategory } from '@/config/cmp';

interface ConsentBannerProps {
  show: boolean;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onUpdateConsent: (categories: Partial<Record<ConsentCategory, boolean>>) => void;
  currentConsent: Record<ConsentCategory, boolean>;
}

export function ConsentBanner({
  show,
  onAcceptAll,
  onRejectAll,
  onUpdateConsent,
  currentConsent,
}: ConsentBannerProps) {
  const [showPreferences, setShowPreferences] = useState(false);
  const [localConsent, setLocalConsent] = useState(currentConsent);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Sync local state when props change
  useEffect(() => {
    setLocalConsent(currentConsent);
  }, [currentConsent]);

  // Focus trap when banner is shown
  useEffect(() => {
    if (show && bannerRef.current) {
      const firstButton = bannerRef.current.querySelector('button');
      firstButton?.focus();
    }
  }, [show]);

  if (!show) return null;

  const handleSavePreferences = () => {
    onUpdateConsent(localConsent);
  };

  const toggleCategory = (category: ConsentCategory) => {
    if (category === 'necessary') return; // Can't toggle necessary
    setLocalConsent(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[9999]",
        "bg-background border-t border-border shadow-lg",
        "animate-in slide-in-from-bottom duration-300",
        "print:hidden"
      )}
    >
      <div className="container mx-auto max-w-4xl px-4 py-4 sm:py-6">
        {!showPreferences ? (
          // Simple banner view
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <h2 id="consent-title" className="text-sm font-semibold text-foreground">
                  We value your privacy
                </h2>
                <p id="consent-description" className="text-sm text-muted-foreground mt-1">
                  We use cookies for analytics and advertising. You can accept all, reject non-essential, or{' '}
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    manage preferences
                  </button>.
                  See our{' '}
                  <Link to="/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link to="/ad-tech-providers" className="underline hover:text-foreground">
                    Ad Partners
                  </Link>.
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={onRejectAll}
                className="flex-1 sm:flex-none"
              >
                Reject All
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onAcceptAll}
                className="flex-1 sm:flex-none"
              >
                Accept All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="hidden sm:flex"
                aria-label="Manage cookie preferences"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          // Preferences view
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="consent-title" className="text-base font-semibold text-foreground flex items-center gap-2">
                <Settings className="w-5 h-5" aria-hidden="true" />
                Cookie Preferences
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(false)}
                aria-label="Close preferences"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {/* Necessary - always on */}
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex-1">
                  <Label className="text-sm font-medium text-foreground">
                    Necessary
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Required for the website to function. Cannot be disabled.
                  </p>
                </div>
                <Switch checked disabled aria-label="Necessary cookies (always enabled)" />
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex-1">
                  <Label htmlFor="analytics-switch" className="text-sm font-medium text-foreground">
                    Analytics
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Help us understand how visitors use our site (Google Analytics).
                  </p>
                </div>
                <Switch
                  id="analytics-switch"
                  checked={localConsent.analytics}
                  onCheckedChange={() => toggleCategory('analytics')}
                  aria-label="Analytics cookies"
                />
              </div>

              {/* Marketing/Ads */}
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <Label htmlFor="marketing-switch" className="text-sm font-medium text-foreground">
                    Marketing & Ads
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show personalized ads and measure ad performance (Google AdSense).
                  </p>
                </div>
                <Switch
                  id="marketing-switch"
                  checked={localConsent.marketing}
                  onCheckedChange={() => toggleCategory('marketing')}
                  aria-label="Marketing cookies"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRejectAll}
                className="flex-1"
              >
                Reject All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSavePreferences}
                className="flex-1"
              >
                Save Preferences
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onAcceptAll}
                className="flex-1"
              >
                Accept All
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
