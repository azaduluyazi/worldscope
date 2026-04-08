-- ═══════════════════════════════════════════════════════════════════
--  Migration 010 — Convergence Telemetry
-- ═══════════════════════════════════════════════════════════════════
--
--  Records user interactions with convergences for calibration.
--  This is the FEEDBACK LOOP that turns the convergence engine from
--  rule-based to data-driven over time.
--
--  Once enough records accumulate (~1000+), we can:
--    1. Compute CTR by confidence bucket → calibration curve
--    2. Detect bucket inversions (high confidence with LOW CTR = bug)
--    3. Tune the Bayesian prior, decay half-lives, syndication
--       dampening factors against real user behavior
--
--  Storage strategy:
--    - Append-only event log
--    - Partitioned by month for fast purging
--    - Denormalized fields for fast aggregation queries
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS convergence_telemetry (
  id BIGSERIAL PRIMARY KEY,
  convergence_id TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN (
    'shown', 'clicked', 'dismissed', 'expanded',
    'shared', 'feedback_pos', 'feedback_neg'
  )),
  confidence NUMERIC(3, 2) NOT NULL,
  type TEXT NOT NULL,
  category_count INTEGER NOT NULL DEFAULT 0,
  signal_count INTEGER NOT NULL DEFAULT 0,
  has_narrative BOOLEAN NOT NULL DEFAULT FALSE,
  predictions_validated INTEGER NOT NULL DEFAULT 0,
  user_id TEXT,
  surface TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Confidence bucket aggregation (the main calibration query)
CREATE INDEX IF NOT EXISTS idx_telemetry_confidence_event
  ON convergence_telemetry (confidence, event, created_at DESC);

-- Per-convergence drilldown
CREATE INDEX IF NOT EXISTS idx_telemetry_convergence
  ON convergence_telemetry (convergence_id, created_at DESC);

-- Per-user activity (for personalized scoring later)
CREATE INDEX IF NOT EXISTS idx_telemetry_user
  ON convergence_telemetry (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- View: rolling 7-day CTR by confidence bucket
CREATE OR REPLACE VIEW convergence_ctr_buckets AS
SELECT
  CASE
    WHEN confidence >= 0.9 THEN '0.9-1.0'
    WHEN confidence >= 0.8 THEN '0.8-0.9'
    WHEN confidence >= 0.7 THEN '0.7-0.8'
    WHEN confidence >= 0.6 THEN '0.6-0.7'
    WHEN confidence >= 0.5 THEN '0.5-0.6'
    ELSE '0.4-0.5'
  END AS bucket,
  COUNT(*) FILTER (WHERE event = 'shown') AS shown,
  COUNT(*) FILTER (WHERE event = 'clicked') AS clicked,
  COUNT(*) FILTER (WHERE event = 'dismissed') AS dismissed,
  ROUND(
    COUNT(*) FILTER (WHERE event = 'clicked')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE event = 'shown'), 0),
    4
  ) AS ctr
FROM convergence_telemetry
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY bucket
ORDER BY bucket DESC;
