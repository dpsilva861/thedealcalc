# CREagentic

AI-powered LOI redlining for commercial real estate. CREagentic analyzes Letters of Intent against institutional-grade benchmarks and delivers severity-rated findings, suggested alternative language, and negotiation strategy recommendations in 60 seconds for $2 per document.

The platform includes a self-learning AI engine that continuously improves its analysis through user feedback, nightly aggregation of deal patterns, and weekly prompt evolution with A/B testing. Over 130 pages of SEO content cover every U.S. state, property type, deal type, and key CRE topics.

## Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS with custom dark theme
- **Database:** Supabase (PostgreSQL)
- **Authentication:** NextAuth.js
- **Payments:** Stripe ($2 per-document checkout)
- **AI:** Claude API (claude-sonnet-4-20250514)
- **Analytics:** Google Analytics 4, Vercel Analytics
- **Deployment:** Vercel

## Setup

```bash
# Clone the repository
git clone https://github.com/dpsilva861/thedealcalc.git
cd thedealcalc

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local and fill in all required values (see Environment Variables below)

# Run Supabase migration
npx supabase db push

# Seed the database with initial prompt version
npx supabase db seed

# Start development server
npm run dev
```

## Environment Variables

Create a `.env.local` file with these values:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Analytics (optional for local dev)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Admin
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

## Development

```bash
npm run dev     # Start dev server at http://localhost:3000
npm run build   # Production build
npm run lint    # Run linter
```

## Deployment

1. Push to GitHub
2. Connect the repository to Vercel
3. Add all environment variables in Vercel project settings
4. Deploy

Vercel will automatically build and deploy on push to main.

## Admin Access

1. Add the admin user's email to the `ADMIN_EMAILS` environment variable (comma-separated)
2. Access the learning dashboard at `/admin/learning`
3. The dashboard shows pattern performance, A/B test results, feedback trends, and manual controls for aggregation and evolution

## Cron Jobs

Two scheduled jobs power the self-learning engine:

| Job | Schedule | Endpoint |
|-----|----------|----------|
| Nightly Aggregation | Daily at 2:00 AM UTC | `POST /api/learning/aggregate` |
| Weekly Prompt Evolution | Sunday at midnight UTC | `POST /api/learning/evolve` |

These are configured in `vercel.json` and run automatically on Vercel. They can also be triggered manually from the admin dashboard.

Alternatively, configure Supabase Edge Functions (see `supabase/functions/`) to call these endpoints on the same schedule.

## Project Structure

```
src/
  app/              # Next.js App Router pages and API routes
  components/       # React components (layout, redline, SEO, UI)
  data/             # Static data (blog posts, states, property types, glossary)
  lib/              # Core logic (redline engine, learning system, Stripe, Supabase)
  types/            # TypeScript interfaces
supabase/
  migrations/       # Database schema migrations
  functions/        # Supabase Edge Functions for cron
  seed.sql          # Initial prompt version seed
```

## Legal

The Terms of Service at `/terms` contains a required legal disclaimer stating that CREagentic is not legal advice, is not a law firm, and that users should consult qualified professionals. This disclaimer is a critical legal protection for the product and must not be removed or obscured.
