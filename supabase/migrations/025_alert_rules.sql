-- Alert Rules Engine v1
-- Lets a user register custom triggers (keywords + categories + countries +
-- minimum score) that match against the incoming intel stream, with quiet
-- hours and delivery via the multi-channel digest dispatcher (lib/digest).
-- AES-256 encrypted keyword storage is deferred — keywords land in
-- keywords_plain now; keywords_encrypted column reserved for Sprint 2.

CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- identity
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,

  -- matching — all arrays are disjunctive within themselves, conjunctive across
  keywords_plain TEXT[] DEFAULT '{}',        -- case-insensitive substring match
  keywords_encrypted TEXT,                   -- reserved — AES-256 ciphertext
  categories TEXT[] DEFAULT '{}',            -- pantheon variant names (ares, hermes, …)
  countries TEXT[] DEFAULT '{}',             -- ISO 3166-1 alpha-2 codes
  min_score INTEGER DEFAULT 0,               -- convergence score floor (0-100)
  severities TEXT[] DEFAULT '{}',            -- allowed severity levels, empty = all

  -- quiet hours — JSON: { tz: "Europe/Istanbul", ranges: [{start:"22:00", end:"07:00"}] }
  quiet_hours JSONB,

  -- delivery — reuses the DigestChannelConfig shape from lib/digest/dispatch.ts
  channels JSONB DEFAULT '{}'::jsonb,

  -- rate limiting
  cooldown_minutes INTEGER DEFAULT 30,       -- minimum gap between fires for this rule
  last_fired_at TIMESTAMPTZ,

  -- audit
  fire_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_user ON public.alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON public.alert_rules(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_alert_rules_last_fired ON public.alert_rules(last_fired_at);

-- Fire log — append-only audit of which item matched which rule and when.
CREATE TABLE IF NOT EXISTS public.alert_fires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.alert_rules(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  item_title TEXT,                           -- denormalised in case event row vanishes
  matched_on JSONB,                          -- { keywords: […], categories: [], countries: [] }
  dispatched_channels JSONB,                 -- DispatchResult[] from dispatch()
  suppressed_reason TEXT,                    -- 'quiet_hours' | 'cooldown' | null
  fired_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_fires_rule ON public.alert_fires(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_fires_fired_at ON public.alert_fires(fired_at DESC);

-- RLS
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_fires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alert_rules_read_own"
  ON public.alert_rules FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "alert_rules_service_all"
  ON public.alert_rules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "alert_fires_read_own"
  ON public.alert_fires FOR SELECT
  USING (
    rule_id IN (
      SELECT id FROM public.alert_rules WHERE user_id IN (
        SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
      )
    )
  );

CREATE POLICY "alert_fires_service_insert"
  ON public.alert_fires FOR INSERT
  TO service_role
  WITH CHECK (true);

COMMENT ON TABLE public.alert_rules IS 'User-defined alert triggers. Evaluated by the alert engine against the incoming intel stream; matches dispatch via lib/digest/dispatch.ts.';
COMMENT ON TABLE public.alert_fires IS 'Append-only audit trail of alert rule matches and their dispatch results.';
COMMENT ON COLUMN public.alert_rules.keywords_encrypted IS 'Reserved for Sprint 2 AES-256 keyword ciphertext. Present column so the JSON contract does not change later.';
