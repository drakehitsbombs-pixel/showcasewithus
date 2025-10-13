-- Create views tracking table for dashboard metrics
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE CASCADE,
  viewer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own profile views"
ON public.profile_views FOR SELECT
USING (auth.uid() = creator_user_id);

CREATE POLICY "Anyone can insert profile views"
ON public.profile_views FOR INSERT
WITH CHECK (true);

-- Add index for profile views queries
CREATE INDEX idx_profile_views_creator_date ON public.profile_views(creator_user_id, created_at DESC);

-- Add GIN indexes for tag searches
CREATE INDEX IF NOT EXISTS idx_creator_profiles_styles_gin ON public.creator_profiles USING GIN(styles);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_tags_gin ON public.portfolio_images USING GIN(tags);