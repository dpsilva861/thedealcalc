/**
 * Structured Data Debug Tool
 * 
 * Internal diagnostic page for validating JSON-LD structured data.
 * This page is noindex and blocked in robots.txt.
 * 
 * Features:
 * - Validates current page's JSON-LD
 * - Can navigate to and validate any route via ?test=/route
 * - Validates: BreadcrumbList, SoftwareApplication, FAQPage, Article
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search,
  RefreshCw,
  Code2,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ValidationResult {
  field: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

interface SchemaValidation {
  type: string;
  valid: boolean;
  results: ValidationResult[];
  raw: unknown;
}

// ============================================================================
// Schema Validators
// ============================================================================

function validateBreadcrumbList(schema: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  if (schema['@type'] === 'BreadcrumbList') {
    results.push({ field: '@type', status: 'pass', message: 'BreadcrumbList' });
  } else {
    results.push({ field: '@type', status: 'fail', message: `Expected BreadcrumbList, got ${String(schema['@type'])}` });
  }
  
  const items = schema.itemListElement;
  if (!items) {
    results.push({ field: 'itemListElement', status: 'fail', message: 'Missing itemListElement' });
    return results;
  }
  
  if (!Array.isArray(items)) {
    results.push({ field: 'itemListElement', status: 'fail', message: 'itemListElement must be an array' });
    return results;
  }
  
  results.push({ field: 'itemListElement', status: 'pass', message: `Array with ${items.length} items` });
  
  let lastPosition = 0;
  let positionsValid = true;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;
    const position = item.position as number;
    
    if (typeof position !== 'number') {
      results.push({ field: `item[${i}].position`, status: 'fail', message: 'Position must be a number' });
      positionsValid = false;
    } else if (position !== lastPosition + 1) {
      results.push({ field: `item[${i}].position`, status: 'fail', message: `Position ${position} not sequential (expected ${lastPosition + 1})` });
      positionsValid = false;
    } else {
      lastPosition = position;
    }
    
    if (!item.name) {
      results.push({ field: `item[${i}].name`, status: 'fail', message: 'Missing name' });
    }
    
    if (!item.item) {
      results.push({ field: `item[${i}].item`, status: 'fail', message: 'Missing item URL' });
    }
  }
  
  if (items.length > 0 && positionsValid) {
    results.push({ field: 'positions', status: 'pass', message: `Sequential: 1 to ${lastPosition}` });
  }
  
  return results;
}

function validateSoftwareApplication(schema: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  if (schema['@type'] === 'SoftwareApplication') {
    results.push({ field: '@type', status: 'pass', message: 'SoftwareApplication' });
  } else {
    results.push({ field: '@type', status: 'fail', message: `Expected SoftwareApplication, got ${String(schema['@type'])}` });
  }
  
  const requiredFields = ['name', 'applicationCategory', 'operatingSystem', 'url'];
  for (const field of requiredFields) {
    if (schema[field]) {
      results.push({ field, status: 'pass', message: String(schema[field]).slice(0, 60) });
    } else {
      results.push({ field, status: 'fail', message: `Missing ${field}` });
    }
  }
  
  const offers = schema.offers as Record<string, unknown> | undefined;
  if (offers && offers.price !== undefined) {
    results.push({ field: 'offers.price', status: 'pass', message: String(offers.price) });
  } else if (schema.price !== undefined) {
    results.push({ field: 'price', status: 'pass', message: String(schema.price) });
  } else {
    results.push({ field: 'price/offers', status: 'warn', message: 'No price or offers specified' });
  }
  
  return results;
}

function validateFAQPage(schema: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  if (schema['@type'] === 'FAQPage') {
    results.push({ field: '@type', status: 'pass', message: 'FAQPage' });
  } else {
    results.push({ field: '@type', status: 'fail', message: `Expected FAQPage, got ${String(schema['@type'])}` });
  }
  
  const mainEntity = schema.mainEntity;
  if (!mainEntity) {
    results.push({ field: 'mainEntity', status: 'fail', message: 'Missing mainEntity' });
    return results;
  }
  
  if (!Array.isArray(mainEntity)) {
    results.push({ field: 'mainEntity', status: 'fail', message: 'mainEntity must be an array' });
    return results;
  }
  
  results.push({ field: 'mainEntity', status: 'pass', message: `${mainEntity.length} questions` });
  
  let questionsValid = true;
  for (let i = 0; i < Math.min(mainEntity.length, 3); i++) {
    const q = mainEntity[i] as Record<string, unknown>;
    
    if (q['@type'] !== 'Question') {
      results.push({ field: `Q${i + 1}.@type`, status: 'fail', message: `Expected Question` });
      questionsValid = false;
    }
    
    if (!q.name) {
      results.push({ field: `Q${i + 1}.name`, status: 'fail', message: 'Missing name' });
      questionsValid = false;
    }
    
    const answer = q.acceptedAnswer as Record<string, unknown> | undefined;
    if (!answer || !answer.text) {
      results.push({ field: `Q${i + 1}.acceptedAnswer`, status: 'fail', message: 'Missing answer text' });
      questionsValid = false;
    }
  }
  
  if (mainEntity.length > 3) {
    results.push({ field: 'remaining', status: 'pass', message: `+${mainEntity.length - 3} more questions (not shown)` });
  }
  
  if (questionsValid && mainEntity.length > 0) {
    results.push({ field: 'structure', status: 'pass', message: 'All questions valid' });
  }
  
  return results;
}

function validateArticle(schema: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  const validTypes = ['Article', 'BlogPosting', 'NewsArticle'];
  const schemaType = String(schema['@type']);
  
  if (validTypes.includes(schemaType)) {
    results.push({ field: '@type', status: 'pass', message: schemaType });
  } else {
    results.push({ field: '@type', status: 'fail', message: `Expected Article/BlogPosting, got ${schemaType}` });
  }
  
  const requiredFields = ['headline', 'datePublished', 'author', 'image', 'mainEntityOfPage', 'url'];
  for (const field of requiredFields) {
    if (schema[field]) {
      const value = typeof schema[field] === 'object' 
        ? JSON.stringify(schema[field]).slice(0, 40) + '...'
        : String(schema[field]).slice(0, 40);
      results.push({ field, status: 'pass', message: value });
    } else {
      results.push({ field, status: 'fail', message: `Missing ${field}` });
    }
  }
  
  if (schema.dateModified) {
    results.push({ field: 'dateModified', status: 'pass', message: String(schema.dateModified) });
  } else {
    results.push({ field: 'dateModified', status: 'warn', message: 'Not specified (recommended)' });
  }
  
  return results;
}

function validateWebPage(schema: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  results.push({ field: '@type', status: 'pass', message: 'WebPage' });
  
  if (schema.name) {
    results.push({ field: 'name', status: 'pass', message: String(schema.name).slice(0, 50) });
  }
  
  if (schema.url) {
    results.push({ field: 'url', status: 'pass', message: String(schema.url) });
  }
  
  return results;
}

function validateSchema(schema: Record<string, unknown>): SchemaValidation {
  const type = String(schema['@type'] || 'Unknown');
  let results: ValidationResult[] = [];
  
  switch (type) {
    case 'BreadcrumbList':
      results = validateBreadcrumbList(schema);
      break;
    case 'SoftwareApplication':
      results = validateSoftwareApplication(schema);
      break;
    case 'FAQPage':
      results = validateFAQPage(schema);
      break;
    case 'Article':
    case 'BlogPosting':
    case 'NewsArticle':
      results = validateArticle(schema);
      break;
    case 'WebPage':
      results = validateWebPage(schema);
      break;
    default:
      results = [{ field: '@type', status: 'warn', message: `Unknown schema type: ${type}` }];
  }
  
  const valid = results.every(r => r.status !== 'fail');
  return { type, valid, results, raw: schema };
}

// ============================================================================
// DOM Extraction
// ============================================================================

function extractSchemasFromDOM(): SchemaValidation[] {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const validations: SchemaValidation[] = [];
  
  scripts.forEach((script) => {
    const content = script.textContent || '';
    try {
      const parsed = JSON.parse(content);
      
      if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
        for (const schema of parsed['@graph']) {
          validations.push(validateSchema(schema as Record<string, unknown>));
        }
      } else {
        validations.push(validateSchema(parsed as Record<string, unknown>));
      }
    } catch (e) {
      validations.push({
        type: 'Parse Error',
        valid: false,
        results: [{ 
          field: 'JSON', 
          status: 'fail', 
          message: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}` 
        }],
        raw: content,
      });
    }
  });
  
  return validations;
}

// ============================================================================
// Components
// ============================================================================

function StatusIcon({ status }: { status: 'pass' | 'fail' | 'warn' }) {
  if (status === 'pass') {
    return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
  }
  if (status === 'fail') {
    return <XCircle className="h-4 w-4 text-red-600 shrink-0" />;
  }
  return <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />;
}

function SchemaCard({ validation, index }: { validation: SchemaValidation; index: number }) {
  const [showRaw, setShowRaw] = useState(false);
  
  return (
    <div 
      className={`border rounded-lg p-4 ${
        validation.valid 
          ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' 
          : 'border-red-200 bg-red-50/50 dark:bg-red-950/20'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <StatusIcon status={validation.valid ? 'pass' : 'fail'} />
        <span className="font-semibold">{validation.type}</span>
        <Badge variant={validation.valid ? 'default' : 'destructive'}>
          {validation.valid ? 'PASS' : 'FAIL'}
        </Badge>
      </div>
      
      <div className="space-y-1.5 mb-4">
        {validation.results.map((result, j) => (
          <div key={j} className="flex items-start gap-2 text-sm">
            <StatusIcon status={result.status} />
            <span className="font-mono text-muted-foreground min-w-[100px] shrink-0">
              {result.field}
            </span>
            <span className={`break-all ${
              result.status === 'fail' 
                ? 'text-red-700 dark:text-red-400' 
                : result.status === 'warn' 
                  ? 'text-yellow-700 dark:text-yellow-400' 
                  : ''
            }`}>
              {result.message}
            </span>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => setShowRaw(!showRaw)}
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <Code2 className="h-3 w-3" />
        {showRaw ? 'Hide' : 'View'} raw JSON-LD
      </button>
      
      {showRaw && (
        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto max-h-48">
          {JSON.stringify(validation.raw, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function StructuredDataDebug() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [validations, setValidations] = useState<SchemaValidation[]>([]);
  const [testRoute, setTestRoute] = useState('');
  const [targetRoute, setTargetRoute] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check for ?test= parameter on mount
  useEffect(() => {
    const testParam = searchParams.get('test');
    if (testParam) {
      setTargetRoute(testParam);
      // Navigate to that route, then come back
      navigate(testParam, { replace: false });
    }
  }, [searchParams, navigate]);
  
  // Run validation when page loads or after navigation
  const runValidation = useCallback(() => {
    setIsLoading(true);
    // Wait for React/Helmet to render
    setTimeout(() => {
      setValidations(extractSchemasFromDOM());
      setIsLoading(false);
    }, 300);
  }, []);
  
  useEffect(() => {
    runValidation();
  }, [runValidation]);
  
  const handleTestRoute = () => {
    if (testRoute) {
      const cleanRoute = testRoute.startsWith('/') ? testRoute : `/${testRoute}`;
      window.location.href = `/structured-data-debug?test=${encodeURIComponent(cleanRoute)}`;
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTestRoute();
    }
  };
  
  const allValid = validations.length > 0 && validations.every(v => v.valid);
  const totalSchemas = validations.length;
  const passedSchemas = validations.filter(v => v.valid).length;
  const currentPath = window.location.pathname;
  
  return (
    <Layout>
      <Helmet>
        <title>Structured Data Debug | TheDealCalc (Internal)</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Internal structured data validation tool" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link 
            to="/seo-debug" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Code2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Structured Data Validator</h1>
            <p className="text-sm text-muted-foreground">
              JSON-LD schema.org validation — noindex
            </p>
          </div>
        </div>
        
        {/* Overall Status */}
        <Card className={`mb-6 ${
          allValid 
            ? 'border-green-500' 
            : totalSchemas === 0 
              ? 'border-yellow-500' 
              : 'border-red-500'
        }`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {allValid ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : totalSchemas === 0 ? (
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <p className="font-semibold text-lg">
                    {totalSchemas === 0 
                      ? 'No Structured Data Found' 
                      : allValid 
                        ? 'All Schemas Valid' 
                        : 'Schema Validation Errors'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {passedSchemas} of {totalSchemas} schemas passed
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runValidation}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Test Another Route */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Test Another Route</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                placeholder="e.g., /npv-calculator"
                value={testRoute}
                onChange={(e) => setTestRoute(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button onClick={handleTestRoute} disabled={!testRoute}>
                <Search className="h-4 w-4 mr-2" />
                Test
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Enter a route path to navigate and validate its structured data.
              This validates the client-rendered DOM (same as what React Helmet produces).
            </p>
            {targetRoute && (
              <p className="text-xs text-primary mt-2">
                Testing route: {targetRoute}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Current Route Results */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Current Route:</span>
              <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                {currentPath}
              </code>
              <a 
                href={currentPath} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin" />
                <p>Extracting structured data...</p>
              </div>
            ) : validations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                <p className="font-medium">No JSON-LD structured data found</p>
                <p className="text-sm mt-1">
                  Every indexable page should have at least BreadcrumbList
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {validations.map((validation, i) => (
                  <SchemaCard key={i} validation={validation} index={i} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Validation Rules Reference */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Validation Rules</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <div>
              <p className="font-medium">BreadcrumbList</p>
              <ul className="list-disc list-inside text-muted-foreground ml-2 space-y-0.5">
                <li>@type = BreadcrumbList</li>
                <li>itemListElement is array</li>
                <li>Positions are sequential (1, 2, 3...)</li>
                <li>Each item has name and item URL</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">SoftwareApplication (Calculator pages)</p>
              <ul className="list-disc list-inside text-muted-foreground ml-2 space-y-0.5">
                <li>@type = SoftwareApplication</li>
                <li>name, applicationCategory, operatingSystem, url required</li>
                <li>offers.price or price (warn if missing)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">FAQPage</p>
              <ul className="list-disc list-inside text-muted-foreground ml-2 space-y-0.5">
                <li>@type = FAQPage</li>
                <li>mainEntity is array of Questions</li>
                <li>Each Question has name and acceptedAnswer.text</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Article / BlogPosting</p>
              <ul className="list-disc list-inside text-muted-foreground ml-2 space-y-0.5">
                <li>headline, datePublished, author, image required</li>
                <li>mainEntityOfPage and url required</li>
                <li>dateModified recommended (warn if missing)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-xs text-muted-foreground text-center mt-8">
          This page is for internal use only and is not indexed by search engines.
        </p>
      </div>
    </Layout>
  );
}
