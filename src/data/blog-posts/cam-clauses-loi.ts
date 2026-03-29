import { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "cam-clauses-loi",
  title: "CAM Clauses in LOIs: What Landlords Must Watch For",
  metaDescription: "Learn how to negotiate CAM clauses in commercial LOIs. Covers NNN structures, CAM caps, gross-up provisions, and admin fees landlords must protect.",
  category: "Negotiation Strategy",
  publishedDate: "2026-03-17",
  relatedSlugs: ["loi-checklist-provisions", "loi-mistakes-landlords"],
  faqs: [
    {
      question: "What is a CAM cap and why is it risky for landlords?",
      answer: "A CAM cap is a ceiling on the amount a tenant pays for common area maintenance in a given year. For example, a 3% annual cap on a $12/sf CAM charge means the maximum increase the tenant pays is $0.36/sf per year. If actual costs jump 8% due to a repaving project or utility spike, the landlord absorbs every dollar above that 3% threshold. Over a 10-year lease, those absorbed overages can total six figures on a mid-size retail property."
    },
    {
      question: "Should landlords ever agree to CAM caps?",
      answer: "In competitive markets, some form of CAM protection may be necessary to close a deal with a strong credit tenant. If you must agree to a cap, negotiate it as a cumulative cap rather than a compounding annual cap, exclude uncontrollable expenses like taxes and insurance, and set the base year at actual costs rather than estimated costs. A 5% cumulative cap with proper exclusions is far less dangerous than a 3% compounding cap that includes everything."
    },
    {
      question: "What expenses should always be excluded from a CAM cap?",
      answer: "Real estate taxes and property insurance should always be excluded from any CAM cap because landlords have no control over these costs. Tax reassessments, special assessments, and insurance premium increases driven by market conditions or catastrophic events are entirely outside a landlord's influence. Including them under a cap transfers that uncontrollable risk entirely to the landlord."
    }
  ],
  content: `## Understanding NNN Lease Structures and CAM

Before diving into the specifics of [CAM](/glossary#cam) clauses in LOIs, it helps to ground the conversation in how a [triple net (NNN)](/glossary#nnn) lease actually works. In a NNN structure, the tenant pays base rent plus a pro-rata share of three categories of [operating expenses](/glossary#operating-expenses): real estate taxes, property insurance, and common area maintenance. The landlord collects these as additional rent, typically through monthly estimated payments that are reconciled annually against actual costs.

The pro-rata share is calculated by dividing the tenant's leased square footage by the total leasable area of the building or project. A tenant occupying 3,000 square feet in a 30,000-square-foot retail center pays 10% of the total operating expenses. Simple enough on the surface, but the devil is in the details of what gets included in those expenses, how they are calculated, and what protections each party negotiates at the LOI stage.

CAM charges specifically cover the costs of maintaining shared areas: parking lot repairs and sweeping, landscaping, snow removal, common area lighting, exterior building maintenance, signage upkeep, security, and similar items. In a well-managed 50,000-square-foot neighborhood retail center, total CAM charges might run $6 to $14 per square foot depending on the market, age of the property, and level of service. That is a material number. On a 5,000-square-foot space, the tenant could be paying $30,000 to $70,000 annually in CAM alone, on top of base rent, taxes, and insurance.

## Administrative Fees: Protecting Your Management Overhead

Every landlord incurs real costs to administer CAM billing, coordinate vendors, supervise maintenance, and manage the reconciliation process. The standard approach is to include an administrative fee, typically 10% to 15% of total CAM charges, to compensate for this overhead. This is separate from any property management fee, which covers day-to-day building operations.

Tenants, especially those represented by experienced counsel, will frequently push to cap administrative fees at a fixed dollar amount or reduce the percentage to 5% or lower. Resist this. The administrative fee is directly tied to the volume of work required. If CAM costs increase because the property needs more maintenance, the administrative burden increases proportionally. A fixed cap on admin fees means you subsidize that increased workload out of your own pocket.

Language to watch for in a tenant's redline: "Landlord's administrative fee shall not exceed 5% of controllable CAM charges." That single sentence does two things that hurt you. First, it cuts the percentage below market. Second, by applying it only to "controllable" charges, it eliminates the fee on pass-throughs like taxes and insurance that still require administrative effort to bill and reconcile.

Your LOI should state the administrative fee as a clear percentage of total operating expenses without a cap: "An administrative fee equal to 15% of total operating expenses shall be included in Tenant's pro-rata share." If a tenant pushes back, 10% is a reasonable floor, but do not go lower and do not agree to a fixed dollar cap.

## Why CAM Caps Are Dangerous for Landlords

A CAM cap limits the annual increase in CAM charges that can be passed through to a tenant. On the surface, it sounds reasonable. Tenants want predictability in their occupancy costs, and landlords want to close deals. But the math tells a different story.

Consider a property with current CAM charges of $12 per square foot. The tenant negotiates a 3% annual cap. In year one, the maximum the tenant pays is $12/sf. In year two, the cap allows $12.36/sf. In year three, $12.73/sf. That looks manageable until you factor in what actually happens to property costs.

Parking lot resurfacing on a 200-space lot costs $40,000 to $80,000. A single winter with heavy snowfall can spike snow removal costs by 40% to 60%. Insurance premiums after a regional weather event can jump 15% to 25% in a single renewal cycle. When any of these events occur, actual CAM charges may increase 8% to 12% in a single year. With a 3% cap in place, the landlord absorbs every dollar above that threshold.

Here is the compounding problem. Once you fall behind the cap, you never catch up. If actual costs jump 10% in year three but the cap only allows 3%, you are 7% behind. Year four's cap is calculated on the capped amount, not the actual amount. That gap between actual costs and what you can bill widens every single year. Over a 10-year lease on a 5,000-square-foot space, a 3% cap on $12/sf CAM that experiences just two years of above-average cost increases can cost the landlord $25,000 to $50,000 in unrecoverable expenses.

If you are reviewing an LOI that includes a CAM cap, flag it immediately. For strategies on catching these and other critical provisions, see our [LOI checklist](/blog/loi-checklist-provisions).

## Base Year Stops vs Expense Stops

An alternative to a hard CAM cap is the base year stop, sometimes called an expense stop. Under this structure, the landlord sets a base year (typically the first year of the lease or the prior calendar year) and the tenant pays their pro-rata share of any operating expense increases above that base year amount. The landlord effectively absorbs the base year costs within the rent, and the tenant only pays escalations.

This structure is more common in office leases than retail, but it appears in LOIs across property types. From the landlord's perspective, the critical issue is how the base year is set. If the base year uses actual expenses from a year when the building was only 60% occupied, those expenses will be artificially low. When the building fills up and expenses normalize, the tenant benefits from a depressed baseline and the landlord absorbs a disproportionate share of costs.

The solution is a gross-up provision. Gross-up language adjusts variable operating expenses as if the building were 95% occupied, regardless of actual occupancy. This prevents tenants from benefiting from a low-occupancy base year. Your LOI should include language like: "Base year operating expenses shall be adjusted to reflect occupancy of not less than 95% of the rentable area of the building."

Without the gross-up, a tenant signing a lease in a building at 50% occupancy gets a windfall. Common area utility costs, janitorial expenses, and similar variable charges are lower at half occupancy. When the building reaches 90% occupancy, those costs increase substantially, and the tenant's share of the increase above the (artificially low) base year becomes much larger than if the base year had been properly grossed up.

## Controllable vs Uncontrollable Expenses

One of the most important distinctions in any CAM clause is the difference between controllable and uncontrollable expenses. This distinction matters because if you agree to any form of cap, you need to ensure it applies only to expenses you can actually control.

**Controllable expenses** include items the landlord can manage through vendor selection, maintenance scheduling, and operational decisions: landscaping, parking lot sweeping, common area cleaning, exterior painting, general repairs, and similar items. A landlord can choose to bid out the landscaping contract, defer non-critical repairs, or find a less expensive snow removal vendor.

**Uncontrollable expenses** include real estate taxes, property insurance, and utility costs (where rates are set by the municipality or utility provider). A landlord cannot negotiate a lower property tax assessment simply because their CAM cap is approaching its limit. Insurance premiums are set by underwriters based on claims history, property age, and regional risk factors entirely outside the landlord's control.

The rule is simple: taxes and insurance should always be excluded from any CAM cap. If a tenant insists on a cap, agree only to a cap on controllable expenses and carve out taxes, insurance, and any government-mandated charges. This is one of the most common [mistakes landlords make](/blog/loi-mistakes-landlords) when they accept CAM cap language without reading the fine print.

## Gross-Up Provisions: Why They Matter

Gross-up provisions protect landlords from undercharging tenants in partially occupied buildings. Without a gross-up, variable expenses that fluctuate with occupancy (utilities, janitorial, elevator maintenance in multi-story buildings) get passed through at their actual, below-normal levels. The tenant pays less than they would in a fully occupied building, and the landlord cannot recoup the difference.

A proper gross-up clause adjusts variable operating expenses to reflect what they would be if the building were 95% occupied. The 95% standard (rather than 100%) acknowledges that some level of vacancy is normal. This adjustment applies to both the base year calculation and ongoing annual reconciliations.

Here is a practical example. A 100,000-square-foot office building is 60% occupied. Actual common area utility costs are $180,000. Grossed up to 95% occupancy, those costs would be approximately $285,000. A tenant occupying 10,000 square feet (10% pro-rata share) pays $28,500 in grossed-up utility charges rather than $18,000 in actual charges. The difference of $10,500 is not profit for the landlord. It reflects the tenant's fair share of what those costs will be as the building leases up.

## Common Exclusions Tenants Try to Negotiate

Experienced tenant counsel will attempt to exclude certain categories from the definition of operating expenses. Some exclusions are reasonable and market standard. Others are overreaches that reduce your cost recovery. Here are the most common:

- **Capital expenditures.** Tenants argue that major capital projects (roof replacement, HVAC system overhaul, parking structure repairs) should be the landlord's responsibility and not passed through as CAM. The market compromise is to amortize capital expenditures over their useful life and pass through only the annual amortized portion.
- **Management fees above 3%.** Tenants may try to cap the management fee pass-through at 3% of gross revenue. Market standard for management fees ranges from 3% to 6% depending on property type and size. If your actual management fee is 5%, accepting a 3% cap means you eat 2% out of your net operating income.
- **Leasing commissions.** These should typically be excluded from operating expenses because they benefit the landlord, not the existing tenants. Most institutional landlords already exclude leasing commissions, so agreeing to this exclusion is standard.
- **Costs of correcting code violations existing at lease commencement.** This is a reasonable exclusion. Pre-existing conditions are the landlord's responsibility.
- **Costs reimbursed by insurance proceeds.** Also reasonable. You should not be double-recovering costs.

The danger is when a tenant's counsel bundles reasonable exclusions with unreasonable ones in a single redline, hoping you will accept the package without scrutiny. Review each exclusion individually. For a comprehensive look at every provision you should be checking, see the [LOI checklist](/blog/loi-checklist-provisions).

## Specific Language to Include in Your LOI

Strong CAM language in the LOI prevents expensive lease negotiations later. Here are key phrases your LOI should contain:

### Operating Expense Definition

"Operating expenses shall include all costs and expenses incurred by Landlord in connection with the ownership, management, maintenance, repair, and operation of the Property, including but not limited to common area maintenance, real estate taxes, assessments, property insurance, utilities, and an administrative fee of 15% of total operating expenses."

### Gross-Up Provision

"In any calendar year in which the Building is less than 95% occupied, variable operating expenses shall be adjusted to reflect costs that would have been incurred had the Building been 95% occupied."

### CAM Cap Carve-Out (if you must accept a cap)

"Any cap on operating expense increases shall apply solely to controllable operating expenses. Real estate taxes, property insurance, utilities, snow and ice removal, and government-mandated charges shall be excluded from any such cap and passed through at actual cost."

### Reconciliation Timing

"Landlord shall provide an annual reconciliation of estimated operating expense payments against actual operating expenses within 120 days following the end of each calendar year. Tenant shall pay any shortfall or receive a credit for any overpayment within 30 days of reconciliation."

## How CREagentic Catches CAM Issues

When you submit an LOI to CREagentic, the platform analyzes every CAM-related provision against institutional standards. It flags missing gross-up language, identifies uncapped administrative fees that should be defined, highlights CAM cap proposals that lack proper exclusions for uncontrollable expenses, and notes when capital expenditure amortization language is absent. Every flagged issue includes an explanation of why it matters and suggested counter-language, so you know exactly what to push back on and how. Visit the [glossary](/glossary) for definitions of all key terms discussed in this article.`
};
