import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Coins, 
  Wrench, 
  CreditCard, 
  FileBarChart,
  ArrowRight,
  CheckCircle2,
  Calculator,
  TrendingUp,
  PieChart,
  Download
} from "lucide-react";

export default function HowItWorks() {
  const inputSteps = [
    {
      icon: Calculator,
      title: "Choose Your Calculator",
      description: "Select from our suite of free tools: Quick Underwrite, BRRRR, or Syndication analysis.",
      fields: ["Quick Underwrite", "BRRRR Method", "Syndication"]
    },
    {
      icon: Building2,
      title: "Property Details",
      description: "Enter purchase price, closing costs, hold period, and exit assumptions.",
      fields: ["Purchase Price", "Closing Costs", "Hold Period", "Exit Cap Rate"]
    },
    {
      icon: Coins,
      title: "Income & Expenses",
      description: "Define rents, vacancy rates, operating expenses, and growth projections.",
      fields: ["Monthly Rent", "Vacancy Rate", "Operating Costs", "Growth Rate"]
    },
    {
      icon: CreditCard,
      title: "Financing Terms",
      description: "Model your debt with LTV, interest rate, amortization, and loan terms.",
      fields: ["Loan-to-Value", "Interest Rate", "Amortization", "Loan Term"]
    },
    {
      icon: Wrench,
      title: "Renovation (Optional)",
      description: "Add renovation budgets and timelines for value-add strategies.",
      fields: ["Reno Budget", "Timeline", "ARV", "Refinance Terms"]
    },
    {
      icon: FileBarChart,
      title: "Get Results",
      description: "Instantly view your analysis and export to PDF, CSV, or Excel—all free.",
      fields: ["View Results", "Export PDF", "Download CSV", "Save Excel"]
    },
  ];

  const outputs = [
    {
      icon: TrendingUp,
      title: "Key Metrics",
      items: ["IRR (Annualized)", "Cash-on-Cash Return", "Equity Multiple", "DSCR & Cap Rates"]
    },
    {
      icon: PieChart,
      title: "Cash Flow Analysis",
      items: ["Monthly Projections", "Annual Summary", "NOI Breakdown", "Debt Service Schedule"]
    },
    {
      icon: Calculator,
      title: "Deal Comparison",
      items: ["Side-by-Side Analysis", "Sensitivity Tables", "Scenario Modeling", "Breakeven Points"]
    },
    {
      icon: Download,
      title: "Free Exports",
      items: ["Professional PDF Report", "CSV Spreadsheet", "Excel Download", "No Account Required"]
    },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-cream-dark">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            How DealCalc Works
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A straightforward, step-by-step process to analyze any residential investment deal 
            with professional-grade accuracy.
          </p>
        </div>
      </section>

      {/* Input Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Six Simple Steps
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our guided wizard walks you through every input. Tooltips explain each field 
              so you always know what to enter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {inputSteps.map((step, index) => (
              <div 
                key={step.title}
                className="p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-elevated transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sage-light text-primary text-lg font-bold">
                    {index + 1}
                  </div>
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {step.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {step.fields.map((field) => (
                    <span 
                      key={field}
                      className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              What You Get
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comprehensive analysis with all the metrics and insights you need to make 
              informed investment decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {outputs.map((output) => (
              <div 
                key={output.title}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <output.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-4">{output.title}</h3>
                <ul className="space-y-2">
                  {output.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Note */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light text-primary text-sm font-medium mb-6">
              Your Data, Your Control
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground mb-6">
              Privacy by Design
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              All calculations run entirely in your browser. We never store your deal data. 
              Export your results to PDF, CSV, or Excel and take them with you.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/underwrite">
                Start Analyzing
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
