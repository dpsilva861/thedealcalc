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
import { ROUTES_TO_PRERENDER } from './prerender.routes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

/**
 * Required SEO elements with validation rules
 */
const REQUIRED_ELEMENTS = [
  { 
    name: 'title', 
    pattern: /<title[^>]*>([^<]+)<\/title>/i, 
    description: '<title> tag',
    validate: (match) => match && match[1] && match[1].trim().length > 0
  },
  { 
    name: 'meta-description', 
    pattern: /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i, 
    description: 'meta description',
    validate: (match) => match && match[1] && match[1].trim().length > 0
  },
  { 
    name: 'canonical', 
    pattern: /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i, 
    description: 'canonical link (https://thedealcalc.com)',
    validate: (match) => match && match[1] && match[1].startsWith('https://thedealcalc.com')
  },
  { 
    name: 'og:title', 
    pattern: /<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i, 
    description: 'og:title',
    validate: (match) => match && match[1] && match[1].trim().length > 0
  },
  { 
    name: 'og:description', 
    pattern: /<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i, 
    description: 'og:description',
    validate: (match) => match && match[1] && match[1].trim().length > 0
  },
  { 
    name: 'og:url', 
    pattern: /<meta\s+[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i, 
    description: 'og:url (https://thedealcalc.com)',
    validate: (match) => match && match[1] && match[1].startsWith('https://thedealcalc.com')
  },
  { 
    name: 'og:type', 
    pattern: /<meta\s+[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["']/i, 
    description: 'og:type',
    validate: (match) => match && match[1] && match[1].trim().length > 0
  },
  { 
    name: 'og:image', 
    pattern: /<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i, 
    description: 'og:image (absolute URL)',
    validate: (match) => match && match[1] && (match[1].startsWith('https://') || match[1].startsWith('http://'))
  },
  { 
    name: 'twitter:card', 
    pattern: /<meta\s+[^>]*name=["']twitter:card["'][^>]*content=["']([^"']+)["']/i, 
    description: 'twitter:card (summary_large_image)',
    validate: (match) => match && match[1] === 'summary_large_image'
  },
  { 
    name: 'twitter:image', 
    pattern: /<meta\s+[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i, 
    description: 'twitter:image',
    validate: (match) => match && match[1] && match[1].trim().length > 0
  },
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
 * Extract and validate all JSON-LD blocks
 */
function validateJsonLd(html) {
  const jsonLdPattern = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const matches = [...html.matchAll(jsonLdPattern)];
  const errors = [];
  
  if (matches.length === 0) {
    errors.push('No JSON-LD blocks found');
    return { valid: false, errors, count: 0 };
  }
  
  let validCount = 0;
  for (let i = 0; i < matches.length; i++) {
    const content = matches[i][1];
    try {
      JSON.parse(content);
      validCount++;
    } catch (e) {
      errors.push(`JSON-LD block ${i + 1}: Invalid JSON - ${e.message}`);
    }
  }
  
  return { 
    valid: errors.length === 0 && validCount > 0, 
    errors, 
    count: matches.length 
  };
}

/**
 * Verify a single route
 */
function verifyRoute(route) {
  const htmlPath = getHtmlPath(route);
  const errors = [];
  const warnings = [];
  
  // Check file exists
  if (!existsSync(htmlPath)) {
    return { route, success: false, errors: [`File not found: ${htmlPath}`], warnings: [] };
  }
  
  const html = readFileSync(htmlPath, 'utf-8');
  
  // Check each required element
  for (const element of REQUIRED_ELEMENTS) {
    const match = html.match(element.pattern);
    if (!element.validate(match)) {
      if (match && match[1]) {
        errors.push(`Invalid ${element.name}: "${match[1]}" - Expected: ${element.description}`);
      } else {
        errors.push(`Missing: ${element.description}`);
      }
    }
  }
  
  // Validate JSON-LD
  const jsonLdResult = validateJsonLd(html);
  if (!jsonLdResult.valid) {
    errors.push(...jsonLdResult.errors);
  }
  
  return {
    route,
    success: errors.length === 0,
    errors,
    warnings,
    jsonLdCount: jsonLdResult.count,
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
  
  console.log(`\n📄 Verifying ${ROUTES_TO_PRERENDER.length} prerendered routes:\n`);
  
  const results = [];
  let hasErrors = false;
  
  for (const route of ROUTES_TO_PRERENDER) {
    const result = verifyRoute(route);
    results.push(result);
    
    if (result.success) {
      console.log(`  ✅ ${route} (${result.jsonLdCount} JSON-LD)`);
    } else {
      hasErrors = true;
      console.log(`  ❌ ${route}`);
      result.errors.forEach(err => console.log(`     └─ ${err}`));
    }
    
    if (result.warnings.length > 0) {
      result.warnings.forEach(warn => console.log(`     ⚠️  ${warn}`));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Verification Summary\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Passed: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  // List all verification checks
  console.log('\n📋 Verification checks performed:');
  console.log('   - <title> tag exists');
  console.log('   - meta description exists');
  console.log('   - canonical starts with https://thedealcalc.com');
  console.log('   - og:title, og:description, og:type exist');
  console.log('   - og:url starts with https://thedealcalc.com');
  console.log('   - og:image is absolute URL');
  console.log('   - twitter:card = summary_large_image');
  console.log('   - twitter:image exists');
  console.log('   - At least one valid JSON-LD block');
  
  if (hasErrors) {
    console.log('\n❌ Verification FAILED - fix the above errors before deploying.\n');
    process.exit(1);
  }
  
  console.log('\n🎉 All prerendered pages verified successfully!\n');
}

// Run
verify();
