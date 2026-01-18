/**
 * Structured Data Debug Tool
 * 
 * Internal diagnostic page for validating JSON-LD structured data.
 * Validates schema.org compliance for:
 * - BreadcrumbList
 * - SoftwareApplication
 * - FAQPage
 * - Article
 * 
 * This page is noindex and blocked in robots.txt.
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search,
  RefreshCw,
  Code2,
  ArrowLeft
} from 'lucide-react';

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

/**
 * Validate BreadcrumbList schema
 */
function validateBreadcrumbList(schema: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Check @type
  if (schema['@type'] === 'BreadcrumbList') {
    results.push({ field: '@type', status: 'pass', message: 'BreadcrumbList' });
  } else {
    results.push({ field: '@type', status: 'fail', message: `Expected BreadcrumbList, got ${schema['@type']}` });
  }
  
  // Check itemListElement
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
  
  // Check positions are sequential
  let lastPosition = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;
    const position = item.position as number;
    
    if (typeof position !== 'number') {
      results.push({ field: `item[${i}].position`, status: 'fail', message: 'Position must be a number' });
    } else if (position <= lastPosition) {
      results.push({ field: `item[${i}].position`, status: 'fail', message: `Position ${position} not sequential (prev: ${lastPosition})` });
    } else {
      lastPosition = position;
    }
    
    // Check name
    if (!item.name) {
      results.push({ field: `item[${i}].name`, status: 'fail', message: 'Missing name' });
    }
    
    // Check item URL
    if (!item.item) {
      results.push({ field: `item[${i}].item`, status: 'fail', message: 'Missing item URL' });
    }
  }
  
  if (items.length > 0 && lastPosition > 0) {
    results.push({ field: 'positions', status: 'pass', message: `Sequential positions: 1 to ${lastPosition}` });
  }
  
  return results;
}

/**
 * Validate SoftwareApplication schema
 */
function validateSoftwareApplication(schema: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Check @type
  if (schema['@type'] === 'SoftwareApplication') {
    results.push({ field: '@type', status: 'pass', message: 'SoftwareApplication' });
  } else {
    results.push({ field: '@type', status: 'fail', message: `Expected SoftwareApplication, got ${schema['@type']}` });
  }
  
  // Required fields
  const requiredFields = ['name', 'applicationCategory', 'operatingSystem', 'url'];
  for (const field of requiredFields) {
    if (schema[field]) {
      results.push({ field, status: 'pass', message: String(schema[field]) });
    } else {
      results.push({ field, status: 'fail', message: `Missing ${field}` });
    }
  }
  
  // Check offers/price
  const offers = schema.offers as Record<string, unknown> | undefined;
  if (offers) {
    if (offers.price !== undefined) {
      results.push({ field: 'offers.price', status: 'pass', message: String(offers.price) });
    } else {
      results.push({ field: 'offers.price', status: 'warn', message: 'Price not specified in offers' });
    }
  } else if (schema.price !== undefined) {
    results.push({ field: 'price', status: 'pass', message: String(schema.price) });
  } else {
    results.push({ field: 'price/offers', status: 'warn', message: 'No price or offers specified' });
  }
  
  return results;
}

/**
 * Validate FAQPage schema
 */
function validateFAQPage(schema: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Check @type
  if (schema['@type'] === 'FAQPage') {
    results.push({ field: '@type', status: 'pass', message: 'FAQPage' });
  } else {
    results.push({ field: '@type', status: 'fail', message: `Expected FAQPage, got ${schema['@type']}` });
  }
  
  // Check mainEntity
  const mainEntity = schema.mainEntity;
  if (!mainEntity) {
    results.push({ field: 'mainEntity', status: 'fail', message: 'Missing mainEntity' });
    return results;
  }
  
  if (!Array.isArray(mainEntity)) {
    results.push({ field: 'mainEntity', status: 'fail', message: 'mainEntity must be an array of Questions' });
    return results;
  }
  
  results.push({ field: 'mainEntity', status: 'pass', message: `Array with ${mainEntity.length} questions` });
  
  // Validate each question
  for (let i = 0; i < mainEntity.length; i++) {
    const q = mainEntity[i] as Record<string, unknown>;
    
    if (q['@type'] !== 'Question') {
      results.push({ field: `question[${i}].@type`, status: 'fail', message: `Expected Question, got ${q['@type']}` });
    }
    
    if (!q.name) {
      results.push({ field: `question[${i}].name`, status: 'fail', message: 'Missing question name' });
    }
    
    const answer = q.acceptedAnswer as Record<string, unknown> | undefined;
    if (!answer) {
      results.push({ field: `question[${i}].acceptedAnswer`, status: 'fail', message: 'Missing acceptedAnswer' });
    } else if (!answer.text) {
      results.push({ field: `question[${i}].acceptedAnswer.text`, status: 'fail', message: 'Missing answer text' });
    }
  }
  
  if (mainEntity.length > 0) {
    results.push({ field: 'questions', status: 'pass', message: `${mainEntity.length} valid FAQ items` });
  }
  
  return results;
}

/**
 * Validate Article schema
 */
function validateArticle(schema: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Check @type
  const validTypes = ['Article', 'BlogPosting', 'NewsArticle'];
  if (validTypes.includes(schema['@type'] as string)) {
    results.push({ field: '@type', status: 'pass', message: String(schema['@type']) });
  } else {
    results.push({ field: '@type', status: 'fail', message: `Expected Article/BlogPosting, got ${schema['@type']}` });
  }
  
  // Required fields
  const requiredFields = ['headline', 'datePublished', 'author', 'image', 'mainEntityOfPage', 'url'];
  for (const field of requiredFields) {
    if (schema[field]) {
      const value = typeof schema[field] === 'object' 
        ? JSON.stringify(schema[field]).slice(0, 50) + '...'
        : String(schema[field]).slice(0, 50);
      results.push({ field, status: 'pass', message: value });
    } else {
      results.push({ field, status: 'fail', message: `Missing ${field}` });
    }
  }
  
  // Check dateModified (optional but recommended)
  if (schema.dateModified) {
    results.push({ field: 'dateModified', status: 'pass', message: String(schema.dateModified) });
  } else {
    results.push({ field: 'dateModified', status: 'warn', message: 'Not specified (recommended)' });
  }
  
  return results;
}

/**
 * Validate WebPage schema
 */
function validateWebPage(schema: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  if (schema['@type'] === 'WebPage') {
    results.push({ field: '@type', status: 'pass', message: 'WebPage' });
  }
  
  if (schema.name) {
    results.push({ field: 'name', status: 'pass', message: String(schema.name) });
  } else {
    results.push({ field: 'name', status: 'warn', message: 'Not specified' });
  }
  
  if (schema.url) {
    results.push({ field: 'url', status: 'pass', message: String(schema.url) });
  }
  
  return results;
}

/**
 * Get schema type from object
 */
function getSchemaType(schema: Record<string, unknown>): string {
  return String(schema['@type'] || 'Unknown');
}

/**
 * Validate a schema based on its type
 */
function validateSchema(schema: Record<string, unknown>): SchemaValidation {
  const type = getSchemaType(schema);
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

/**
 * Extract and validate all JSON-LD blocks from the page
 */
function extractAndValidateSchemas(): SchemaValidation[] {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const validations: SchemaValidation[] = [];
  
  scripts.forEach((script) => {
    const content = script.textContent || '';
    try {
      const parsed = JSON.parse(content);
      
      // Handle @graph arrays
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
        results: [{ field: 'JSON', status: 'fail', message: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}` }],
        raw: content,
      });
    }
  });
  
  return validations;
}

function StatusIcon({ status }: { status: 'pass' | 'fail' | 'warn' }) {
  if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
  if (status === 'fail') return <XCircle className="h-4 w-4 text-red-600 shrink-0" />;
  return <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />;
}

export default function StructuredDataDebug() {
  const [validations, setValidations] = useState<SchemaValidation[]>([]);
  const [testUrl, setTestUrl] = useState('');
  const [loading, setLoading] = useState(false);
  
  const runValidation = () => {
    setTimeout(() => {
      setValidations(extractAndValidateSchemas());
    }, 100);
  };
  
  useEffect(() => {
    runValidation();
  }, []);
  
  const handleTestRoute = () => {
    if (testUrl) {
      setLoading(true);
      window.location.href = `/structured-data-debug?test=${encodeURIComponent(testUrl)}`;
    }
  };
  
  const allValid = validations.every(v => v.valid);
  const totalSchemas = validations.length;
  const passedSchemas = validations.filter(v => v.valid).length;
  
  return (
    <Layout>
      <Helmet>
        <title>Structured Data Debug | TheDealCalc (Internal)</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Internal structured data validation tool" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/seo-debug" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Code2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Structured Data Validator</h1>
            <p className="text-sm text-muted-foreground">JSON-LD schema.org validation — noindex</p>
          </div>
        </div>
        
        {/* Overall Status */}
        <Card className={`mb-6 ${allValid && totalSchemas > 0 ? 'border-green-500' : 'border-red-500'}`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {allValid && totalSchemas > 0 ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <p className="font-semibold text-lg">
                    {totalSchemas === 0 ? 'No Structured Data Found' : 
                     allValid ? 'All Schemas Valid' : 'Schema Validation Errors'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {passedSchemas} of {totalSchemas} schemas passed validation
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={runValidation}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Test Different Route */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Test Another Route</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                placeholder="e.g., /npv-calculator"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
              />
              <Button onClick={handleTestRoute} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Test
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Enter a route path to navigate and validate its structured data
            </p>
          </CardContent>
        </Card>
        
        {/* Current Route */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Current Route: {window.location.pathname}</CardTitle>
          </CardHeader>
          <CardContent>
            {validations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                <p className="font-medium">No JSON-LD structured data found on this page</p>
                <p className="text-sm mt-1">Every indexable page should have at least BreadcrumbList</p>
              </div>
            ) : (
              <div className="space-y-6">
                {validations.map((validation, i) => (
                  <div 
                    key={i} 
                    className={`border rounded-lg p-4 ${validation.valid ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <StatusIcon status={validation.valid ? 'pass' : 'fail'} />
                      <span className="font-semibold">{validation.type}</span>
                      <Badge variant={validation.valid ? 'default' : 'destructive'}>
                        {validation.valid ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {validation.results.map((result, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <StatusIcon status={result.status} />
                          <span className="font-mono text-muted-foreground min-w-[120px]">{result.field}</span>
                          <span className={result.status === 'fail' ? 'text-red-700' : result.status === 'warn' ? 'text-yellow-700' : ''}>
                            {result.message}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View raw JSON-LD
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto max-h-48">
                        {JSON.stringify(validation.raw, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Validation Rules Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Validation Rules</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <div>
              <p className="font-medium">BreadcrumbList</p>
              <ul className="list-disc list-inside text-muted-foreground ml-2">
                <li>@type must be "BreadcrumbList"</li>
                <li>itemListElement must be an array</li>
                <li>Positions must be sequential (1, 2, 3...)</li>
                <li>Each item must have name and item URL</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">SoftwareApplication (Calculator pages)</p>
              <ul className="list-disc list-inside text-muted-foreground ml-2">
                <li>@type must be "SoftwareApplication"</li>
                <li>name, applicationCategory, operatingSystem, url required</li>
                <li>offers or price info recommended</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">FAQPage</p>
              <ul className="list-disc list-inside text-muted-foreground ml-2">
                <li>@type must be "FAQPage"</li>
                <li>mainEntity must be array of Questions</li>
                <li>Each Question needs name and acceptedAnswer.text</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Article / BlogPosting</p>
              <ul className="list-disc list-inside text-muted-foreground ml-2">
                <li>headline, datePublished, author, image required</li>
                <li>mainEntityOfPage and url required</li>
                <li>dateModified recommended</li>
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
