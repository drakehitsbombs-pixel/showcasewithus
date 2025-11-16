-- Fix 1: Add DB-level length constraints for validated fields
ALTER TABLE messages 
  ADD CONSTRAINT messages_text_length 
  CHECK (length(text) <= 2000);

ALTER TABLE users_extended
  ADD CONSTRAINT bio_length
  CHECK (bio IS NULL OR length(bio) <= 500);

ALTER TABLE users_extended
  ADD CONSTRAINT name_length
  CHECK (length(name) <= 100);

-- Fix 2: Update aggregate function to only count authenticated views
-- This prevents spam/manipulation by ignoring anonymous views in analytics
CREATE OR REPLACE FUNCTION public.aggregate_daily_views(target_date date DEFAULT (CURRENT_DATE - 1))
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    AND viewer_user_id IS NOT NULL  -- Only count authenticated views
  GROUP BY creator_user_id
  ON CONFLICT (creator_user_id, date)
  DO UPDATE SET
    unique_views = EXCLUDED.unique_views,
    updated_at = now();
END;
$$;