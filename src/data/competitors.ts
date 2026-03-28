export interface CompetitorData {
  name: string;
  slug: string;
  price: string;
  description: string;
  prosForThem: string[];
  consForThem: string[];
  redlineiqAdvantage: string;
}

export const competitors: CompetitorData[] = [
  {
    name: "Gavel",
    slug: "gavel-exec",
    price: "$500+/month",
    description: "Gavel is a legal workflow automation platform designed for law firms and legal departments. It focuses on document assembly and contract automation across many practice areas, rather than specializing in commercial real estate LOIs.",
    prosForThem: [
      "Broad document automation capabilities across legal practice areas",
      "Integration with existing law firm workflow and billing systems",
      "Custom template building for repeat document types",
    ],
    consForThem: [
      "Not specialized in commercial real estate LOI analysis",
      "Requires significant setup and template configuration",
      "Pricing designed for law firms, not individual CRE professionals",
    ],
    redlineiqAdvantage: "RedlineIQ is purpose-built for CRE LOI redlining with industry-specific benchmarks, market-standard comparisons, and a self-learning engine that improves with every LOI analyzed. No setup required, just upload and get results for $2 per document.",
  },
  {
    name: "Spellbook",
    slug: "spellbook",
    price: "$300+/month",
    description: "Spellbook is a generalist AI contract review tool that works across all contract types. While capable of reviewing many document formats, it lacks the specialized CRE knowledge needed to benchmark LOI provisions against market standards.",
    prosForThem: [
      "Handles many different contract types beyond just leases",
      "Microsoft Word integration for in-document suggestions",
      "AI-powered clause suggestions from a broad training set",
    ],
    consForThem: [
      "No CRE-specific market benchmarks or industry standards",
      "Monthly subscription cost adds up for occasional users",
      "Generic AI suggestions lack property-type-specific context",
    ],
    redlineiqAdvantage: "RedlineIQ provides CRE-specific analysis that understands the difference between retail co-tenancy requirements and industrial clear height standards. Our self-learning engine continuously improves from real CRE transactions, not generic contract data.",
  },
  {
    name: "Manual Review",
    slug: "manual-review",
    price: "$500-2,000+ per review",
    description: "Traditional manual LOI review by a commercial real estate attorney or experienced broker. While thorough, manual review is time-consuming and expensive, with turnaround times measured in days rather than seconds.",
    prosForThem: [
      "Deep human judgment and relationship context",
      "Ability to handle unusual or complex deal structures",
      "Direct negotiation support and strategy advice",
    ],
    consForThem: [
      "Costs $500 to $2,000+ per review depending on complexity",
      "Turnaround time is typically 2 to 5 business days",
      "Quality varies significantly between individual reviewers",
    ],
    redlineiqAdvantage: "RedlineIQ delivers institutional-grade redlines in 60 seconds for $2, making it 250x to 1,000x more cost-effective than manual review. Use RedlineIQ for first-pass analysis, then bring your attorney in for final negotiation strategy.",
  },
  {
    name: "CoCounsel",
    slug: "cocounsel",
    price: "$500+/month",
    description: "CoCounsel is an AI legal assistant from a major legal technology company, designed for law firms handling diverse practice areas. It provides general contract analysis but is not optimized for the specific nuances of commercial real estate LOI negotiation.",
    prosForThem: [
      "Backed by a large legal technology platform with extensive resources",
      "Handles research, drafting, and review across practice areas",
      "Integration with legal research databases",
    ],
    consForThem: [
      "Enterprise pricing is prohibitive for individual CRE professionals",
      "General-purpose AI lacks CRE-specific market benchmarks",
      "No self-learning from commercial real estate transaction data",
    ],
    redlineiqAdvantage: "RedlineIQ costs $2 per document with zero subscription commitment. Our AI is trained specifically on CRE LOI provisions with benchmarks for every property type, and gets smarter with every document processed through our self-learning engine.",
  },
  {
    name: "In-House Legal",
    slug: "in-house-legal",
    price: "$150,000+/year (salary)",
    description: "Hiring an in-house counsel or adding CRE lease review to existing legal staff. While providing dedicated attention, the cost of a full-time position far exceeds what most CRE teams need for LOI review volume.",
    prosForThem: [
      "Dedicated resource with deep knowledge of your portfolio",
      "Available for ongoing negotiation support and strategy",
      "Consistent review standards across all transactions",
    ],
    consForThem: [
      "Salary, benefits, and overhead exceed $150,000 per year",
      "Single person creates bottleneck and vacation/illness coverage gaps",
      "Limited exposure to diverse deal structures across markets",
    ],
    redlineiqAdvantage: "RedlineIQ provides institutional-grade LOI analysis at a fraction of the cost. At $2 per document, a team could analyze 75,000 LOIs per year for the cost of one junior associate. RedlineIQ also learns from thousands of transactions across markets, providing broader benchmarking than any single reviewer.",
  },
];
