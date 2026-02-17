/**
 * Jurisdiction-specific lease law rules.
 *
 * These get injected into the system prompt when a jurisdiction is selected,
 * so the AI agent applies state-specific legal considerations.
 */

export interface JurisdictionRule {
  state: string;
  rules: string[];
}

const JURISDICTION_RULES: Record<string, string[]> = {
  California: [
    "California Civil Code §1951.2 governs landlord remedies upon tenant abandonment — ensure lease preserves all statutory remedies.",
    "Prop 13 implications: property tax reassessment on ownership change can significantly impact CAM pass-throughs.",
    "California requires specific seismic/earthquake disclosure for commercial properties in certain zones.",
    "AB 1482 (Tenant Protection Act) does not apply to commercial leases, but mixed-use properties may have residential components subject to rent control.",
    "California courts strictly construe forfeiture provisions — ensure cure periods and notice requirements comply with CCP §1161.",
    "Enforceability of personal guaranties: California anti-deficiency protections do not apply to lease guaranties.",
    "CEQA (California Environmental Quality Act) compliance may affect permitted use clauses.",
    "California's strict environmental liability (Health & Safety Code §25300+) — ensure indemnification covers hazardous materials thoroughly.",
  ],
  "New York": [
    "NYC commercial rent tax (CRT) applies to tenants in Manhattan south of 96th St with annual rent >$250K — verify tax responsibility allocation.",
    "New York Real Property Law §235-b (implied warranty of habitability) does not apply to commercial leases, but ensure lease explicitly disclaims.",
    "NYC Commercial Tenant Harassment laws (Local Law 186) — certain provisions may limit landlord conduct.",
    "NYC zoning (ZR) is highly specific — use clauses must align with Certificate of Occupancy and zoning district.",
    "New York lien law §3 gives contractors lien rights — ensure lease requires tenant to bond or discharge liens promptly.",
    "NYC Local Law 97 (Climate Mobilization Act) — carbon emission caps may affect building operations and cost pass-throughs.",
    "NYC Department of Buildings violations can trigger lease defaults — address compliance obligations carefully.",
    "Yellowstone injunctions: New York courts may grant tenants injunctions to prevent lease termination — build in proper cure mechanics.",
  ],
  Texas: [
    "Texas Property Code §93 governs commercial landlord liens — Texas provides strong statutory lien rights; ensure lease preserves them.",
    "Texas does not impose state income tax, but franchise tax (margin tax) may affect certain lease structures.",
    "Texas is a 'tenant-friendly' state regarding security deposits for commercial — no statutory cap but specific return requirements.",
    "Texas courts enforce 'as-is' clauses strictly in commercial leases — ensure property condition disclaimers are clear.",
    "Texas Property Code §91.006 — commercial lease may provide for landlord's lockout remedy; verify compliance.",
    "No rent control in Texas (preempted by state law) — full freedom on rent escalation structures.",
    "Texas mechanic's lien law is aggressive — require bonding for TI work exceeding threshold amounts.",
  ],
  Florida: [
    "Florida Statute §83.001+ governs commercial landlord-tenant relationships with specific notice requirements.",
    "Florida has no state income tax — favorable for tenant recruiting but doesn't affect lease structure directly.",
    "Hurricane/windstorm insurance is critical — verify adequate coverage requirements and deductible allocations.",
    "Florida's construction lien law (Chapter 713) — require Notice of Commencement filing and bonding for TI work.",
    "Florida's favorable landlord remedy provisions — ensure lease preserves right to accelerate rent upon default.",
    "Flood zone considerations: require flood insurance if property is in FEMA flood zone; allocate cost appropriately.",
    "Florida sales tax on commercial rent (currently 5.5% state + county surtax) — ensure lease clearly allocates this obligation to tenant.",
  ],
  Illinois: [
    "Chicago Landlord-Tenant Ordinance (RLTO) generally does not apply to commercial leases, but verify for mixed-use properties.",
    "Illinois Mechanic's Lien Act (770 ILCS 60/) — require lien waivers for all TI construction payments.",
    "Cook County has additional real estate transfer tax implications for lease assignments treated as transfers.",
    "Chicago building code compliance is aggressive — ensure lease allocates code upgrade costs appropriately.",
    "Illinois court precedent strongly enforces lease-as-written — explicit terms prevail over implied obligations.",
    "Chicago zoning for cannabis, liquor, and adult uses is highly restrictive — use clauses must be specific.",
  ],
  "New Jersey": [
    "New Jersey commercial tenant protections under NJSA 2A:18-61.1+ require specific notice periods for eviction.",
    "NJ environmental liability (ISRA — Industrial Site Recovery Act) may require cleanup before property transfer or lease termination.",
    "New Jersey imposes corporation business tax that may affect guarantor analysis for corporate tenants.",
    "NJ courts may apply unconscionability doctrine to commercial leases — avoid overreaching penalty provisions.",
  ],
  Massachusetts: [
    "Massachusetts commercial lease law allows landlord's lien only if specifically created in the lease agreement.",
    "Boston zoning (Article 80) requires large-project review — verify permitted use alignment with BPDA approvals.",
    "Massachusetts environmental cleanup (MGL Ch. 21E) — ensure comprehensive environmental indemnification.",
    "Triple-decker and mixed-use considerations: if any residential component, different rules may apply.",
  ],
  Georgia: [
    "Georgia Landlord-Tenant Act (OCGA §44-7) provides framework but allows extensive commercial lease freedom.",
    "Georgia is a 'landlord-friendly' state — broad enforcement of lease terms as written.",
    "Georgia's distress warrant procedure allows landlord to seize tenant property for unpaid rent — preserve this remedy in lease.",
    "Atlanta BeltLine TAD and other tax allocation districts may affect property tax projections.",
  ],
  Pennsylvania: [
    "Pennsylvania Landlord and Tenant Act of 1951 provides basic framework for commercial leases.",
    "Philadelphia Business Income and Receipts Tax (BIRT) — may affect tenant financial covenants.",
    "PA Mechanics' Lien Law — require lien waivers and bonding for construction exceeding $500.",
    "Philadelphia wage tax implications for tenant employees — consider in use/occupancy provisions.",
  ],
  Washington: [
    "Washington state does not impose personal income tax, but B&O (business & occupation) tax applies to commercial activities.",
    "Seattle's commercial rent assistance programs and displacement protections for small businesses — verify applicability.",
    "Washington's strict environmental liability (MTCA) — ensure comprehensive environmental indemnification provisions.",
    "Seattle energy benchmarking requirements — address compliance and cost allocation in CAM provisions.",
  ],
  Colorado: [
    "Colorado's commercial lease law provides broad freedom of contract — enforce terms as written.",
    "Denver's Green Building Ordinance may require energy efficiency upgrades — allocate costs in lease.",
    "Colorado's construction defect statute (CRS 13-20-802.5) may affect TI warranty provisions.",
    "Water rights considerations for properties with irrigation or landscaping — address in CAM or separately.",
  ],
};

// Fallback rules for states without specific entries
const DEFAULT_RULES = [
  "Verify compliance with applicable state landlord-tenant statutes for commercial leases.",
  "Check state-specific mechanics' lien requirements and ensure lease addresses contractor lien risk.",
  "Verify environmental liability allocation complies with state environmental cleanup statutes.",
  "Confirm notice requirements for default, termination, and rent acceleration comply with state law.",
  "Review state-specific rules on security deposit handling for commercial tenants.",
];

/**
 * Get jurisdiction-specific rules for injection into the system prompt.
 */
export function getJurisdictionRules(jurisdiction: string): string[] {
  return JURISDICTION_RULES[jurisdiction] || DEFAULT_RULES;
}

/**
 * Format jurisdiction rules as a prompt injection string.
 */
export function formatJurisdictionPrompt(jurisdiction: string): string {
  const rules = getJurisdictionRules(jurisdiction);
  return `
JURISDICTION-SPECIFIC RULES — ${jurisdiction.toUpperCase()}:
Apply these state-specific legal considerations in your analysis:
${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

When a revision involves a provision that has jurisdiction-specific implications, reference the applicable rule in your rationale.`;
}

/**
 * Get all jurisdictions that have specific rules defined.
 */
export function getJurisdictionsWithRules(): string[] {
  return Object.keys(JURISDICTION_RULES);
}
