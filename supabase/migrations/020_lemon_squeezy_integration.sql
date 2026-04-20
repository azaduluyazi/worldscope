-- Lemon Squeezy integration
-- Extends existing subscriptions table (migration 005) with Lemon fields,
-- adds webhook idempotency table, adds subscription events audit log.
-- Paddle columns kept for historical safety (Paddle was rejected — no data).

-- ============================================================
-- 1. Extend subscriptions table
-- ============================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS lemon_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS lemon_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS lemon_order_id TEXT,
  ADD COLUMN IF NOT EXISTS lemon_product_id TEXT,
  ADD COLUMN IF NOT EXISTS lemon_variant_id TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS renews_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly'));

-- Widen plan enum via CHECK redefinition
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check CHECK (
    plan IN ('free', 'briefing_country', 'bundle5', 'global', 'pro', 'team', 'enterprise')
  );

-- Widen status enum
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check CHECK (
    status IN ('active', 'on_trial', 'paused', 'cancelled', 'expired', 'past_due', 'unpaid')
  );

CREATE INDEX IF NOT EXISTS idx_subscriptions_lemon_sub ON public.subscriptions(lemon_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_lemon_customer ON public.subscriptions(lemon_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON public.subscriptions(email) WHERE email IS NOT NULL;

-- ============================================================
-- 2. Webhook idempotency — prevents duplicate event processing
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lemon_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,           -- X-Event-Name + payload hash, for dedup
  event_name TEXT NOT NULL,                -- subscription_created, order_created, etc.
  webhook_id TEXT,                         -- from meta.webhook_id if present
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  error TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lemon_webhook_events_name ON public.lemon_webhook_events(event_name);
CREATE INDEX IF NOT EXISTS idx_lemon_webhook_events_processed ON public.lemon_webhook_events(processed_at) WHERE processed_at IS NULL;

-- ============================================================
-- 3. Subscription audit log — who did what, when
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  lemon_subscription_id TEXT,              -- denormalized for audit if subscription row deleted
  event_type TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_sub ON public.subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created ON public.subscription_events(created_at DESC);

-- ============================================================
-- 4. RLS
-- ============================================================
ALTER TABLE public.lemon_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events   ENABLE ROW LEVEL SECURITY;

-- Webhook events: service-role only (no anon access, ever)
CREATE POLICY "lemon_webhook_events_service_only"
  ON public.lemon_webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Subscription events: users can read their own audit log
CREATE POLICY "subscription_events_read_own"
  ON public.subscription_events
  FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM public.subscriptions WHERE user_id IN (
        SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
      )
    )
  );

CREATE POLICY "subscription_events_service_insert"
  ON public.subscription_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================
-- 5. Comment documentation
-- ============================================================
COMMENT ON TABLE public.lemon_webhook_events IS 'Idempotency log for Lemon Squeezy webhooks. Prevents duplicate event processing via unique event_id. service_role only.';
COMMENT ON TABLE public.subscription_events IS 'Append-only audit log of subscription status changes. Written by webhook handler.';
COMMENT ON COLUMN public.subscriptions.lemon_subscription_id IS 'Lemon Squeezy subscription.id from webhook payload.';
COMMENT ON COLUMN public.subscriptions.price_cents IS 'Price in smallest currency unit (cents for USD). Denormalized from variant for historical accuracy.';
