-- Add status field to creator_profiles
CREATE TYPE public.profile_status AS ENUM ('draft', 'published', 'hidden');

ALTER TABLE public.creator_profiles 
ADD COLUMN status public.profile_status DEFAULT 'published';

-- Create index for better query performance
CREATE INDEX idx_creator_profiles_status ON public.creator_profiles(status);

-- Update RLS policy to allow anonymous SELECT on published profiles
DROP POLICY IF EXISTS "Anyone can view creator profiles" ON public.creator_profiles;

CREATE POLICY "Anyone can view published creator profiles"
ON public.creator_profiles
FOR SELECT
TO anon, authenticated
USING (status = 'published' AND public_profile = true);

-- Backfill: set avatar_url from first portfolio image if null
UPDATE public.creator_profiles cp
SET avatar_url = (
  SELECT url 
  FROM public.portfolio_images pi 
  WHERE pi.creator_user_id = cp.user_id 
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE cp.avatar_url IS NULL 
  AND EXISTS (
    SELECT 1 
    FROM public.portfolio_images pi 
    WHERE pi.creator_user_id = cp.user_id
  );

-- Ensure all existing profiles are published by default
UPDATE public.creator_profiles
SET status = 'published'
WHERE status IS NULL;
