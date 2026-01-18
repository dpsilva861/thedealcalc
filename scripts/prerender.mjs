#!/usr/bin/env node
/**
 * Prerender Script for TheDealCalc Vite SPA
 * 
 * This script prerenders static HTML files for SEO purposes.
 * It runs after the Vite build and uses Playwright to render pages.
 * 
 * Usage: node scripts/prerender.mjs
 * 
 * Requirements:
 * - npm run build must be run first
 * - Playwright must be installed: npx playwright install chromium
 */

import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

// ============================================================================
// ROUTES TO PRERENDER
// ============================================================================
// Add new routes here. These are the ONLY routes that will be prerendered.
// Do NOT add: /results, /brrrr/results, /syndication/results, /admin/*
// ============================================================================

const ROUTES_TO_PRERENDER = [
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

// Routes that should NEVER be prerendered
const EXCLUDED_ROUTES = [
  '/results',
  '/brrrr/results',
  '/syndication/results',
  '/admin',
  '/seo-debug',
  '/sitemap-debug',
  '/structured-data-debug',
];

/**
 * Simple static file server for the dist directory
 */
function createStaticServer(port) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      let filePath = join(distDir, req.url === '/' ? 'index.html' : req.url);
      
      // For SPA routing, serve index.html for any non-file request
      if (!existsSync(filePath) || !filePath.includes('.')) {
        filePath = join(distDir, 'index.html');
      }
      
      try {
        const content = readFileSync(filePath);
        const ext = filePath.split('.').pop();
        const mimeTypes = {
          html: 'text/html',
          js: 'application/javascript',
          css: 'text/css',
          png: 'image/png',
          jpg: 'image/jpeg',
          svg: 'image/svg+xml',
          json: 'application/json',
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(content);
      } catch (e) {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    
    server.listen(port, () => {
      console.log(`📦 Static server running on http://localhost:${port}`);
      resolve(server);
    });
    
    server.on('error', reject);
  });
}

/**
 * Prerender a single route
 */
async function prerenderRoute(page, route, baseUrl) {
  const url = `${baseUrl}${route}`;
  console.log(`  🔄 Rendering: ${route}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for React to hydrate and Helmet to update the head
    await page.waitForTimeout(2000);
    
    // Get the full HTML
    const html = await page.content();
    
    // Determine output path
    const outputPath = route === '/' 
      ? join(distDir, 'index.html')
      : join(distDir, route.slice(1), 'index.html');
    
    // Ensure directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Write the prerendered HTML
    writeFileSync(outputPath, html);
    console.log(`  ✅ Saved: ${outputPath.replace(distDir, 'dist')}`);
    
    return { route, success: true };
  } catch (error) {
    console.error(`  ❌ Failed: ${route} - ${error.message}`);
    return { route, success: false, error: error.message };
  }
}

/**
 * Main prerender function
 */
async function prerender() {
  console.log('\n🚀 TheDealCalc Prerender Script\n');
  console.log('=' .repeat(60));
  
  // Validate dist exists
  if (!existsSync(distDir)) {
    console.error('❌ Error: dist directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  // Validate excluded routes are not in prerender list
  for (const route of ROUTES_TO_PRERENDER) {
    for (const excluded of EXCLUDED_ROUTES) {
      if (route === excluded || route.startsWith(excluded)) {
        console.error(`❌ Error: Route "${route}" is in the exclusion list and should not be prerendered.`);
        process.exit(1);
      }
    }
  }
  
  const port = 4173;
  let server;
  let browser;
  
  try {
    // Start static server
    server = await createStaticServer(port);
    const baseUrl = `http://localhost:${port}`;
    
    // Launch browser
    console.log('\n🌐 Launching browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (compatible; Prerender/1.0; +https://thedealcalc.com)',
    });
    const page = await context.newPage();
    
    // Prerender all routes
    console.log(`\n📄 Prerendering ${ROUTES_TO_PRERENDER.length} routes:\n`);
    
    const results = [];
    for (const route of ROUTES_TO_PRERENDER) {
      const result = await prerenderRoute(page, route, baseUrl);
      results.push(result);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Prerender Summary\n');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (failed.length > 0) {
      console.log('\nFailed routes:');
      failed.forEach(r => console.log(`  - ${r.route}: ${r.error}`));
      process.exit(1);
    }
    
    console.log('\n🎉 Prerendering complete!\n');
    
  } catch (error) {
    console.error('❌ Prerender error:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    if (server) server.close();
  }
}

// Run
prerender();
