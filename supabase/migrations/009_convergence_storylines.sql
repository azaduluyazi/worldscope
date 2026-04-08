-- ═══════════════════════════════════════════════════════════════════
--  Migration 009 — Convergence Storylines
-- ═══════════════════════════════════════════════════════════════════
--
--  Long-lived narrative layer that groups multiple convergence
--  snapshots about the same ongoing situation. See storyline.ts for
--  the matching algorithm and TTL math.
--
--  Storage strategy:
--    - One row per storyline (mega-event lifecycle)
--    - snapshots stored as JSONB array (denormalized for read speed)
--    - peak_confidence + last_activity_at indexed for active queries
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS convergence_storylines (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  peak_confidence NUMERIC(3, 2) NOT NULL CHECK (peak_confidence >= 0 AND peak_confidence <= 1),
  snapshots JSONB NOT NULL DEFAULT '[]'::jsonb,
  centroid_lat NUMERIC(8, 4) NOT NULL,
  centroid_lng NUMERIC(8, 4) NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  affected_regions TEXT[] NOT NULL DEFAULT '{}',
  headline TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT FALSE
);

-- Active storylines (most common query: "show me what's live")
CREATE INDEX IF NOT EXISTS idx_storylines_active
  ON convergence_storylines (expires_at DESC, peak_confidence DESC)
  WHERE archived = FALSE;

-- Recency index for storyline matching (engine.ts attaches new convergences)
CREATE INDEX IF NOT EXISTS idx_storylines_recent
  ON convergence_storylines (last_activity_at DESC)
  WHERE archived = FALSE;

-- Geographic search (for region-filtered queries)
CREATE INDEX IF NOT EXISTS idx_storylines_centroid
  ON convergence_storylines (centroid_lat, centroid_lng)
  WHERE archived = FALSE;

-- Category tag search (GIN index for categories array)
CREATE INDEX IF NOT EXISTS idx_storylines_categories
  ON convergence_storylines USING GIN (categories);

-- Auto-archive expired storylines via a function callable from cron
CREATE OR REPLACE FUNCTION archive_expired_storylines()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE convergence_storylines
  SET archived = TRUE
  WHERE archived = FALSE
    AND expires_at < NOW();
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;
