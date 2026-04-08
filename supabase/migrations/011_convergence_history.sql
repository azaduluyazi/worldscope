-- ═══════════════════════════════════════════════════════════════════
--  Migration 011 — Convergence History (permanent archive)
-- ═══════════════════════════════════════════════════════════════════
--
--  The convergence engine writes fresh results to Redis every 5 minutes
--  with a 5-minute TTL. That's fine for the live UI but terrible for:
--
--    - Backtesting (no historical data to train against)
--    - Calibration (can't compute CTR without convergence history)
--    - Retroactive analysis (what did the engine say yesterday?)
--    - Prediction validation audit (which forecasts hit, which missed?)
--
--  This table is the permanent archive. Every convergence produced by
--  the engine above MIN_CONFIDENCE is written here. Auto-partitioned
--  by month via a scheduled function to keep the hot table small.
--
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS convergence_history (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  confidence NUMERIC(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  impact_chain JSONB NOT NULL DEFAULT '[]'::jsonb,
  predictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  narrative TEXT,
  timeline_start TIMESTAMPTZ NOT NULL,
  timeline_end TIMESTAMPTZ NOT NULL,
  centroid_lat NUMERIC(8, 4) NOT NULL,
  centroid_lng NUMERIC(8, 4) NOT NULL,
  affected_regions TEXT[] NOT NULL DEFAULT '{}',
  categories TEXT[] NOT NULL DEFAULT '{}',
  signal_count INTEGER NOT NULL DEFAULT 0,
  category_count INTEGER NOT NULL DEFAULT 0,
  storyline_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cycle_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Most common query: "what convergences fired in the last 7 days?"
CREATE INDEX IF NOT EXISTS idx_history_created_conf
  ON convergence_history (created_at DESC, confidence DESC);

-- Backtest / calibration query: "all convergences at confidence bucket X"
CREATE INDEX IF NOT EXISTS idx_history_confidence
  ON convergence_history (confidence);

-- Storyline backreference — find all convergence snapshots for a story
CREATE INDEX IF NOT EXISTS idx_history_storyline
  ON convergence_history (storyline_id, created_at DESC)
  WHERE storyline_id IS NOT NULL;

-- Category filter (GIN index for array containment)
CREATE INDEX IF NOT EXISTS idx_history_categories
  ON convergence_history USING GIN (categories);

-- Region filter
CREATE INDEX IF NOT EXISTS idx_history_regions
  ON convergence_history USING GIN (affected_regions);

-- Auto-purge anything older than 90 days via scheduled function.
-- Backtesting usually only needs last 30 days, and mega-events already
-- live in convergence_storylines (which has its own archival flow).
CREATE OR REPLACE FUNCTION purge_old_convergence_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM convergence_history
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Convenience view: daily convergence counts by confidence bucket
-- Used by the calibration dashboard.
CREATE OR REPLACE VIEW convergence_daily_stats AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  CASE
    WHEN confidence >= 0.9 THEN '0.9-1.0'
    WHEN confidence >= 0.8 THEN '0.8-0.9'
    WHEN confidence >= 0.7 THEN '0.7-0.8'
    WHEN confidence >= 0.6 THEN '0.6-0.7'
    WHEN confidence >= 0.5 THEN '0.5-0.6'
    ELSE '0.4-0.5'
  END AS bucket,
  COUNT(*) AS count,
  AVG(signal_count) AS avg_signals,
  AVG(category_count) AS avg_categories
FROM convergence_history
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY day, bucket
ORDER BY day DESC, bucket DESC;
