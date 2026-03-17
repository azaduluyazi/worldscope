-- Events / intelligence items
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  image_url TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  country_code TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  CONSTRAINT valid_severity CHECK (severity IN ('critical','high','medium','low','info'))
);

CREATE INDEX idx_events_published ON events (published_at DESC);
CREATE INDEX idx_events_category ON events (category);
CREATE INDEX idx_events_severity ON events (severity);
CREATE INDEX idx_events_expires ON events (expires_at);

-- Market snapshots
CREATE TABLE market_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  change_pct DOUBLE PRECISION DEFAULT 0,
  volume BIGINT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_symbol ON market_snapshots (symbol, recorded_at DESC);

-- RSS feed definitions
CREATE TABLE feeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  error_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feeds_active ON feeds (is_active, category);

-- Cleanup: auto-delete expired events
CREATE OR REPLACE FUNCTION cleanup_expired_events()
RETURNS void AS $$
BEGIN
  DELETE FROM events WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
