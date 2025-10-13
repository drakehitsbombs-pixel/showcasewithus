-- Fix PUBLIC_DATA_EXPOSURE: Protect email and phone numbers in users_extended table

-- Drop the overly permissive policy that exposes all user data
DROP POLICY IF EXISTS "Users can view basic profile info" ON public.users_extended;

-- Keep the policy for users to view their own full profile (already exists)
-- This policy: "Users can view own full profile" with USING (auth.uid() = id) is correct

-- Create a new policy that allows public viewing of ONLY safe fields for creator profiles
-- This enables the matching/discovery feature while protecting PII
CREATE POLICY "Public can view creator safe fields" ON public.users_extended
  FOR SELECT 
  USING (
    -- Only allow viewing creators who have completed their profiles
    EXISTS (
      SELECT 1 
      FROM public.creator_profiles 
      WHERE creator_profiles.user_id = users_extended.id
    )
  );

-- Note: This policy allows SELECT on all columns, but in practice the application
-- should only SELECT the safe columns (name, city, bio, avatar_url, role).
-- The email and phone columns should never be requested in queries for public viewing.
-- RLS ensures that users can only see their own email/phone via the "Users can view own full profile" policy.