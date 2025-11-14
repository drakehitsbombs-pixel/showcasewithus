-- Add show_name_public field to creator_profiles
ALTER TABLE public.creator_profiles 
ADD COLUMN IF NOT EXISTS show_name_public boolean DEFAULT true;