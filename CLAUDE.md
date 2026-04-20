# WorldScope

Real-time global intelligence dashboard.

## Tech Stack
- Next.js 16 (App Router), React 19, TypeScript
- Mapbox GL JS + react-globe.gl, Supabase (Pro), Upstash Redis
- Tailwind CSS, shadcn/ui, Vercel AI SDK (Groq + OpenAI + Anthropic failover)
- next-intl — **30 locales** incl. RTL (ar, fa). See `src/i18n/config.ts`
- Lemon Squeezy (Merchant of Record) — webhook + checkout wired (migration 020)

## Commands
- `npm run dev` — development server
- `npm run build` — production build
- `npm run test` — vitest unit tests
- `npm run lint` — eslint

## Architecture
- `src/app/` — Next.js App Router pages + API routes
- `src/components/dashboard/` — dashboard UI components
- `src/lib/api/` — external API clients
- `src/lib/cache/` — Redis cache layer
- `src/lib/db/` — Supabase client
- `src/hooks/` — SWR data hooks
- `src/config/` — feeds, layers, markets config
- `src/types/` — TypeScript type definitions

## Conventions
- All API clients go in `src/lib/api/`
- All data fetching via SWR hooks in `src/hooks/`
- Severity levels: critical, high, medium, low, info
- Colors: red=#ff4757, yellow=#ffd000, cyan=#00e5ff, green=#00ff88, purple=#8a5cf6
- Theme system: **2 themes** (`warroom`, `cyberpunk`) via CSS cascade + `data-theme` attribute. See `src/config/themes.ts`. Unknown/legacy theme ids fall back to `warroom` via `getThemeById`.
- Variants: **11 Greek pantheon variants** (Olympus, Ares, Hephaestus, Hermes, Athena, Poseidon, Apollo, Zeus, Demeter, Nike, Eirene) — see `src/config/variants.ts`. 9 are SEO-indexed at `/country/[code]/[variant]`.
- Pricing tiers (planned, pantheon-named): Chora ($1/country), Pleiades ($5/5-country), Gaia ($9/global), Prometheus ($19/pro), Pantheon ($99/team).
- Validation schemas in `src/lib/validators/`
- Rate limiting via `src/lib/middleware/rate-limit.ts`

## Deployment

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (server only)
- `UPSTASH_REDIS_REST_URL` — Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis token
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox GL access token
- `GROQ_API_KEY` — Groq LLM API key (narratives)
- `GEMINI_API_KEY` — Gemini embeddings (convergence semantic layer, free tier 1500 RPM at https://aistudio.google.com/app/apikey). Engine degrades gracefully if missing but loses semantic dedup + cross-region linking.
- `CRON_SECRET` — Bearer token required by all `/api/cron/*` routes
- `ADMIN_KEY` — Admin panel access key
- `RESEND_API_KEY` — Email sending (optional)
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry error tracking (optional)
- `LEMONSQUEEZY_API_KEY` — Lemon Squeezy API key (payments)
- `LEMONSQUEEZY_WEBHOOK_SECRET` — HMAC secret for inbound webhooks
- `LEMONSQUEEZY_STORE_ID` — numeric store id

### Vercel Deployment
1. Connect GitHub repo to Vercel
2. Set all environment variables above
3. Deploy — build runs `next build`

### Supabase Setup
1. Create project at supabase.com
2. Run migrations in order: `supabase db push`
   - Latest migration: `020_lemon_squeezy_integration.sql` — extends `subscriptions` with Lemon columns, adds `lemon_webhook_events` (idempotency) and `subscription_events` (audit log).
   - Migration `015` is intentionally skipped — number is reserved.
3. Enable Realtime on `events` table

### Cron Jobs (Vercel)
Configured in `vercel.json` — `/api/cron/fetch-feeds` runs every 5 minutes

### Bundle Analysis
Run `ANALYZE=true npm run build` to inspect chunk sizes
