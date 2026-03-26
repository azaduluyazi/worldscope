-- Newsletter subscribers for premium mail service ($1/mo)
-- Merges with Paddle subscription lifecycle
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly')),
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  is_active BOOLEAN DEFAULT true,
  paddle_subscription_id TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers (is_active, tier)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers (email);

-- Add paddle_subscription_id to existing subscriptions table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'paddle_subscription_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN paddle_subscription_id TEXT UNIQUE;
  END IF;
END $$;
