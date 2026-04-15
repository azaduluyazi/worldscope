-- ─────────────────────────────────────────────
-- Migration 015 — Newsletter Referrals (Morning Brew–style)
--
-- Purpose: Add referral tracking to newsletter_subscribers + create a
-- referrals ledger so subscribers can earn rewards for inviting others.
--
-- Tier rewards (resolved at runtime in src/lib/newsletter/referral-tiers.ts):
--   3  refs → "Analyst" badge + briefing archive access
--   10 refs → "Operator" + custom country alerts
--   25 refs → branded swag (manual fulfillment)
--   100 refs → private monthly briefing
--
-- Idempotent — can be re-run safely.
-- ─────────────────────────────────────────────

-- 1. Add referral fields to newsletter_subscribers if not present
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by TEXT,
  ADD COLUMN IF NOT EXISTS referral_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source TEXT;

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_referral_code
  ON newsletter_subscribers (referral_code);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_referred_by
  ON newsletter_subscribers (referred_by);

-- 2. Generate referral codes for any existing rows missing one.
-- Uses substring of md5(email || created_at) — short, URL-safe, unique-ish.
UPDATE newsletter_subscribers
SET referral_code = SUBSTRING(MD5(email || COALESCE(subscribed_at::text, NOW()::text)), 1, 8)
WHERE referral_code IS NULL;

-- 3. Trigger to auto-generate referral_code on insert
CREATE OR REPLACE FUNCTION set_newsletter_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := SUBSTRING(
      MD5(NEW.email || COALESCE(NEW.subscribed_at::text, NOW()::text)),
      1, 8
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_newsletter_referral_code ON newsletter_subscribers;
CREATE TRIGGER trg_newsletter_referral_code
  BEFORE INSERT ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION set_newsletter_referral_code();

-- 4. Referrals ledger — each successful referral creates a row.
CREATE TABLE IF NOT EXISTS newsletter_referrals (
  id           BIGSERIAL PRIMARY KEY,
  referrer_email TEXT NOT NULL REFERENCES newsletter_subscribers(email) ON DELETE CASCADE,
  referee_email  TEXT NOT NULL REFERENCES newsletter_subscribers(email) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referrer_email, referee_email)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_referrals_referrer
  ON newsletter_referrals (referrer_email);

-- 5. Trigger: when a referral row is inserted, bump the referrer's count.
CREATE OR REPLACE FUNCTION bump_referral_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE newsletter_subscribers
  SET referral_count = referral_count + 1
  WHERE email = NEW.referrer_email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_referral_count ON newsletter_referrals;
CREATE TRIGGER trg_bump_referral_count
  AFTER INSERT ON newsletter_referrals
  FOR EACH ROW
  EXECUTE FUNCTION bump_referral_count();

-- 6. View: leaderboard (top 100 referrers) — used by /api/newsletter/leaderboard
CREATE OR REPLACE VIEW newsletter_referral_leaderboard AS
SELECT
  email,
  referral_code,
  referral_count,
  CASE
    WHEN referral_count >= 100 THEN 'briefing-circle'
    WHEN referral_count >= 25  THEN 'swag-tier'
    WHEN referral_count >= 10  THEN 'operator'
    WHEN referral_count >= 3   THEN 'analyst'
    ELSE 'subscriber'
  END AS tier,
  subscribed_at
FROM newsletter_subscribers
WHERE is_active = TRUE
  AND referral_count > 0
ORDER BY referral_count DESC, subscribed_at ASC
LIMIT 100;

-- 7. Add a "corrections" table referenced by /corrections page
CREATE TABLE IF NOT EXISTS corrections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE NOT NULL,
  url             TEXT NOT NULL,
  headline        TEXT NOT NULL,
  original_claim  TEXT NOT NULL,
  correction      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corrections_date ON corrections (date DESC);

-- 7b. Telegram posting tracker on convergence_storylines
ALTER TABLE convergence_storylines
  ADD COLUMN IF NOT EXISTS posted_to_telegram_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_storylines_telegram_unposted
  ON convergence_storylines (created_at DESC)
  WHERE posted_to_telegram_at IS NULL;

-- 8. Row-level security (recommended for public-readable tables)
ALTER TABLE newsletter_referrals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrections           ENABLE ROW LEVEL SECURITY;

-- Public read for corrections (it's a transparency log)
DROP POLICY IF EXISTS corrections_public_read ON corrections;
CREATE POLICY corrections_public_read
  ON corrections FOR SELECT
  USING (TRUE);

-- newsletter_referrals is server-only (service-role writes via API)
-- Default deny is sufficient.
