-- Add email and phone public visibility toggles to creator_profiles
ALTER TABLE public.creator_profiles 
ADD COLUMN IF NOT EXISTS email_public boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS phone_public boolean DEFAULT true;

COMMENT ON COLUMN public.creator_profiles.email_public IS 'Whether photographer email is visible to public visitors';
COMMENT ON COLUMN public.creator_profiles.phone_public IS 'Whether photographer phone is visible to public visitors';