# Prerendering for TheDealCalc (Vite SPA)

## Overview

This document describes the prerendering implementation for TheDealCalc, a Vite-based Single Page Application (SPA). Prerendering generates static HTML files at build time, improving SEO by providing crawlers with fully-rendered content.

## Why Prerender?

Search engine crawlers may have limited JavaScript execution capabilities. Prerendering provides:

1. **Faster indexing** - Crawlers see content immediately
2. **Better social previews** - OG/Twitter tags are present in initial HTML
3. **Improved performance** - First Contentful Paint is faster
4. **Reliability** - No dependency on JavaScript execution

## Implementation

TheDealCalc uses a custom Playwright-based prerender script that:

1. Runs after `npm run build`
2. Starts a local server serving the dist folder
3. Uses Playwright (headless Chromium) to visit each route
4. Waits for React hydration and Helmet meta tag injection
5. Saves the complete HTML to `dist/<route>/index.html`
6. Validates all required SEO tags are present

## File Structure

```
scripts/
├── prerender.mjs         # Main prerender script
├── verify-prerender.mjs  # Verification script
```

## Routes to Prerender

The routes are defined in `scripts/prerender.mjs`. Current list:

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

### Adding New Routes

1. Open `scripts/prerender.mjs`
2. Add the route to `ROUTES_TO_PRERENDER` array
3. Also add to `scripts/verify-prerender.mjs` `ROUTES_TO_VERIFY` array
4. Run `npm run prerender` to test

### Excluded Routes (NEVER prerender)

- `/results` - User-specific results (noindex)
- `/brrrr/results` - User-specific results (noindex)
- `/syndication/results` - User-specific results (noindex)
- `/admin/*` - Admin pages (blocked in robots.txt)
- `/seo-debug` - Internal debug (noindex)
- `/sitemap-debug` - Internal debug (noindex)
- `/structured-data-debug` - Internal debug (noindex)

## Usage

### Prerequisites

Install Playwright browsers (one-time):

```bash
npx playwright install chromium
```

### Manual Prerendering

```bash
# 1. Build the app
npm run build

# 2. Run prerender
node scripts/prerender.mjs

# 3. Verify prerendered files
node scripts/verify-prerender.mjs
```

### Automated Build (Netlify)

In `netlify.toml` or build settings:

```bash
npm run build && npx playwright install chromium --with-deps && node scripts/prerender.mjs && node scripts/verify-prerender.mjs
```

## Verification

The verification script (`scripts/verify-prerender.mjs`) checks each prerendered HTML file for:

| Element | Requirement |
|---------|-------------|
| `<title>` | Must exist |
| Meta description | Must exist |
| Canonical | Must start with `https://thedealcalc.com` |
| og:title | Must exist |
| og:description | Must exist |
| og:url | Must start with `https://thedealcalc.com` |
| og:type | Must exist |
| og:image | Must be absolute URL |
| twitter:card | Must be `summary_large_image` |
| twitter:image | Must exist |
| JSON-LD | At least one valid block |

If any route fails verification, the script exits with code 1 (fails the build).

## Output

After prerendering, the `dist` folder contains:

```
dist/
├── index.html              # Prerendered /
├── calculators/
│   └── index.html          # Prerendered /calculators
├── npv-calculator/
│   └── index.html          # Prerendered /npv-calculator
├── rental-property-calculator/
│   └── index.html          # Prerendered /rental-property-calculator
└── ... (other routes)
```

## Hydration

Prerendered pages still contain the React app bundle. When a user visits:

1. Browser receives prerendered HTML (fast FCP)
2. React hydrates and takes over
3. SPA routing works normally for subsequent navigation

## Troubleshooting

### "dist directory not found"

Run `npm run build` before prerendering.

### "Playwright not found"

Run `npx playwright install chromium` to install the browser.

### Timeout errors

Increase the timeout in `prerender.mjs`:
```javascript
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
```

### Missing meta tags in prerendered output

1. Check that the page component uses `<Helmet>` or `<SeoHead>`
2. Increase the wait time in `prerender.mjs` for Helmet to render:
```javascript
await page.waitForTimeout(3000); // Increase from 2000
```

## Alternatives Considered

| Option | Notes |
|--------|-------|
| vite-plugin-prerender | Requires additional plugin, Puppeteer-based |
| Prerender.io | External service, costs money |
| vite-plugin-ssr | Full SSR solution, requires significant refactoring |

The custom Playwright approach was chosen for:
- Full control over the process
- No external dependencies beyond Playwright
- Clear verification of output
- Easy to debug and extend

## Performance Impact

- Build time: +30-60 seconds (depending on route count)
- Disk space: ~100-200KB per prerendered route
- Runtime: Zero impact (same SPA behavior)

## Monitoring

Use these tools to verify prerendering works:

1. **curl** - Check source HTML contains meta tags
   ```bash
   curl https://thedealcalc.com/npv-calculator | grep '<title>'
   ```

2. **Google Search Console** - Request indexing, check rendered HTML

3. **Rich Results Test** - https://search.google.com/test/rich-results

4. **Facebook Debugger** - https://developers.facebook.com/tools/debug/

5. **Twitter Card Validator** - https://cards-dev.twitter.com/validator
