# Lighthouse CI Documentation

## Overview

This project uses [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) to automatically audit performance, accessibility, SEO, and best practices on every push and pull request.

## Audited URLs

The following routes are audited:

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/calculators` | Calculator hub |
| `/npv-calculator` | NPV Calculator |
| `/rental-property-calculator` | Rental Property Calculator |
| `/brrrr-calculator` | BRRRR Calculator landing |
| `/syndication-calculator` | Syndication Calculator landing |
| `/cap-rate-calculator` | Cap Rate Calculator |
| `/cash-on-cash-calculator` | Cash on Cash Calculator |
| `/fix-and-flip-calculator` | Fix and Flip Calculator |
| `/how-it-works` | How It Works page |
| `/blog` | Blog index |

## Score Thresholds (Warn-Only)

| Category | Minimum Score |
|----------|---------------|
| Performance | 90% |
| SEO | 100% |
| Accessibility | 95% |
| Best Practices | 95% |

These are set as warnings, not failures, to avoid blocking PRs while still surfacing regressions.

## Running Locally

### Prerequisites

```bash
npm install -g @lhci/cli serve
```

### Steps

1. **Build the production bundle:**
   ```bash
   npm run build
   ```

2. **Serve the build locally:**
   ```bash
   serve -s dist -l 3000
   ```

3. **Run Lighthouse CI (in a new terminal):**
   ```bash
   lhci autorun --config=lighthouserc.json
   ```

4. **View reports:**
   Reports are saved to `.lighthouseci/` directory. Open the HTML files in a browser.

### Quick One-Liner

```bash
npm run build && serve -s dist -l 3000 & sleep 5 && lhci autorun --config=lighthouserc.json
```

## Interpreting Results

### Report Files

After running, find these in `.lighthouseci/`:

- `lhr-*.html` - Human-readable HTML reports
- `lhr-*.json` - Machine-readable JSON data
- `manifest.json` - Summary of all runs

### Key Metrics

| Metric | What It Measures |
|--------|------------------|
| FCP (First Contentful Paint) | Time to first text/image |
| LCP (Largest Contentful Paint) | Time to largest content |
| TBT (Total Blocking Time) | Main thread blocking time |
| CLS (Cumulative Layout Shift) | Visual stability |
| SI (Speed Index) | How quickly content populates |

### Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Large bundle size | Lazy load routes and heavy components |
| Render-blocking resources | Preload critical assets, defer non-critical |
| Missing alt text | Add alt attributes to all images |
| Low contrast | Increase text/background contrast ratio |
| Missing meta description | Add via Helmet on each page |

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/lighthouse.yml`):

1. Triggers on push/PR to `main`
2. Builds production bundle
3. Serves on port 3000
4. Runs Lighthouse against all configured URLs
5. Uploads HTML/JSON reports as artifacts

### Viewing CI Reports

1. Go to the Actions tab in GitHub
2. Click on the workflow run
3. Download the `lighthouse-reports` artifact
4. Extract and open the HTML files

## Configuration

Edit `lighthouserc.json` to:

- Add/remove URLs to audit
- Adjust score thresholds
- Change number of runs per URL
- Modify throttling settings

## SPA Considerations

Since this is a client-side React SPA:

- Lighthouse may not fully crawl dynamically rendered content
- Pre-rendering or SSG would improve SEO scores but requires architectural changes
- Current setup audits the initial HTML + client-side hydration
