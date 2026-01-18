# Prerendering for TheDealCalc (Vite SPA)

## Overview

TheDealCalc uses a custom Playwright-based prerender script that generates static HTML files at build time for SEO purposes.

## Quick Start

```bash
# Install Playwright (one-time)
npx playwright install chromium

# Build and prerender
npm run build:prerender
```

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `build` | `npm run build` | Standard Vite build |
| `prerender` | `npm run prerender` | Run prerendering on dist/ |
| `verify:prerender` | `npm run verify:prerender` | Verify prerendered files |
| `build:prerender` | `npm run build:prerender` | Build + prerender + verify |

## File Structure

```
scripts/
├── prerender.routes.mjs   # Single source of truth for routes
├── prerender.mjs          # Main prerender script (Playwright)
└── verify-prerender.mjs   # Verification script
```

## Route Configuration

Routes are defined in `scripts/prerender.routes.mjs`:

```javascript
// Routes to prerender
export const ROUTES_TO_PRERENDER = [
  '/',
  '/calculators',
  '/npv-calculator',
  // ... etc
];

// Routes that must NEVER be prerendered
export const EXCLUDED_ROUTES = [
  '/results',
  '/brrrr/results',
  '/syndication/results',
  '/admin',
  '/seo-debug',
  '/sitemap-debug',
  '/structured-data-debug',
];
```

### Adding New Routes

1. Edit `scripts/prerender.routes.mjs`
2. Add route to `ROUTES_TO_PRERENDER` array
3. Run `npm run build:prerender` to test

### Current Routes

**Prerendered (19 routes):**
- `/` - Homepage
- `/calculators` - Calculator hub
- `/npv-calculator` - NPV Calculator
- `/rental-property-calculator` - Rental Calculator
- `/brrrr-calculator` - BRRRR Calculator
- `/syndication-calculator` - Syndication Calculator
- `/cap-rate-calculator` - Cap Rate Calculator
- `/cash-on-cash-calculator` - Cash on Cash Calculator
- `/fix-and-flip-calculator` - Fix and Flip Calculator
- `/real-estate-investment-calculator` - Investment Calculator
- `/blog` - Blog index
- `/how-it-works` - How it works
- `/about` - About page
- `/contact` - Contact page
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/cookies` - Cookie policy
- `/disclaimer` - Disclaimer
- `/ad-tech-providers` - Ad tech providers

**Excluded (never prerendered):**
- `/results` - User results (noindex)
- `/brrrr/results` - BRRRR results (noindex)
- `/syndication/results` - Syndication results (noindex)
- `/admin/*` - Admin pages (blocked)
- `/seo-debug` - Debug tool (noindex)
- `/sitemap-debug` - Debug tool (noindex)
- `/structured-data-debug` - Debug tool (noindex)

## How It Works

### 1. Prerender Script (`prerender.mjs`)

1. Starts a local static server serving `dist/`
2. Launches headless Chromium via Playwright
3. For each route:
   - Navigates to the page
   - Waits for `og:title` and `canonical` meta tags
   - Captures full HTML including React-rendered content
   - Saves to `dist/<route>/index.html`

### 2. Verification Script (`verify-prerender.mjs`)

Checks each prerendered file for:

| Element | Validation |
|---------|------------|
| `<title>` | Must exist and not be empty |
| meta description | Must exist and not be empty |
| canonical | Must start with `https://thedealcalc.com` |
| og:title | Must exist |
| og:description | Must exist |
| og:url | Must start with `https://thedealcalc.com` |
| og:type | Must exist |
| og:image | Must be absolute URL |
| twitter:card | Must be `summary_large_image` |
| twitter:image | Must exist |
| JSON-LD | At least one valid block |

If any check fails, the script exits with code 1 (fails the build).

## Output Structure

After prerendering:

```
dist/
├── index.html                          # / (homepage)
├── calculators/
│   └── index.html                      # /calculators
├── npv-calculator/
│   └── index.html                      # /npv-calculator
├── rental-property-calculator/
│   └── index.html                      # /rental-property-calculator
├── brrrr-calculator/
│   └── index.html                      # /brrrr-calculator
└── ... (etc)
```

## Deployment

### Netlify

Add to build command:

```bash
npm run build && npx playwright install chromium --with-deps && node scripts/prerender.mjs && node scripts/verify-prerender.mjs
```

Or in `netlify.toml`:

```toml
[build]
  command = "npm run build && npx playwright install chromium --with-deps && node scripts/prerender.mjs && node scripts/verify-prerender.mjs"
  publish = "dist"
```

### Other Platforms

1. Ensure Node.js 18+ is available
2. Install Playwright browsers: `npx playwright install chromium --with-deps`
3. Run: `npm run build:prerender`

## Troubleshooting

### "dist directory not found"

Run `npm run build` before prerendering.

### "chromium not found"

Install Playwright browser:
```bash
npx playwright install chromium
```

On CI/servers, you may need system dependencies:
```bash
npx playwright install chromium --with-deps
```

### Timeout errors

Increase timeout in `prerender.mjs`:
```javascript
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
```

### Missing meta tags

1. Check that the page uses `<Helmet>` or `SeoHead` component
2. The script waits for `og:title` and `canonical` before saving
3. Check console output for warnings about missing tags

### Verification fails

Check the error message for which element is missing. Common issues:
- Page not using SeoHead component
- Missing OG image file
- Incorrect canonical URL base

## Verification Tools

After deployment, verify with:

1. **curl** - Check raw HTML:
   ```bash
   curl https://thedealcalc.com/npv-calculator | grep '<title>'
   ```

2. **Google Search Console** - Request indexing

3. **Rich Results Test** - https://search.google.com/test/rich-results

4. **Facebook Debugger** - https://developers.facebook.com/tools/debug/

5. **Twitter Card Validator** - https://cards-dev.twitter.com/validator

## Internal Debug Tools

- `/seo-debug` - Check SEO metadata for any route
- `/sitemap-debug` - Validate sitemap contents
- `/structured-data-debug` - Validate JSON-LD schemas

All debug routes are noindex and blocked in robots.txt.
