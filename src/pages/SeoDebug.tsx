/**
 * SEO Debug Tool
 * 
 * Internal diagnostic page for validating SEO metadata on any route.
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
  FileCode2,
  Code2
} from 'lucide-react';

interface SeoCheckResult {
  label: string;
  value: string | null;
  status: 'pass' | 'fail' | 'warn';
  requirement?: string;
}

function getSeoData(): SeoCheckResult[] {
  const results: SeoCheckResult[] = [];
  
  // Title
  const title = document.title;
  results.push({
    label: 'Title',
    value: title || null,
    status: title && title.length > 0 && title.length <= 60 ? 'pass' : 
            title && title.length > 60 ? 'warn' : 'fail',
    requirement: '≤60 characters'
  });
  
  // Meta description
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
  results.push({
    label: 'Meta Description',
    value: metaDesc || null,
    status: metaDesc && metaDesc.length > 0 && metaDesc.length <= 160 ? 'pass' : 
            metaDesc && metaDesc.length > 160 ? 'warn' : 'fail',
    requirement: '≤160 characters'
  });
  
  // Canonical
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
  results.push({
    label: 'Canonical URL',
    value: canonical || null,
    status: canonical && canonical.startsWith('https://thedealcalc.com') ? 'pass' : 'fail',
    requirement: 'Must start with https://thedealcalc.com'
  });
  
  // Robots
  const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content');
  results.push({
    label: 'Robots',
    value: robots || 'not set (defaults to index)',
    status: robots ? 'pass' : 'warn',
    requirement: 'index, follow or noindex, follow'
  });
  
  // OG Title
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  results.push({
    label: 'og:title',
    value: ogTitle || null,
    status: ogTitle ? 'pass' : 'fail',
    requirement: 'Required for social sharing'
  });
  
  // OG Description
  const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
  results.push({
    label: 'og:description',
    value: ogDesc || null,
    status: ogDesc ? 'pass' : 'fail',
    requirement: 'Required for social sharing'
  });
  
  // OG URL
  const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content');
  results.push({
    label: 'og:url',
    value: ogUrl || null,
    status: ogUrl && ogUrl.startsWith('https://thedealcalc.com') ? 'pass' : 'fail',
    requirement: 'Must match canonical'
  });
  
  // OG Type
  const ogType = document.querySelector('meta[property="og:type"]')?.getAttribute('content');
  results.push({
    label: 'og:type',
    value: ogType || null,
    status: ogType ? 'pass' : 'fail',
    requirement: 'website or article'
  });
  
  // OG Image
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
  results.push({
    label: 'og:image',
    value: ogImage || null,
    status: ogImage && ogImage.startsWith('https://thedealcalc.com') ? 'pass' : 'fail',
    requirement: 'Full URL to image'
  });
  
  // Twitter Card
  const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content');
  results.push({
    label: 'twitter:card',
    value: twitterCard || null,
    status: twitterCard === 'summary_large_image' ? 'pass' : 'fail',
    requirement: 'summary_large_image'
  });
  
  // Twitter Image
  const twitterImage = document.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
  results.push({
    label: 'twitter:image',
    value: twitterImage || null,
    status: twitterImage ? 'pass' : 'fail',
    requirement: 'Full URL to image'
  });
  
  // H1 Count
  const h1Count = document.querySelectorAll('h1').length;
  results.push({
    label: 'H1 Tags',
    value: `${h1Count} found`,
    status: h1Count === 1 ? 'pass' : h1Count === 0 ? 'fail' : 'warn',
    requirement: 'Exactly 1 H1 per page'
  });
  
  return results;
}

function getJsonLdBlocks(): { script: string; valid: boolean; parsed: unknown; error?: string }[] {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const blocks: { script: string; valid: boolean; parsed: unknown; error?: string }[] = [];
  
  scripts.forEach((script) => {
    const content = script.textContent || '';
    try {
      const parsed = JSON.parse(content);
      blocks.push({ script: content, valid: true, parsed });
    } catch (e) {
      blocks.push({ 
        script: content, 
        valid: false, 
        parsed: null, 
        error: e instanceof Error ? e.message : 'Invalid JSON' 
      });
    }
  });
  
  return blocks;
}

function StatusIcon({ status }: { status: 'pass' | 'fail' | 'warn' }) {
  if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === 'fail') return <XCircle className="h-4 w-4 text-red-600" />;
  return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
}

export default function SeoDebug() {
  const [seoData, setSeoData] = useState<SeoCheckResult[]>([]);
  const [jsonLdBlocks, setJsonLdBlocks] = useState<ReturnType<typeof getJsonLdBlocks>>([]);
  const [testUrl, setTestUrl] = useState('');
  const [loading, setLoading] = useState(false);
  
  const runCheck = () => {
    // Small delay to ensure Helmet has rendered
    setTimeout(() => {
      setSeoData(getSeoData());
      setJsonLdBlocks(getJsonLdBlocks());
    }, 100);
  };
  
  useEffect(() => {
    runCheck();
  }, []);
  
  const handleTestRoute = () => {
    if (testUrl) {
      setLoading(true);
      window.location.href = `/seo-debug?test=${encodeURIComponent(testUrl)}`;
    }
  };
  
  const passCount = seoData.filter(d => d.status === 'pass').length;
  const failCount = seoData.filter(d => d.status === 'fail').length;
  const warnCount = seoData.filter(d => d.status === 'warn').length;
  const totalChecks = seoData.length;
  
  const allJsonLdValid = jsonLdBlocks.every(b => b.valid);
  const overallPass = failCount === 0 && allJsonLdValid;
  
  return (
    <Layout>
      <Helmet>
        <title>SEO Debug Tool | TheDealCalc (Internal)</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Internal SEO diagnostic tool" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <FileCode2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">SEO Debug Tool</h1>
            <p className="text-sm text-muted-foreground">Internal diagnostic — noindex</p>
          </div>
        </div>
        
        {/* Overall Status */}
        <Card className={`mb-6 ${overallPass ? 'border-green-500' : 'border-red-500'}`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {overallPass ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <p className="font-semibold text-lg">
                    {overallPass ? 'All SEO Checks Passed' : 'SEO Issues Found'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {passCount} pass · {warnCount} warn · {failCount} fail
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={runCheck}>
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
              Enter a route path to navigate and check its SEO metadata
            </p>
            <div className="mt-4 pt-4 border-t">
              <Link to="/structured-data-debug" className="flex items-center gap-2 text-primary hover:underline">
                <Code2 className="h-4 w-4" />
                Open Structured Data Validator
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Current Route */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Current Route: {window.location.pathname}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {seoData.map((item) => (
                <div 
                  key={item.label} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <StatusIcon status={item.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{item.label}</span>
                      <Badge 
                        variant={item.status === 'pass' ? 'default' : item.status === 'fail' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 break-all">
                      {item.value || <span className="text-red-500">Missing</span>}
                    </p>
                    {item.requirement && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Requirement: {item.requirement}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* JSON-LD Blocks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              JSON-LD Structured Data
              <Badge variant={allJsonLdValid ? 'default' : 'destructive'}>
                {jsonLdBlocks.length} block(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {jsonLdBlocks.length === 0 ? (
              <p className="text-muted-foreground">No JSON-LD blocks found</p>
            ) : (
              <div className="space-y-4">
                {jsonLdBlocks.map((block, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon status={block.valid ? 'pass' : 'fail'} />
                      <span className="font-medium text-sm">
                        Block {i + 1}: {block.valid ? 'Valid JSON' : 'Invalid JSON'}
                      </span>
                    </div>
                    {block.error && (
                      <p className="text-sm text-red-500 mb-2">{block.error}</p>
                    )}
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-48">
                      {JSON.stringify(block.parsed || block.script, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <p className="text-xs text-muted-foreground text-center mt-8">
          This page is for internal use only and is not indexed by search engines.
        </p>
      </div>
    </Layout>
  );
}
