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
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { ROUTES_TO_PRERENDER, validateRoutes } from './prerender.routes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

/**
 * MIME types for static file serving
 */
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/**
 * Simple static file server for the dist directory
 */
function createStaticServer(port) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      // Parse URL, strip query string and hash
      let urlPath = req.url || '/';
      urlPath = urlPath.split('?')[0].split('#')[0];
      
      // Normalize: ensure leading slash, remove trailing slash (except root)
      if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
      if (urlPath !== '/' && urlPath.endsWith('/')) urlPath = urlPath.slice(0, -1);
      
      // Determine file path
      let filePath = join(distDir, urlPath);
      const ext = extname(urlPath);
      
      // If it's a file request (has extension)
      if (ext && ext.length > 0) {
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          try {
            const content = readFileSync(filePath);
            const mimeType = MIME_TYPES[ext.toLowerCase()] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content);
            return;
          } catch (e) {
            res.writeHead(500);
            res.end('Internal server error');
            return;
          }
        } else {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
      }
      
      // For routes without extension (SPA routes), serve index.html
      const indexPath = join(distDir, 'index.html');
      if (existsSync(indexPath)) {
        try {
          const content = readFileSync(indexPath);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        } catch (e) {
          res.writeHead(500);
          res.end('Internal server error');
        }
      } else {
        res.writeHead(404);
        res.end('index.html not found');
      }
    });
    
    server.listen(port, '127.0.0.1', () => {
      console.log(`📦 Static server running on http://127.0.0.1:${port}`);
      resolve(server);
    });
    
    server.on('error', reject);
  });
}

/**
 * Wait for a selector to appear with content
 */
async function waitForMeta(page, selector, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const value = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? el.getAttribute('content') || el.getAttribute('href') || el.textContent : null;
    }, selector);
    if (value && value.length > 0) return value;
    await page.waitForTimeout(100);
  }
  return null;
}

/**
 * Prerender a single route
 */
async function prerenderRoute(page, route, baseUrl) {
  const url = `${baseUrl}${route}`;
  console.log(`  🔄 Rendering: ${route}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Wait for critical SEO elements to be present
    const ogTitle = await waitForMeta(page, 'meta[property="og:title"]', 15000);
    const canonical = await waitForMeta(page, 'link[rel="canonical"]', 15000);
    
    if (!ogTitle) {
      console.warn(`    ⚠️  Warning: og:title not found for ${route}`);
    }
    if (!canonical) {
      console.warn(`    ⚠️  Warning: canonical not found for ${route}`);
    }
    
    // Extra wait to ensure all meta tags are rendered
    await page.waitForTimeout(500);
    
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
    writeFileSync(outputPath, html, 'utf-8');
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
  console.log('='.repeat(60));
  
  // Validate dist exists
  if (!existsSync(distDir)) {
    console.error('❌ Error: dist directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  // Validate route list
  try {
    validateRoutes();
  } catch (error) {
    console.error(`❌ Route validation error: ${error.message}`);
    process.exit(1);
  }
  
  console.log(`\n📋 Routes to prerender: ${ROUTES_TO_PRERENDER.length}`);
  
  const port = 4173;
  let server;
  let browser;
  
  try {
    // Start static server
    server = await createStaticServer(port);
    const baseUrl = `http://127.0.0.1:${port}`;
    
    // Launch browser
    console.log('\n🌐 Launching browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (compatible; TheDealCalcPrerender/1.0)',
    });
    const page = await context.newPage();
    
    // Suppress console noise from the page
    page.on('console', () => {});
    page.on('pageerror', () => {});
    
    // Prerender all routes
    console.log(`\n📄 Prerendering routes:\n`);
    
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
