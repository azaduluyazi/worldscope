# WorldScope

Real-time global intelligence dashboard.

## Tech Stack
- Next.js 15 (App Router), React 19, TypeScript
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
