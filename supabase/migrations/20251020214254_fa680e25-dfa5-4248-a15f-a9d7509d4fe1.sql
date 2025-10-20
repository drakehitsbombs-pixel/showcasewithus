-- Add slug column to users_extended for public profile URLs
ALTER TABLE users_extended 
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Add visibility controls to creator_profiles
ALTER TABLE creator_profiles 
ADD COLUMN IF NOT EXISTS public_profile boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_price_range boolean DEFAULT true;

-- Create daily views aggregation table for performance
CREATE TABLE IF NOT EXISTS creator_views_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id uuid NOT NULL,
  date date NOT NULL,
  unique_views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(creator_user_id, date)
);

-- Enable RLS on creator_views_daily
ALTER TABLE creator_views_daily ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read aggregated view counts
CREATE POLICY "Anyone can view aggregated counts"
ON creator_views_daily FOR SELECT
USING (true);

-- Policy: System can insert/update (for cron job)
CREATE POLICY "System can manage daily views"
ON creator_views_daily FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_creator_views_daily_date ON creator_views_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_creator_views_daily_views ON creator_views_daily(unique_views DESC);

-- Function to generate unique slug from name
CREATE OR REPLACE FUNCTION generate_slug(display_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(display_name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Add random suffix
  final_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM users_extended WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || substr(md5(random()::text || counter::text), 1, 6);
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Function to auto-generate slug on insert if missing
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate slug
DROP TRIGGER IF EXISTS trigger_auto_generate_slug ON users_extended;
CREATE TRIGGER trigger_auto_generate_slug
BEFORE INSERT OR UPDATE ON users_extended
FOR EACH ROW
WHEN (NEW.slug IS NULL OR NEW.slug = '')
EXECUTE FUNCTION auto_generate_slug();

-- Backfill slugs for existing users without one
UPDATE users_extended
SET slug = generate_slug(name)
WHERE slug IS NULL;

-- Function to aggregate daily views (to be called by cron)
CREATE OR REPLACE FUNCTION aggregate_daily_views(target_date date DEFAULT CURRENT_DATE - 1)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO creator_views_daily (creator_user_id, date, unique_views, updated_at)
  SELECT 
    creator_user_id,
    target_date,
    COUNT(DISTINCT viewer_user_id) as unique_views,
    now()
  FROM profile_views
  WHERE DATE(created_at) = target_date
    AND viewer_user_id IS NOT NULL
  GROUP BY creator_user_id
  ON CONFLICT (creator_user_id, date)
  DO UPDATE SET
    unique_views = EXCLUDED.unique_views,
    updated_at = now();
END;
$$;