-- Fix PII exposure in users_extended table
-- Drop the overly permissive "Public can view creator safe fields" policy
-- This policy allowed anyone to see ALL columns (including email, phone, geo_lat, geo_lng)
-- when a creator profile exists. This is a privacy violation.

DROP POLICY IF EXISTS "Public can view creator safe fields" ON public.users_extended;

-- The discovery feature will still work because:
-- 1. creator_profiles table is already public (by design)
-- 2. Joins to users_extended will use other policies (own profile, admin access)
-- 3. Public users can see creator profiles, but not PII from users_extended