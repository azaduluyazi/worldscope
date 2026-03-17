-- AI-generated intelligence reports (daily/weekly)
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly')),
  lang TEXT NOT NULL DEFAULT 'en',
  date DATE NOT NULL,
  content TEXT NOT NULL,
  event_count INT DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (type, lang, date)
);

CREATE INDEX idx_reports_lookup ON reports (type, lang, date DESC);
