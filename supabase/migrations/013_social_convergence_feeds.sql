-- 013_social_convergence_feeds.sql
-- Adds community/social RSS feeds to the convergence pipeline.
-- These flow through the existing /api/cron/fetch-feeds cron — no code changes needed.
--
-- WHY: The convergence engine's power comes from CROSS-TIER agreement —
-- when a Tier-1 wire service and a Tier-4 community source both mention the
-- same event, the heterogeneous confirmation is worth more than two Tier-1
-- confirmations alone. These feeds add the community/video dimension.
--
-- SOURCE TIERING: Reliability scores are set in src/lib/convergence/source-reliability.ts
-- (see sibling change). Reddit → T4 (0.50), Hacker News → T3 (0.65),
-- YouTube news channels → T2 (0.80) since they mirror wire services.

-- ============================================================================
-- REDDIT (10 subreddits covering all major categories)
-- ============================================================================
INSERT INTO feeds (url, name, category, language, is_active) VALUES
  ('https://www.reddit.com/r/worldnews/.rss',       'Reddit r/worldnews',       'conflict',  'en', TRUE),
  ('https://www.reddit.com/r/geopolitics/.rss',     'Reddit r/geopolitics',     'diplomacy', 'en', TRUE),
  ('https://www.reddit.com/r/CredibleDefense/.rss', 'Reddit r/CredibleDefense', 'conflict',  'en', TRUE),
  ('https://www.reddit.com/r/cybersecurity/.rss',   'Reddit r/cybersecurity',   'cyber',     'en', TRUE),
  ('https://www.reddit.com/r/netsec/.rss',          'Reddit r/netsec',          'cyber',     'en', TRUE),
  ('https://www.reddit.com/r/economy/.rss',         'Reddit r/economy',         'finance',   'en', TRUE),
  ('https://www.reddit.com/r/energy/.rss',          'Reddit r/energy',          'energy',    'en', TRUE),
  ('https://www.reddit.com/r/space/.rss',           'Reddit r/space',           'tech',      'en', TRUE),
  ('https://www.reddit.com/r/earthquake/.rss',      'Reddit r/earthquake',      'natural',   'en', TRUE),
  ('https://www.reddit.com/r/MapPorn/.rss',         'Reddit r/MapPorn',         'diplomacy', 'en', TRUE)
ON CONFLICT (url) DO NOTHING;

-- ============================================================================
-- HACKER NEWS (2 variants: raw firehose + quality-filtered)
-- ============================================================================
-- hnrss.org is a free third-party service — no API key, no rate limit.
-- points=300 variant only surfaces stories that cleared the 300-point threshold,
-- which dramatically reduces noise at the cost of freshness lag.
INSERT INTO feeds (url, name, category, language, is_active) VALUES
  ('https://hnrss.org/frontpage',            'Hacker News Front Page', 'tech', 'en', TRUE),
  ('https://hnrss.org/frontpage?points=300', 'Hacker News Top 300+',   'tech', 'en', TRUE)
ON CONFLICT (url) DO NOTHING;

-- ============================================================================
-- YOUTUBE NEWS CHANNELS (verified channel_ids, no API key required)
-- ============================================================================
-- Every YouTube channel exposes a public RSS feed at:
--   https://www.youtube.com/feeds/videos.xml?channel_id=<UCxxx>
-- This is undocumented but stable since 2005. Zero quota cost, no auth.
-- Channel IDs below were verified against live feeds.
INSERT INTO feeds (url, name, category, language, is_active) VALUES
  ('https://www.youtube.com/feeds/videos.xml?channel_id=UChqUTb7kYRX8-EiaN3XFrSQ', 'YouTube Reuters',           'conflict',  'en', TRUE),
  ('https://www.youtube.com/feeds/videos.xml?channel_id=UCNye-wNBqNL5ZzHSJj3l8Bg', 'YouTube Al Jazeera English','diplomacy', 'en', TRUE),
  ('https://www.youtube.com/feeds/videos.xml?channel_id=UCknLrEdhRCp1aegoMqRaCZg', 'YouTube DW News',           'diplomacy', 'en', TRUE),
  ('https://www.youtube.com/feeds/videos.xml?channel_id=UC16niRr50-MSBwiO3YDb3RA', 'YouTube BBC News',          'conflict',  'en', TRUE),
  ('https://www.youtube.com/feeds/videos.xml?channel_id=UCIALMKvObZNtJ6AmdCLP7Lg', 'YouTube Bloomberg',         'finance',   'en', TRUE),
  ('https://www.youtube.com/feeds/videos.xml?channel_id=UCQfwfsi5VrQ8yKZ-UWmAEFg', 'YouTube FRANCE 24 English', 'diplomacy', 'en', TRUE)
ON CONFLICT (url) DO NOTHING;

-- ============================================================================
-- Summary
-- ============================================================================
-- Reddit:        10 subreddits
-- Hacker News:    2 variants
-- YouTube:        6 news channels
-- Total added:   18 feeds
--
-- Bluesky is NOT in this migration because it has no RSS endpoint.
-- See src/lib/api/bluesky.ts and /api/cron/fetch-bluesky for its integration.
