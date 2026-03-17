-- Add unique constraint on url for upsert support
ALTER TABLE events ADD CONSTRAINT events_url_unique UNIQUE (url);

-- Enable Realtime on events table (for live push to clients)
ALTER PUBLICATION supabase_realtime ADD TABLE events;

-- Add composite index for common query pattern
CREATE INDEX idx_events_category_published ON events (category, published_at DESC);

-- Add index for geo queries
CREATE INDEX idx_events_geo ON events (lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
