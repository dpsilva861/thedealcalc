# Prerendering for TheDealCalc (Vite SPA)

## Overview

This document describes the prerendering strategy for TheDealCalc, a Vite-based Single Page Application (SPA). Prerendering generates static HTML files at build time, improving SEO by providing crawlers with fully-rendered content.

## Why Prerender?

Search engine crawlers may have limited JavaScript execution capabilities. While modern crawlers (Googlebot) can render JavaScript, prerendering provides:

1. **Faster indexing** - Crawlers see content immediately
2. **Better social previews** - OG/Twitter tags are present in initial HTML
3. **Improved performance** - First Contentful Paint is faster
4. **Reliability** - No dependency on JavaScript execution

## Current Architecture

TheDealCalc uses:
- **Vite** as the build tool
- **React** with client-side routing (react-router-dom)
- **react-helmet-async** for dynamic meta tags

## Prerendering Options for Vite SPAs

### Option 1: vite-plugin-ssr (Recommended for Future)

A full SSR/SSG solution for Vite. Would require significant refactoring but provides the best SEO results.

### Option 2: vite-plugin-prerender (Current Recommendation)

A simpler approach that prerenders specified routes at build time using Puppeteer.

```bash
npm install vite-plugin-prerender --save-dev
```

### Option 3: External Prerendering Service

Services like Prerender.io or Rendertron can be used without code changes:
- Add middleware to detect crawlers
- Serve prerendered content to bots
- Serve SPA to regular users

## Routes to Prerender

### Indexable Routes (PRERENDER THESE)

```
/
/calculators
/npv-calculator
/rental-property-calculator
/brrrr-calculator
/syndication-calculator
/cap-rate-calculator
/cash-on-cash-calculator
/fix-and-flip-calculator
/real-estate-investment-calculator
/blog
/how-it-works
/about
/contact
/privacy
/terms
/cookies
/disclaimer
/ad-tech-providers
```

### Excluded Routes (DO NOT PRERENDER)

```
/results
/brrrr/results
/syndication/results
/admin/*
/seo-debug
/sitemap-debug
```

## Implementation with vite-plugin-prerender

Add to `vite.config.ts`:

```typescript
import prerender from 'vite-plugin-prerender';
import path from 'path';

const routes = [
  '/',
  '/calculators',
  '/npv-calculator',
  '/rental-property-calculator',
  // ... add all indexable routes
];

export default defineConfig({
  plugins: [
    react(),
    prerender({
      routes,
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        headless: true,
        renderAfterTime: 2000, // Wait for React to render
      },
      postProcess(context) {
        // Minify HTML
        context.html = context.html.trim();
        return context;
      },
    }),
  ],
});
```

## Using Prerender.io (No Code Changes)

1. Sign up at https://prerender.io
2. Get your API token
3. Configure Netlify to use Prerender middleware

In `netlify.toml`:

```toml
[[plugins]]
package = "@netlify/plugin-nextjs"

[[redirects]]
from = "/*"
to = "/.netlify/functions/prerender/:splat"
status = 200
conditions = {Role = ["bot"]}
```

Or use the Prerender.io middleware in a Netlify function.

## Verification

After implementing prerendering:

1. **Check source HTML** - View page source should show full meta tags
2. **Use Google Search Console** - Request indexing and check rendered HTML
3. **Test with curl** - `curl https://thedealcalc.com/npv-calculator` should show meta tags
4. **Use Lighthouse** - Check SEO score
5. **Use Facebook Debugger** - https://developers.facebook.com/tools/debug/
6. **Use Twitter Card Validator** - https://cards-dev.twitter.com/validator

## Current Status

As of the current implementation:
- ✅ All meta tags are correctly set via react-helmet-async
- ✅ JSON-LD structured data is present
- ✅ OG and Twitter cards are configured
- ⏳ Build-time prerendering requires additional plugin installation
- ⏳ For production SEO, consider Prerender.io integration

## Netlify Configuration

The current Netlify configuration in `netlify.toml` should work with a prerendering service:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

## Recommended Next Steps

1. **Immediate**: Use Prerender.io for crawler-specific rendering
2. **Short-term**: Add vite-plugin-prerender for static routes
3. **Long-term**: Consider migrating to Astro or similar for better SSG support

## Resources

- [Vite SSR Guide](https://vitejs.dev/guide/ssr.html)
- [Prerender.io Documentation](https://prerender.io/documentation)
- [Google's JavaScript SEO Guide](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [react-helmet-async](https://github.com/staylor/react-helmet-async)
