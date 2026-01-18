#!/usr/bin/env node
/**
 * Prerender Verification Script for TheDealCalc
 * 
 * This script validates that all prerendered HTML files contain
 * the required SEO metadata. If any route fails, the build fails.
 * 
 * Usage: node scripts/verify-prerender.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

// Routes to verify (must match prerender.mjs)
const ROUTES_TO_VERIFY = [
  '/',
  '/calculators',
  '/npv-calculator',
  '/rental-property-calculator',
  '/brrrr-calculator',
  '/syndication-calculator',
  '/cap-rate-calculator',
  '/cash-on-cash-calculator',
  '/fix-and-flip-calculator',
  '/real-estate-investment-calculator',
  '/blog',
  '/how-it-works',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/disclaimer',
  '/ad-tech-providers',
];

// Required SEO elements
const REQUIRED_ELEMENTS = [
  { name: 'title', pattern: /<title>([^<]+)<\/title>/i, description: '<title> tag' },
  { name: 'meta-description', pattern: /<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i, description: 'meta description' },
  { name: 'canonical', pattern: /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i, description: 'canonical link' },
  { name: 'og:title', pattern: /<meta\s+property=["']og:title["'][^>]*content=["']([^"']+)["']/i, description: 'og:title' },
  { name: 'og:description', pattern: /<meta\s+property=["']og:description["'][^>]*content=["']([^"']+)["']/i, description: 'og:description' },
  { name: 'og:url', pattern: /<meta\s+property=["']og:url["'][^>]*content=["']([^"']+)["']/i, description: 'og:url' },
  { name: 'og:type', pattern: /<meta\s+property=["']og:type["'][^>]*content=["']([^"']+)["']/i, description: 'og:type' },
  { name: 'og:image', pattern: /<meta\s+property=["']og:image["'][^>]*content=["']([^"']+)["']/i, description: 'og:image' },
  { name: 'twitter:card', pattern: /<meta\s+name=["']twitter:card["'][^>]*content=["']([^"']+)["']/i, description: 'twitter:card' },
  { name: 'twitter:image', pattern: /<meta\s+name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i, description: 'twitter:image' },
  { name: 'json-ld', pattern: /<script\s+type=["']application\/ld\+json["'][^>]*>/i, description: 'JSON-LD script' },
];

/**
 * Get the HTML file path for a route
 */
function getHtmlPath(route) {
  if (route === '/') {
    return join(distDir, 'index.html');
  }
  return join(distDir, route.slice(1), 'index.html');
}

/**
 * Verify a single route
 */
function verifyRoute(route) {
  const htmlPath = getHtmlPath(route);
  const errors = [];
  
  // Check file exists
  if (!existsSync(htmlPath)) {
    return { route, success: false, errors: [`File not found: ${htmlPath}`] };
  }
  
  const html = readFileSync(htmlPath, 'utf-8');
  
  // Check each required element
  for (const element of REQUIRED_ELEMENTS) {
    const match = html.match(element.pattern);
    if (!match) {
      errors.push(`Missing: ${element.description}`);
    } else if (element.name === 'canonical' && !match[1].startsWith('https://thedealcalc.com')) {
      errors.push(`Invalid canonical: ${match[1]} (must start with https://thedealcalc.com)`);
    } else if (element.name === 'og:url' && !match[1].startsWith('https://thedealcalc.com')) {
      errors.push(`Invalid og:url: ${match[1]} (must start with https://thedealcalc.com)`);
    } else if (element.name === 'og:image' && !match[1].startsWith('https://thedealcalc.com')) {
      errors.push(`Invalid og:image: ${match[1]} (must be absolute URL)`);
    } else if (element.name === 'twitter:card' && match[1] !== 'summary_large_image') {
      errors.push(`Invalid twitter:card: ${match[1]} (must be summary_large_image)`);
    }
  }
  
  // Validate JSON-LD is parseable
  const jsonLdMatches = html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  let jsonLdCount = 0;
  for (const match of jsonLdMatches) {
    jsonLdCount++;
    try {
      JSON.parse(match[1]);
    } catch (e) {
      errors.push(`Invalid JSON-LD block ${jsonLdCount}: ${e.message}`);
    }
  }
  
  if (jsonLdCount === 0) {
    errors.push('No valid JSON-LD blocks found');
  }
  
  return {
    route,
    success: errors.length === 0,
    errors,
  };
}

/**
 * Main verification function
 */
function verify() {
  console.log('\n🔍 TheDealCalc Prerender Verification\n');
  console.log('='.repeat(60));
  
  // Validate dist exists
  if (!existsSync(distDir)) {
    console.error('❌ Error: dist directory not found. Run prerender first.');
    process.exit(1);
  }
  
  console.log(`\n📄 Verifying ${ROUTES_TO_VERIFY.length} prerendered routes:\n`);
  
  const results = [];
  let hasErrors = false;
  
  for (const route of ROUTES_TO_VERIFY) {
    const result = verifyRoute(route);
    results.push(result);
    
    if (result.success) {
      console.log(`  ✅ ${route}`);
    } else {
      hasErrors = true;
      console.log(`  ❌ ${route}`);
      result.errors.forEach(err => console.log(`     └─ ${err}`));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Verification Summary\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Passed: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (hasErrors) {
    console.log('\n❌ Verification FAILED - fix the above errors before deploying.\n');
    process.exit(1);
  }
  
  console.log('\n🎉 All prerendered pages verified successfully!\n');
}

// Run
verify();
