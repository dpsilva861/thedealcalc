/**
 * Structured Data Debug Tool
 * 
 * Internal diagnostic page for validating JSON-LD structured data.
 * Validates schemas by fetching route HTML (not navigating away).
 * 
 * Usage:
 * - /structured-data-debug - validates current page DOM
 * - /structured-data-debug?test=/npv-calculator - fetches and validates that route
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
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
  Globe,
  FileCode
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

interface ValidationState {
  validations: SchemaValidation[];
  source: 'dom' | 'fetch';
  route: string;
  error: string | null;
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
      results.push({ field: `Q${i + 1}.@type`, status: 'fail', message: 'Expected Question' });
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
    results.push({ field: 'remaining', status: 'pass', message: `+${mainEntity.length - 3} more questions` });
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
// Extraction Functions
// ============================================================================

/**
 * Extract JSON-LD schemas from DOM (current page)
 */
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

/**
 * Extract JSON-LD schemas from fetched HTML string
 */
function extractSchemasFromHTML(html: string): SchemaValidation[] {
  const validations: SchemaValidation[] = [];
  
  // Match all JSON-LD script blocks
  const jsonLdRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = jsonLdRegex.exec(html)) !== null) {
    const content = match[1].trim();
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
  }
  
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
  
  const bgClass = validation.valid 
    ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' 
    : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20';
  
  return (
    <div className={`border rounded-lg p-4 ${bgClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <StatusIcon status={validation.valid ? 'pass' : 'fail'} />
        <span className="font-semibold">{validation.type}</span>
        <Badge variant={validation.valid ? 'default' : 'destructive'}>
          {validation.valid ? 'PASS' : 'FAIL'}
        </Badge>
      </div>
      
      <div className="space-y-1.5 mb-4">
        {validation.results.map((result, j) => (
          <div key={`${index}-${j}`} className="flex items-start gap-2 text-sm">
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
        type="button"
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [testRoute, setTestRoute] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<ValidationState>({
    validations: [],
    source: 'dom',
    route: '/structured-data-debug',
    error: null,
  });
  
  /**
   * Validate current page DOM
   */
  const validateCurrentDOM = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      const validations = extractSchemasFromDOM();
      setState({
        validations,
        source: 'dom',
        route: window.location.pathname,
        error: null,
      });
      setIsLoading(false);
    }, 100);
  }, []);
  
  /**
   * Fetch and validate a route's HTML
   */
  const validateFetchedRoute = useCallback(async (route: string) => {
    setIsLoading(true);
    setState(prev => ({ ...prev, error: null }));
    
    try {
      // Normalize route
      const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
      
      // Fetch the route HTML
      const response = await fetch(normalizedRoute, {
        credentials: 'same-origin',
        headers: {
          'Accept': 'text/html',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const validations = extractSchemasFromHTML(html);
      
      setState({
        validations,
        source: 'fetch',
        route: normalizedRoute,
        error: null,
      });
      
      // Update URL without navigating
      setSearchParams({ test: normalizedRoute }, { replace: true });
      
    } catch (e) {
      setState({
        validations: [],
        source: 'fetch',
        route: route,
        error: e instanceof Error ? e.message : 'Failed to fetch route',
      });
    } finally {
      setIsLoading(false);
    }
  }, [setSearchParams]);
  
  // On mount: check for ?test= param
  useEffect(() => {
    const testParam = searchParams.get('test');
    if (testParam) {
      setTestRoute(testParam);
      validateFetchedRoute(testParam);
    } else {
      validateCurrentDOM();
    }
  }, []); // Only run on mount
  
  const handleTestRoute = () => {
    if (testRoute.trim()) {
      validateFetchedRoute(testRoute.trim());
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTestRoute();
    }
  };
  
  const handleValidateDOM = () => {
    setSearchParams({}, { replace: true });
    setTestRoute('');
    validateCurrentDOM();
  };
  
  // Calculate stats
  const totalSchemas = state.validations.length;
  const passedSchemas = state.validations.filter(v => v.valid).length;
  const failedSchemas = totalSchemas - passedSchemas;
  const allValid = totalSchemas > 0 && failedSchemas === 0;
  
  return (
    <Layout>
      <Helmet>
        <title>Structured Data Debug | TheDealCalc (Internal)</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content="Internal tool for validating JSON-LD structured data" />
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
          state.error 
            ? 'border-red-500'
            : allValid 
              ? 'border-green-500' 
              : totalSchemas === 0 
                ? 'border-yellow-500' 
                : 'border-red-500'
        }`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {state.error ? (
                  <XCircle className="h-8 w-8 text-red-600" />
                ) : allValid ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : totalSchemas === 0 ? (
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <p className="font-semibold text-lg">
                    {state.error 
                      ? 'Fetch Error'
                      : totalSchemas === 0 
                        ? 'No Structured Data Found' 
                        : allValid 
                          ? 'All Schemas Valid' 
                          : `${failedSchemas} Schema${failedSchemas > 1 ? 's' : ''} Failed`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {state.error 
                      ? state.error
                      : `${passedSchemas} passed, ${failedSchemas} failed of ${totalSchemas} total`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleValidateDOM}
                  disabled={isLoading}
                >
                  <FileCode className="h-4 w-4 mr-2" />
                  Validate DOM
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Test Route Input */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Fetch &amp; Validate Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                placeholder="e.g., /npv-calculator"
                value={testRoute}
                onChange={(e) => setTestRoute(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button 
                onClick={handleTestRoute} 
                disabled={!testRoute.trim() || isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Validate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Fetches the route HTML and extracts JSON-LD blocks for validation.
              Does not navigate away from this page.
            </p>
          </CardContent>
        </Card>
        
        {/* Validation Results */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Validating:</span>
              <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                {state.route}
              </code>
              <Badge variant="secondary" className="ml-2">
                {state.source === 'dom' ? 'DOM' : 'Fetched'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin" />
                <p>Extracting structured data...</p>
              </div>
            ) : state.error ? (
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                <p className="font-medium text-red-600">Failed to fetch route</p>
                <p className="text-sm mt-1">{state.error}</p>
              </div>
            ) : state.validations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                <p className="font-medium">No JSON-LD structured data found</p>
                <p className="text-sm mt-1">
                  Every indexable page should have at least BreadcrumbList
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.validations.map((validation, i) => (
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
                <li>Positions sequential starting at 1</li>
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
