-- Add username to users_extended with unique constraint
ALTER TABLE public.users_extended ADD COLUMN username TEXT;
CREATE UNIQUE INDEX users_extended_username_lower_idx ON public.users_extended (LOWER(username));

-- Update creator_profiles to support showcase ranking
ALTER TABLE public.creator_profiles 
ADD COLUMN showcase_score FLOAT DEFAULT 0,
ADD COLUMN showcase_rank INTEGER,
ADD COLUMN is_discoverable BOOLEAN DEFAULT true;

-- Add missing columns to reviews
ALTER TABLE public.reviews 
ADD COLUMN media_urls TEXT[],
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Create trigger for review updated_at
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();