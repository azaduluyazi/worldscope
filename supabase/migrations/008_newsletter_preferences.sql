-- Add digest preferences to newsletter_subscribers
-- Allows per-subscriber category/severity/maxItems customization for daily briefing

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT NULL;

-- GIN index for querying by preference values (e.g. find all subscribers with category "conflict")
CREATE INDEX IF NOT EXISTS idx_newsletter_preferences
  ON newsletter_subscribers USING GIN (preferences)
  WHERE preferences IS NOT NULL;

-- Remove Paddle-specific columns no longer used (V5 free model)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'newsletter_subscribers' AND column_name = 'paddle_subscription_id'
  ) THEN
    ALTER TABLE newsletter_subscribers DROP COLUMN paddle_subscription_id;
  END IF;
END $$;

-- Update tier check constraint: only 'free' is valid now
DO $$
BEGIN
  -- Drop old constraint if it includes 'premium'
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'newsletter_subscribers_tier_check'
  ) THEN
    ALTER TABLE newsletter_subscribers DROP CONSTRAINT newsletter_subscribers_tier_check;
    ALTER TABLE newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_tier_check
      CHECK (tier = 'free');
  END IF;
END $$;

-- Set all existing subscribers to free tier
UPDATE newsletter_subscribers SET tier = 'free' WHERE tier = 'premium';
