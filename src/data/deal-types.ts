export interface DealTypeData {
  name: string;
  slug: string;
  description: string;
  keyConsiderations: string[];
}

export const dealTypes: DealTypeData[] = [
  {
    name: "New Lease",
    slug: "new-lease",
    description: "New lease LOIs establish the complete landlord-tenant relationship from scratch, requiring thorough negotiation of every material provision. This is where tenants have the most leverage, as landlords are motivated to fill vacancy. Every clause should be negotiated before signing, as post-execution modifications are significantly harder to obtain.",
    keyConsiderations: [
      "Full buildout specifications and TI allowance with disbursement timeline",
      "Rent commencement date tied to delivery condition, not lease execution",
      "Security deposit structure with burn-down provisions over the term",
      "Personal or corporate guaranty scope and duration limitations",
      "Expansion and renewal option terms locked in at initial negotiation",
      "Landlord representations about building condition, zoning, and compliance",
      "Exclusive use and co-tenancy protections before committing to location",
    ],
  },
  {
    name: "Renewal",
    slug: "renewal",
    description: "Renewal LOIs negotiate the extension of an existing tenancy, where the tenant's installed improvements create switching costs that reduce leverage. Fair market rent resets are the primary battleground, and tenants should insist on objective determination methods. Renewal LOIs should also address deferred maintenance and refresh allowances.",
    keyConsiderations: [
      "Fair market rent determination method (broker opinions, arbitration, or formula)",
      "Refresh or refurbishment allowance for updating the space",
      "Holdover rate protection during renewal negotiation periods",
      "Updated operating expense base year or stop to reflect current costs",
      "Renewal of personal guaranty obligations and potential burn-off",
      "Right to audit prior-year operating expenses before committing",
      "Updated insurance requirements reflecting current market standards",
    ],
  },
  {
    name: "Amendment",
    slug: "amendment",
    description: "Amendment LOIs modify specific provisions of an existing lease while keeping the remainder intact. Precision is critical because ambiguous amendment language can create conflicting interpretations with the original lease. Amendments often trigger other lease provisions such as consent requirements or guaranty reactivation.",
    keyConsiderations: [
      "Specific identification of which lease sections are being modified",
      "Confirmation that all other lease terms remain unchanged",
      "Impact of amendment on existing guaranty or security deposit obligations",
      "Whether the amendment triggers landlord consent requirements from lenders",
      "Updated estoppel representations reflecting the amended terms",
      "Rent adjustment effective dates and proration methodology",
      "Confirmation of remaining renewal or expansion options post-amendment",
    ],
  },
  {
    name: "Sublease",
    slug: "sublease",
    description: "Sublease LOIs involve three-party dynamics between the master landlord, sublandlord, and subtenant. The subtenant's rights can never exceed what the master lease grants to the sublandlord. Consent from the master landlord is almost always required, and recapture rights may allow the landlord to terminate the master lease instead.",
    keyConsiderations: [
      "Master lease review to confirm subletting is permitted and consent standard",
      "Landlord recapture rights that could terminate the opportunity",
      "Sublease term cannot extend beyond the master lease expiration",
      "Pass-through of master lease obligations to the subtenant",
      "Direct recognition agreement or non-disturbance from the master landlord",
      "Allocation of TI costs between sublandlord and subtenant",
      "Step-in rights if the sublandlord defaults on the master lease",
    ],
  },
  {
    name: "Assignment",
    slug: "assignment",
    description: "Assignment LOIs transfer the tenant's entire interest in the lease to a new party, unlike subleases which create a separate subsidiary tenancy. The assigning tenant often remains liable unless the landlord grants a full release. Assignment provisions in the original lease control whether the landlord can withhold consent and under what standard.",
    keyConsiderations: [
      "Landlord consent standard: sole discretion vs. reasonable consent",
      "Release of assigning tenant from ongoing lease obligations",
      "Assignment transfer fee and any profit-sharing requirements",
      "Assignee financial qualification standards and documentation",
      "Assumption of existing security deposit and guaranty obligations",
      "Permitted transfer exceptions for affiliates and corporate restructuring",
      "Change of control provisions that may constitute a deemed assignment",
    ],
  },
  {
    name: "Expansion",
    slug: "expansion",
    description: "Expansion LOIs add adjacent or nearby space to an existing tenancy, raising questions about whether the new space should be on the same or separate lease terms. Rent blending between old and new space rates is a common negotiation point. Expansion LOIs should address construction disruption to existing operations during buildout of the new space.",
    keyConsiderations: [
      "Whether expansion space joins the existing lease or creates a new lease",
      "Rent blending methodology between existing and expansion space rates",
      "Co-terminus provisions aligning expiration dates across all space",
      "Construction disruption protection for ongoing business operations",
      "Expansion TI allowance and whether existing space gets a refresh",
      "Updated parking ratio to accommodate increased headcount",
      "Right of first offer or refusal for future adjacent vacancies",
    ],
  },
];
