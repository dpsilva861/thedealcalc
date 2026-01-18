/**
 * Related Calculators Component
 * 
 * Shows links to other calculators from the registry,
 * excluding the current one.
 */

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CALCULATOR_REGISTRY } from '@/lib/calculators/registry';
import { CalculatorMetadata } from '@/lib/calculators/types';
import { 
  Home, 
  RefreshCcw, 
  Users, 
  Calculator, 
  Building2, 
  Building, 
  ArrowRight,
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

interface RelatedCalculatorsProps {
  currentPath: string;
  maxItems?: number;
  title?: string;
}

export function RelatedCalculators({ 
  currentPath, 
  maxItems = 4,
  title = "Related Calculators",
}: RelatedCalculatorsProps) {
  // Filter out current calculator and limit
  const related = CALCULATOR_REGISTRY
    .filter((calc: CalculatorMetadata) => calc.path !== currentPath && calc.status === 'available')
    .slice(0, maxItems);

  if (related.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-display font-bold text-foreground mb-6 text-center">
          {title}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {related.map((calc) => {
            const Icon = iconMap[calc.icon] || Calculator;
            return (
              <Card key={calc.id} className="hover:shadow-md hover:border-primary/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{calc.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {calc.shortDescription}
                  </p>
                  <Button variant="ghost" size="sm" asChild className="w-full justify-between">
                    <Link to={calc.path}>
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
