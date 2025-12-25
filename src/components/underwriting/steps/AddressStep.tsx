import { useUnderwriting } from "@/contexts/UnderwritingContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { useZipLookup } from "@/hooks/useZipLookup";
import { useCallback, useRef } from "react";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export function AddressStep() {
  const { propertyAddress, updatePropertyAddress } = useUnderwriting();
  const lastZipRef = useRef(propertyAddress.zipCode);
  
  const { lookupZip, markFieldAsUserEdited, notFound, clearNotFound } = useZipLookup({
    onAutoFill: useCallback((city: string, state: string) => {
      updatePropertyAddress({ city, state });
    }, [updatePropertyAddress]),
  });

  // Handle ZIP code changes
  const handleZipChange = useCallback(
    async (value: string) => {
      const cleanedZip = value.replace(/\D/g, "").slice(0, 5);
      updatePropertyAddress({ zipCode: cleanedZip });
      
      // Only lookup if ZIP changed and has 5 digits
      if (cleanedZip.length === 5 && cleanedZip !== lastZipRef.current) {
        lastZipRef.current = cleanedZip;
        await lookupZip(cleanedZip);
      } else if (cleanedZip.length < 5) {
        // Clear not found if ZIP becomes invalid
        clearNotFound();
      }
    },
    [lookupZip, updatePropertyAddress, clearNotFound]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">
            Property Address
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter the property location to save and identify this analysis
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Street Address *</Label>
          <Input
            id="address"
            name="address-line1"
            autoComplete="address-line1"
            placeholder="123 Main Street"
            value={propertyAddress.address}
            onChange={(e) => updatePropertyAddress({ address: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              name="address-level2"
              autoComplete="address-level2"
              placeholder="Austin"
              value={propertyAddress.city}
              onChange={(e) => {
                markFieldAsUserEdited("city");
                updatePropertyAddress({ city: e.target.value });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <select
              id="state"
              name="address-level1"
              autoComplete="address-level1"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={propertyAddress.state}
              onChange={(e) => {
                markFieldAsUserEdited("state");
                updatePropertyAddress({ state: e.target.value });
              }}
            >
              <option value="">Select</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              name="postal-code"
              autoComplete="postal-code"
              placeholder="78701"
              maxLength={5}
              value={propertyAddress.zipCode}
              onChange={(e) => handleZipChange(e.target.value)}
            />
            {notFound && (
              <p className="text-xs text-muted-foreground">
                ZIP not recognized—enter City/State manually.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Your analysis will be saved to your account so you can access it later.
          We collect ZIP codes to help understand market activity.
        </p>
      </div>
    </div>
  );
}
