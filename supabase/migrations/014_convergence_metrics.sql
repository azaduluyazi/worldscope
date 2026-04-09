-- ═══════════════════════════════════════════════════════════════════
--  Migration 014 — Convergence Metrics (observability)
-- ═══════════════════════════════════════════════════════════════════
--
--  Every convergence cron cycle writes one row per track (geo + topic)
--  with counters that answer "why did we produce N clusters this
--  time?" When the topic track started producing 0 clusters on v3.7,
--  we had no observability — had to dig through events table + code
--  to guess. This table makes the answer a single query:
--
--    SELECT failure_reason, COUNT(*)
--    FROM convergence_metrics
--    WHERE cycle_timestamp >= NOW() - INTERVAL '24 hours'
--    GROUP BY failure_reason;
--
--  Shape is a union-friendly flat row — geo and topic tracks share
--  base counters, and track-specific fields are nullable. The `track`
--  column is the discriminator.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS convergence_metrics (
  id BIGSERIAL PRIMARY KEY,
  cycle_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  track TEXT NOT NULL CHECK (track IN ('geo', 'topic')),

  -- Shared counters (both tracks)
  events_input INTEGER NOT NULL DEFAULT 0,
  clusters_produced INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  failure_reason TEXT,  -- NULL when clusters_produced > 0

  -- Topic-track-specific (nullable for geo rows)
  events_with_embedding INTEGER,
  events_skipped_no_embedding INTEGER,
  clusters_dropped_min_size INTEGER,
  clusters_dropped_single_category INTEGER,

  -- Geo-track-specific (nullable for topic rows)
  geo_clusters_found INTEGER,
  temporal_groups_found INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast "what happened in the last N hours?" query
CREATE INDEX IF NOT EXISTS idx_convergence_metrics_recent
  ON convergence_metrics (cycle_timestamp DESC, track);

-- Fast "show me all failures" query
CREATE INDEX IF NOT EXISTS idx_convergence_metrics_failures
  ON convergence_metrics (track, failure_reason, cycle_timestamp DESC)
  WHERE failure_reason IS NOT NULL;

-- Rolling 7-day health summary view
CREATE OR REPLACE VIEW convergence_track_health AS
SELECT
  track,
  COUNT(*) AS cycles,
  SUM(events_input) AS total_events_seen,
  SUM(clusters_produced) AS total_clusters,
  ROUND(AVG(clusters_produced)::numeric, 2) AS avg_clusters_per_cycle,
  COUNT(*) FILTER (WHERE clusters_produced = 0) AS empty_cycles,
  COUNT(*) FILTER (WHERE failure_reason IS NOT NULL) AS failure_cycles,
  ROUND(AVG(duration_ms)::numeric, 0) AS avg_duration_ms,
  (
    SELECT failure_reason
    FROM convergence_metrics cm2
    WHERE cm2.track = cm.track AND cm2.failure_reason IS NOT NULL
    GROUP BY failure_reason
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) AS top_failure_reason
FROM convergence_metrics cm
WHERE cycle_timestamp >= NOW() - INTERVAL '7 days'
GROUP BY track;

-- Auto-purge after 14 days (cheap observability, not long-term storage)
CREATE OR REPLACE FUNCTION purge_old_convergence_metrics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM convergence_metrics
  WHERE cycle_timestamp < NOW() - INTERVAL '14 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
