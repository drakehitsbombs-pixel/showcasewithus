-- Fix return type mismatch for distance_mi column
DROP FUNCTION IF EXISTS search_creators(text[], numeric, numeric, numeric, numeric, integer, integer);

CREATE OR REPLACE FUNCTION search_creators(
  styles_array text[] DEFAULT '{}',
  max_budget numeric DEFAULT NULL,
  user_lat numeric DEFAULT NULL,
  user_lon numeric DEFAULT NULL,
  max_miles numeric DEFAULT NULL,
  result_limit integer DEFAULT 50,
  result_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  styles text[],
  min_project_budget_usd numeric,
  slug text,
  rating_avg numeric,
  review_count integer,
  showcase_score double precision,
  city text,
  geo_lat numeric,
  geo_lng numeric,
  distance_mi double precision
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT 
      cp.*,
      ue.city,
      ue.geo_lat,
      ue.geo_lng
    FROM creator_profiles cp
    INNER JOIN users_extended ue ON cp.user_id = ue.id
    WHERE cp.is_discoverable = true
      AND cp.public_profile = true
      AND cp.status = 'published'
      -- Filter by styles (if provided)
      AND (
        COALESCE(array_length(styles_array, 1), 0) = 0
        OR EXISTS (
          SELECT 1 FROM unnest(cp.styles) style 
          WHERE lower(style) = ANY(styles_array)
        )
      )
      -- Filter by budget (if provided)
      AND (
        max_budget IS NULL 
        OR cp.min_project_budget_usd <= max_budget
      )
  ),
  with_distance AS (
    SELECT 
      b.*,
      CASE
        WHEN user_lat IS NULL OR user_lon IS NULL OR max_miles IS NULL OR b.geo_lat IS NULL OR b.geo_lng IS NULL THEN NULL
        ELSE (
          3959 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(user_lat)) * cos(radians(b.geo_lat)) *
              cos(radians(b.geo_lng) - radians(user_lon)) +
              sin(radians(user_lat)) * sin(radians(b.geo_lat))
            ))
          )
        )
      END AS calc_distance_mi
    FROM base b
  )
  SELECT 
    wd.id,
    wd.user_id,
    wd.display_name,
    wd.avatar_url,
    wd.styles,
    wd.min_project_budget_usd,
    wd.slug,
    wd.rating_avg,
    wd.review_count,
    wd.showcase_score,
    wd.city,
    wd.geo_lat,
    wd.geo_lng,
    wd.calc_distance_mi
  FROM with_distance wd
  WHERE (
    max_miles IS NULL 
    OR wd.calc_distance_mi IS NULL 
    OR wd.calc_distance_mi <= max_miles
  )
  ORDER BY COALESCE(wd.calc_distance_mi, 999999), wd.showcase_score DESC NULLS LAST, wd.updated_at DESC
  LIMIT result_limit 
  OFFSET result_offset;
END;
$$;