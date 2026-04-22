-- Outbound Webhooks table
-- Enables users to subscribe a URL that receives real-time intel events
-- matching their category + severity filters. Consumed by
-- src/lib/notifications/webhook-delivery.ts and managed via /api/webhooks.
--
-- Previously these code paths wrote to a non-existent `webhooks` table,
-- producing silent no-ops (PostgREST 404 swallowed by catch blocks).
-- See wiki/sorunlar/outbound-webhooks-table-missing.md for context.

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Subscription owner — nullable so anonymous / service subscriptions
  -- still work while we gate this behind user auth later.
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Target
  url TEXT NOT NULL UNIQUE,

  -- Matching filters — empty categories = match all, min_severity gates
  -- by severity ladder (critical > high > medium > low > info).
  categories TEXT[] NOT NULL DEFAULT '{}',
  min_severity TEXT NOT NULL DEFAULT 'high'
    CHECK (min_severity IN ('critical', 'high', 'medium', 'low', 'info')),

  -- Health + lifecycle
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_error TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_active
  ON public.webhooks(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_webhooks_user
  ON public.webhooks(user_id) WHERE user_id IS NOT NULL;

-- RLS — follows the alert_rules pattern.
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhooks_read_own"
  ON public.webhooks FOR SELECT
  USING (
    user_id IS NULL
    OR user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "webhooks_insert_own"
  ON public.webhooks FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "webhooks_update_own"
  ON public.webhooks FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "webhooks_delete_own"
  ON public.webhooks FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
    )
  );

-- Service role: dispatcher + health reset cron.
CREATE POLICY "webhooks_service_all"
  ON public.webhooks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_webhook_updated_at()
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

CREATE TRIGGER trg_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_webhook_updated_at();

COMMENT ON TABLE public.webhooks IS 'Outbound webhook subscriptions. Matches intel events by category + min_severity, delivered by lib/notifications/webhook-delivery.ts. Deactivated at error_count >= 5.';
COMMENT ON COLUMN public.webhooks.user_id IS 'NULL = unauthenticated / service subscription. Future: require non-null when auth is enforced.';
