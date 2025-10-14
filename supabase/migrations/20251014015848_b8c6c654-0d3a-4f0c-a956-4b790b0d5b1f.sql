-- Create surf_posts table for video feed
CREATE TABLE IF NOT EXISTS public.surf_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  spot_text TEXT,
  session_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_sec INTEGER,
  status TEXT DEFAULT 'ready' CHECK (status IN ('processing', 'ready', 'failed')),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create surf_likes table
CREATE TABLE IF NOT EXISTS public.surf_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.surf_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Create surf_comments table
CREATE TABLE IF NOT EXISTS public.surf_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.surf_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (length(text) <= 300),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.surf_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surf_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surf_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for surf_posts
CREATE POLICY "Anyone can view surf posts"
  ON public.surf_posts FOR SELECT
  USING (status = 'ready');

CREATE POLICY "Creators can insert own surf posts"
  ON public.surf_posts FOR INSERT
  WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Creators can update own surf posts"
  ON public.surf_posts FOR UPDATE
  USING (auth.uid() = creator_user_id);

CREATE POLICY "Creators can delete own surf posts"
  ON public.surf_posts FOR DELETE
  USING (auth.uid() = creator_user_id);

-- RLS Policies for surf_likes
CREATE POLICY "Anyone can view surf likes"
  ON public.surf_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON public.surf_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.surf_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for surf_comments
CREATE POLICY "Anyone can view non-deleted comments"
  ON public.surf_comments FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Users can insert comments"
  ON public.surf_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.surf_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update like_count on surf_posts
CREATE OR REPLACE FUNCTION public.update_surf_post_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.surf_posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.surf_posts
    SET like_count = like_count - 1
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER surf_likes_count_trigger
AFTER INSERT OR DELETE ON public.surf_likes
FOR EACH ROW EXECUTE FUNCTION public.update_surf_post_like_count();

-- Trigger to update comment_count on surf_posts
CREATE OR REPLACE FUNCTION public.update_surf_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.surf_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE public.surf_posts
    SET comment_count = comment_count - 1
    WHERE id = NEW.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER surf_comments_count_trigger
AFTER INSERT OR UPDATE ON public.surf_comments
FOR EACH ROW EXECUTE FUNCTION public.update_surf_post_comment_count();

-- Trigger to update updated_at on surf_posts
CREATE TRIGGER update_surf_posts_updated_at
BEFORE UPDATE ON public.surf_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add storage bucket for surf videos (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('surf-videos', 'surf-videos', true, 262144000, ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for surf videos
CREATE POLICY "Anyone can view surf videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'surf-videos');

CREATE POLICY "Authenticated users can upload surf videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'surf-videos' AND auth.uid() IS NOT NULL);