-- Create dismissed_recommendations table
CREATE TABLE IF NOT EXISTS dismissed_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  title_type TEXT NOT NULL CHECK (title_type IN ('film', 'series')),
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dismissed_recommendations_user_id
  ON dismissed_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_dismissed_recommendations_tmdb_id
  ON dismissed_recommendations(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_dismissed_recommendations_user_type
  ON dismissed_recommendations(user_id, title_type);

-- Enable RLS
ALTER TABLE dismissed_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own dismissed recommendations"
  ON dismissed_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can dismiss recommendations"
  ON dismissed_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can un-dismiss recommendations"
  ON dismissed_recommendations FOR DELETE
  USING (auth.uid() = user_id);
