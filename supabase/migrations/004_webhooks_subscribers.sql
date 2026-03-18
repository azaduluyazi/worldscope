-- Webhook subscribers for real-time alert delivery
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  categories TEXT[] DEFAULT '{}',          -- empty = all categories
  min_severity TEXT DEFAULT 'high',        -- minimum severity to trigger
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  error_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks (is_active) WHERE is_active = true;

-- Email digest subscribers
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  frequency TEXT DEFAULT 'daily',          -- daily or weekly
  categories TEXT[] DEFAULT '{}',          -- empty = all
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_subs_active ON email_subscribers (is_active) WHERE is_active = true;
