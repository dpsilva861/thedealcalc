/**
 * Sitemap Validation Tool
 * 
 * Internal diagnostic page for validating sitemap.xml contents.
 * This page is noindex and blocked in robots.txt.
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  FileText,
  Loader2
} from 'lucide-react';

// Routes that MUST be in sitemap
const REQUIRED_ROUTES = [
  '/',
  '/calculators',
  '/underwrite',
  '/brrrr',
  '/syndication',
  '/npv-calculator',
  '/rental-property-calculator',
  '/brrrr-calculator',
  '/syndication-calculator',
  '/cap-rate-calculator',
  '/cash-on-cash-calculator',
  '/fix-and-flip-calculator',
  '/real-estate-investment-calculator',
  '/blog',
  '/blog/tags',
  '/how-it-works',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/disclaimer',
  '/ad-tech-providers',
];

// Routes that MUST NOT be in sitemap
const FORBIDDEN_ROUTES = [
  '/results',
  '/brrrr/results',
  '/syndication/results',
  '/admin',
  '/admin/login',
  '/admin/blog',
  '/admin/taxonomy',
  '/admin/reset-password',
  '/seo-debug',
  '/sitemap-debug',
];

interface ValidationResult {
  url: string;
  status: 'present' | 'missing' | 'forbidden';
}

export default function SitemapDebug() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sitemapUrls, setSitemapUrls] = useState<string[]>([]);
  const [requiredResults, setRequiredResults] = useState<ValidationResult[]>([]);
  const [forbiddenResults, setForbiddenResults] = useState<ValidationResult[]>([]);
  const [rawXml, setRawXml] = useState<string>('');

  const fetchAndValidate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try fetching static sitemap
      const response = await fetch('/sitemap.xml');
      if (!response.ok) {
        throw new Error(`Failed to fetch sitemap: ${response.status}`);
      }
      
      const xml = await response.text();
      setRawXml(xml);
      
      // Parse URLs from sitemap
      const urlMatches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
      const urls = urlMatches.map(match => {
        const url = match.replace(/<\/?loc>/g, '');
        // Extract path from full URL
        try {
          const parsed = new URL(url);
          return parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/$/, '');
        } catch {
          return url;
        }
      });
      
      setSitemapUrls(urls);
      
      // Check required routes
      const required: ValidationResult[] = REQUIRED_ROUTES.map(route => ({
        url: route,
        status: urls.some(u => 
          u === route || 
          u === `https://thedealcalc.com${route}` ||
          (route === '/' && (u === '/' || u === 'https://thedealcalc.com/'))
        ) ? 'present' : 'missing'
      }));
      setRequiredResults(required);
      
      // Check forbidden routes
      const forbidden: ValidationResult[] = FORBIDDEN_ROUTES.map(route => ({
        url: route,
        status: urls.some(u => 
          u === route || 
          u.includes(route) ||
          u === `https://thedealcalc.com${route}`
        ) ? 'forbidden' : 'present' // 'present' means correctly absent
      }));
      setForbiddenResults(forbidden);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sitemap');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAndValidate();
  }, []);

  const missingCount = requiredResults.filter(r => r.status === 'missing').length;
  const forbiddenCount = forbiddenResults.filter(r => r.status === 'forbidden').length;
  const overallPass = missingCount === 0 && forbiddenCount === 0;

  return (
    <Layout>
      <Helmet>
        <title>Sitemap Debug Tool | TheDealCalc (Internal)</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Internal sitemap validation tool" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Sitemap Validation Tool</h1>
            <p className="text-sm text-muted-foreground">Internal diagnostic — noindex</p>
          </div>
        </div>
        
        {/* Overall Status */}
        <Card className={`mb-6 ${overallPass ? 'border-green-500' : 'border-red-500'}`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : overallPass ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <p className="font-semibold text-lg">
                    {loading ? 'Validating Sitemap...' :
                     overallPass ? 'Sitemap Valid' : 'Sitemap Issues Found'}
                  </p>
                  {!loading && (
                    <p className="text-sm text-muted-foreground">
                      {sitemapUrls.length} URLs · {missingCount} missing · {forbiddenCount} forbidden
                    </p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fetchAndValidate} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {error && (
          <Card className="mb-6 border-red-500">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Required Routes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Required Routes
              <Badge variant={missingCount === 0 ? 'default' : 'destructive'}>
                {requiredResults.filter(r => r.status === 'present').length}/{REQUIRED_ROUTES.length}
              </Badge>
            </CardTitle>
            <CardDescription>These routes must be present in the sitemap</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {requiredResults.map((result) => (
                <div 
                  key={result.url}
                  className="flex items-center gap-2 p-2 rounded bg-muted/50"
                >
                  {result.status === 'present' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                  <code className="text-sm">{result.url}</code>
                  <Badge 
                    variant={result.status === 'present' ? 'outline' : 'destructive'}
                    className="ml-auto text-xs"
                  >
                    {result.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Forbidden Routes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Forbidden Routes
              <Badge variant={forbiddenCount === 0 ? 'default' : 'destructive'}>
                {forbiddenCount === 0 ? 'All Clear' : `${forbiddenCount} Issues`}
              </Badge>
            </CardTitle>
            <CardDescription>These routes must NOT be in the sitemap</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {forbiddenResults.map((result) => (
                <div 
                  key={result.url}
                  className="flex items-center gap-2 p-2 rounded bg-muted/50"
                >
                  {result.status === 'present' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                  <code className="text-sm">{result.url}</code>
                  <Badge 
                    variant={result.status === 'present' ? 'outline' : 'destructive'}
                    className="ml-auto text-xs"
                  >
                    {result.status === 'present' ? 'correctly absent' : 'FOUND (bad)'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Raw XML Preview */}
        {rawXml && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Raw Sitemap XML</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-64">
                {rawXml}
              </pre>
            </CardContent>
          </Card>
        )}
        
        <p className="text-xs text-muted-foreground text-center mt-8">
          This page is for internal use only and is not indexed by search engines.
        </p>
      </div>
    </Layout>
  );
}
