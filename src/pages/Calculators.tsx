/**
 * Calculators Hub Page
 * 
 * SEO-optimized landing page listing all available calculators
 * with internal links, descriptions, and structured data.
 */

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CALCULATORS } from '@/lib/calculators/registry';
import { CalculatorMetadata } from '@/lib/calculators/types';
import { 
  Home, 
  RefreshCcw, 
  Users, 
  Calculator, 
  Building2, 
  Building, 
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

// Icon mapping for calculator icons
const iconMap: Record<string, React.ElementType> = {
  Home,
  RefreshCcw,
  Users,
  Calculator,
  Building2,
  Building,
};

function CalculatorCard({ calculator }: { calculator: CalculatorMetadata }) {
  const Icon = iconMap[calculator.icon] || Calculator;
  const isAvailable = calculator.status === 'available';

  return (
    <Card className={`h-full transition-all ${isAvailable ? 'hover:shadow-lg hover:border-primary/30' : 'opacity-75'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          {!isAvailable && (
            <Badge variant="secondary" className="text-xs">
              Coming Soon
            </Badge>
          )}
          {isAvailable && calculator.tier === 'basic' && (
            <Badge variant="outline" className="text-xs text-primary border-primary/30">
              Free
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg mt-3">{calculator.name}</CardTitle>
        <CardDescription>{calculator.shortDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {calculator.description}
        </p>
        {isAvailable ? (
          <Button asChild className="w-full">
            <Link to={calculator.path}>
              Open Calculator
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        ) : (
          <Button variant="secondary" disabled className="w-full">
            Coming Soon
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function Calculators() {
  const availableCalculators = CALCULATORS.filter(c => c.status === 'available');
  const comingSoonCalculators = CALCULATORS.filter(c => c.status === 'coming_soon');

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://thedealcalc.com/" },
          { "@type": "ListItem", "position": 2, "name": "Calculators", "item": "https://thedealcalc.com/calculators" }
        ]
      },
      {
        "@type": "CollectionPage",
        "name": "Real Estate Investment Calculators",
        "description": "Free real estate calculators for rental properties, BRRRR deals, syndications, NPV analysis, cap rates, and more.",
        "url": "https://thedealcalc.com/calculators",
        "mainEntity": {
          "@type": "ItemList",
          "itemListElement": availableCalculators.map((calc, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "name": calc.name,
            "url": `https://thedealcalc.com${calc.path}`,
            "description": calc.description,
          }))
        }
      }
    ]
  };

  return (
    <Layout>
      <Helmet>
        <title>Real Estate Investment Calculators (Free) — TheDealCalc</title>
        <meta name="description" content="Free real estate calculators: rental property analysis, BRRRR deals, syndication waterfalls, NPV, cap rates, cash-on-cash. No signup required." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/calculators" />
        <meta property="og:title" content="Real Estate Investment Calculators (Free) — TheDealCalc" />
        <meta property="og:description" content="Free real estate calculators for rental properties, BRRRR deals, syndications, and more. Export to PDF, Excel." />
        <meta property="og:url" content="https://thedealcalc.com/calculators" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light border border-primary/20 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>100% Free • No Signup Required</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Real Estate Investment Calculators
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Professional-grade analysis tools for rental properties, BRRRR deals, syndications, 
              and investment decisions. Export to PDF, Excel, Word, or PowerPoint.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>30-Year Projections</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Sensitivity Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Multi-Format Export</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Calculators */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">
            Available Calculators
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {availableCalculators.map((calc) => (
              <CalculatorCard key={calc.id} calculator={calc} />
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      {comingSoonCalculators.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">
              Coming Soon
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {comingSoonCalculators.map((calc) => (
                <CalculatorCard key={calc.id} calculator={calc} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SEO Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6">
            About Our Real Estate Calculators
          </h2>
          <div className="prose prose-slate max-w-none">
            <p>
              TheDealCalc provides professional-grade real estate investment calculators designed 
              for investors, agents, and analysts. Each calculator follows industry-standard 
              methodologies and provides detailed breakdowns of key metrics.
            </p>
            
            <h3>What Can You Calculate?</h3>
            <ul>
              <li><strong>Rental Property Analysis</strong> — Cash flow, cap rate, cash-on-cash return, equity build-up, and 30-year projections for single-family and small multifamily properties.</li>
              <li><strong>BRRRR Deals</strong> — Complete Buy-Rehab-Rent-Refinance-Repeat analysis including cash-out potential, ROI, and deal metrics.</li>
              <li><strong>Syndication Waterfalls</strong> — LP/GP distributions with preferred returns, hurdles, and promote calculations.</li>
              <li><strong>NPV Analysis</strong> — Net Present Value with multiple timing conventions and period frequencies.</li>
            </ul>

            <h3>Key Features</h3>
            <ul>
              <li><strong>Sensitivity Analysis</strong> — See how changes in key variables affect returns</li>
              <li><strong>Multi-Format Export</strong> — PDF, Excel, CSV, Word, and PowerPoint</li>
              <li><strong>Validation Warnings</strong> — Automatic checks for unusual inputs</li>
              <li><strong>No Signup Required</strong> — Use all calculators instantly, for free</li>
            </ul>

            <h3>How Calculations Work</h3>
            <p>
              All calculators use standard real estate finance formulas. Cash flow projections 
              account for vacancy, operating expenses, debt service, and capital reserves. 
              IRR calculations use the Newton-Raphson method for precision. 
              NPV uses proper time-value-of-money discounting.
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            For educational purposes only. Not investment, legal, or tax advice. 
            Consult qualified professionals before making investment decisions.
          </p>
        </div>
      </section>
    </Layout>
  );
}
