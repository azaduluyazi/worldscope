-- Developer API Keys table
-- Stores API key applications and approved keys (hashes only, never raw keys)

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  website TEXT,
  key_hash TEXT NOT NULL DEFAULT '',
  key_prefix TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'revoked')),
  rate_limit INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  request_count BIGINT NOT NULL DEFAULT 0
);

-- Index for fast lookup by key hash (validation path)
CREATE INDEX IF NOT EXISTS idx_api_keys_hash_status ON api_keys (key_hash, status);

-- Index for email lookups (duplicate checking)
CREATE INDEX IF NOT EXISTS idx_api_keys_email ON api_keys (email);

-- Index for admin listing by status
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys (status);

-- RPC function: atomically increment request count and update last_used_at
CREATE OR REPLACE FUNCTION increment_api_key_usage(key_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE api_keys
  SET request_count = request_count + 1,
      last_used_at = NOW()
  WHERE id = key_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no public access)
CREATE POLICY "Service role full access" ON api_keys
  FOR ALL
  USING (auth.role() = 'service_role');
