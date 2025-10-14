-- Add index for username lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_extended_username_lower ON users_extended (LOWER(username));

-- Add index for creator lookups
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON creator_profiles (user_id);

-- Add function to get creator profile with fallback
CREATE OR REPLACE FUNCTION public.get_creator_profile_by_username_or_id(
  p_username TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  name TEXT,
  city TEXT,
  bio TEXT,
  avatar_url TEXT,
  price_band_low NUMERIC,
  price_band_high NUMERIC,
  travel_radius_km INTEGER,
  styles TEXT[],
  rating_avg NUMERIC,
  review_count INTEGER,
  verification_status TEXT,
  is_discoverable BOOLEAN,
  profile_avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_user_id UUID;
BEGIN
  -- Try to resolve by username first (case-insensitive)
  IF p_username IS NOT NULL THEN
    SELECT u.id INTO resolved_user_id
    FROM users_extended u
    WHERE LOWER(u.username) = LOWER(p_username)
    LIMIT 1;
  END IF;
  
  -- Fallback to user_id if username didn't resolve
  IF resolved_user_id IS NULL AND p_user_id IS NOT NULL THEN
    resolved_user_id := p_user_id;
  END IF;
  
  -- Return profile data if user found
  IF resolved_user_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      u.id,
      u.username,
      u.name,
      u.city,
      u.bio,
      u.avatar_url,
      cp.price_band_low,
      cp.price_band_high,
      cp.travel_radius_km,
      cp.styles,
      cp.rating_avg,
      cp.review_count,
      cp.verification_status,
      cp.is_discoverable,
      cp.avatar_url as profile_avatar_url
    FROM users_extended u
    LEFT JOIN creator_profiles cp ON cp.user_id = u.id
    WHERE u.id = resolved_user_id;
  END IF;
END;
$$;