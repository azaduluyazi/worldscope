# WorldScope

Real-time global intelligence dashboard.

## Tech Stack
- Next.js 16 (App Router), React 19, TypeScript
- Mapbox GL JS, Supabase, Upstash Redis
- Tailwind CSS, shadcn/ui, Vercel AI SDK
- next-intl (EN + TR)

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
- Theme system: 21 themes via CSS cascade + `data-*` attributes (see `src/config/themes.ts`)
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
- `GROQ_API_KEY` — Groq LLM API key
- `ADMIN_KEY` — Admin panel access key
- `RESEND_API_KEY` — Email sending (optional)
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry error tracking (optional)
- `PADDLE_API_KEY` — Payment processing (optional)

### Vercel Deployment
1. Connect GitHub repo to Vercel
2. Set all environment variables above
3. Deploy — build runs `next build`

### Supabase Setup
1. Create project at supabase.com
2. Run migrations in order: `supabase db push`
3. Enable Realtime on `events` table

### Cron Jobs (Vercel)
Configured in `vercel.json` — `/api/cron/fetch-feeds` runs every 5 minutes

### Bundle Analysis
Run `ANALYZE=true npm run build` to inspect chunk sizes
