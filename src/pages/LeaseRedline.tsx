import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { LeaseInput } from "@/components/lease-redline/LeaseInput";
import { RedlineOutput } from "@/components/lease-redline/RedlineOutput";
import { useLeaseRedline } from "@/hooks/useLeaseRedline";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Scale, AlertTriangle } from "lucide-react";

export default function LeaseRedline() {
  const { isLoading, error, response, analyze, reset } = useLeaseRedline();

  return (
    <Layout>
      <Helmet>
        <title>
          Lease Redlining Agent | Landlord Representation | TheDealCalc
        </title>
        <meta
          name="description"
          content="AI-powered commercial lease and LOI redlining tool for landlord representation. Institutional-grade analysis covering rent, TI, CAM, use clauses, and more."
        />
        <meta name="robots" content="index, follow" />
        <link
          rel="canonical"
          href="https://thedealcalc.com/lease-redline"
        />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-warm opacity-50" />
        <div className="relative container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light border border-primary/20 text-primary text-sm font-medium mb-4">
              <Shield className="h-4 w-4" />
              <span>Landlord Representation</span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Commercial Lease{" "}
              <span className="text-primary">Redlining Agent</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              AI-powered lease and LOI review from an institutional landlord
              perspective. Paste your document and receive detailed redline
              analysis covering rent structure, TI, CAM, use clauses, and more.
            </p>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-primary" />
                <span>Institutional Standards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" />
                <span>NOI Protection</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <span>Risk Flagging</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Show input or output */}
          {response ? (
            <RedlineOutput response={response} onReset={reset} />
          ) : (
            <LeaseInput onSubmit={analyze} isLoading={isLoading} />
          )}
        </div>
      </section>

      {/* Features Grid */}
      {!response && (
        <section className="py-12 md:py-16 bg-cream-dark">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
              What the Agent Analyzes
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {FEATURE_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="p-5 rounded-xl bg-card border border-border shadow-card"
                >
                  <h3 className="font-semibold text-foreground mb-2">
                    {card.title}
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 shrink-0">
                          •
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}

const FEATURE_CARDS = [
  {
    title: "Rent & Economics",
    items: [
      "Base rent escalations (3%+ annual)",
      "FMV resets for renewal options",
      "CPI floors and caps",
      "Percentage rent structures",
      "Below-market option detection",
    ],
  },
  {
    title: "Tenant Improvements",
    items: [
      "Vanilla shell delivery scope",
      "TI allowance amortization",
      "Early termination repayment",
      "Specialty infrastructure allocation",
      "Landlord vs tenant work delineation",
    ],
  },
  {
    title: "Operating Expenses",
    items: [
      "CAM recoverability",
      "Administrative fee inclusion",
      "Capital expenditure pass-throughs",
      "Audit rights and limitations",
      "Tax & insurance escalations",
    ],
  },
  {
    title: "Use & Exclusives",
    items: [
      "Permitted use breadth",
      "Exclusive scope restrictions",
      "Radius restriction analysis",
      "Co-tenancy clause review",
      "Dark rent provisions",
    ],
  },
  {
    title: "Risk & Liability",
    items: [
      "Assignment & subletting controls",
      "Guaranty requirements",
      "Default & remedies",
      "Casualty & condemnation",
      "Insurance requirements",
    ],
  },
  {
    title: "Document Types",
    items: [
      "Full lease agreements",
      "Letters of Intent (LOI)",
      "Amendments & addenda",
      "Work letters",
      "Guaranties & estoppels",
    ],
  },
];
