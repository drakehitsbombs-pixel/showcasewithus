-- Drop the old function first
DROP FUNCTION IF EXISTS public.get_creator_profile_by_username_or_id(text, uuid);

-- Recreate function with updated columns
CREATE OR REPLACE FUNCTION public.get_creator_profile_by_username_or_id(p_username text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(user_id uuid, username text, name text, city text, bio text, avatar_url text, min_project_budget_usd numeric, travel_radius_km integer, styles text[], rating_avg numeric, review_count integer, verification_status text, is_discoverable boolean, profile_avatar_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      cp.min_project_budget_usd,
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
$function$;