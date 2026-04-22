-- OSINT Resource Directory
-- Catalog of external OSINT tools, feeds, and services surfaced at /osint.
-- Seed data lives in src/config/osint-resources.ts and is sync'd via
-- admin script (similar to feeds seeding).
--
-- Three integration types:
--   feed    — has RSS/API we already ingest into events table
--   widget  — embeddable iframe, rendered at /osint/live-maps (Gaia+ gated)
--   link    — external directory entry, user clicks through

CREATE TABLE IF NOT EXISTS public.osint_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  description_tr TEXT,

  -- Classification
  integration_type TEXT NOT NULL
    CHECK (integration_type IN ('feed', 'widget', 'link')),
  category TEXT NOT NULL
    CHECK (category IN (
      'conflict', 'cyber', 'geospatial', 'satellite', 'social',
      'telegram', 'news', 'fact-check', 'domain-ip', 'vuln',
      'weather', 'data', 'other'
    )),

  -- Scope — natural geo-tag. Most rows will be GLOBAL.
  scope TEXT NOT NULL DEFAULT 'GLOBAL'
    CHECK (scope IN ('GLOBAL', 'REGION', 'COUNTRY', 'CITY')),
  region TEXT,          -- When scope=REGION (europe, mideast, asia, etc.)
  country_code CHAR(2), -- When scope=COUNTRY (ISO 3166-1 alpha-2)
  city TEXT,            -- When scope=CITY (free text, lowercase)

  -- Cost model
  cost TEXT NOT NULL DEFAULT 'free'
    CHECK (cost IN ('free', 'freemium', 'paid')),

  -- Tier gating. 'free' = visible to everyone. 'global'/'enterprise' map
  -- to Gaia/Pantheon. Widgets default to 'global', links default to 'free'.
  required_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (required_tier IN ('free', 'global', 'enterprise')),

  -- Widget embed details (only when integration_type='widget')
  embed_url TEXT,
  embed_height INTEGER DEFAULT 600,

  -- Presentation
  tags TEXT[] NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 0, -- Higher = surfaced first

  -- Lifecycle
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_osint_resources_type
  ON public.osint_resources(integration_type) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_osint_resources_category
  ON public.osint_resources(category) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_osint_resources_country
  ON public.osint_resources(country_code) WHERE country_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_osint_resources_scope
  ON public.osint_resources(scope) WHERE is_active = TRUE;

-- RLS — public read for active rows, service role only for writes.
ALTER TABLE public.osint_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "osint_resources_public_read"
  ON public.osint_resources FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "osint_resources_service_all"
  ON public.osint_resources FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_osint_resource_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_osint_resources_updated_at
  BEFORE UPDATE ON public.osint_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_osint_resource_updated_at();

COMMENT ON TABLE public.osint_resources IS
  'OSINT directory surfaced at /osint. Seed source: src/config/osint-resources.ts';
COMMENT ON COLUMN public.osint_resources.integration_type IS
  'feed=ingested via cron, widget=iframe on /osint/live-maps, link=external directory entry';
COMMENT ON COLUMN public.osint_resources.required_tier IS
  'free=public (default for links), global=Gaia (default for widgets), enterprise=Pantheon';
