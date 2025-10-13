-- Add avatar_url to creator_profiles if not exists
ALTER TABLE public.creator_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location_text TEXT,
  project_type TEXT CHECK (project_type IN ('wedding', 'portrait', 'product', 'event')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create project_media table
CREATE TABLE IF NOT EXISTS public.project_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create threads table (one per client-creator pair)
CREATE TABLE IF NOT EXISTS public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(creator_user_id, client_user_id)
);

-- Add thread_id to messages and new columns
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Anyone can view projects" 
  ON public.projects FOR SELECT USING (true);

CREATE POLICY "Creators can insert own projects" 
  ON public.projects FOR INSERT 
  WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Creators can update own projects" 
  ON public.projects FOR UPDATE 
  USING (auth.uid() = creator_user_id);

CREATE POLICY "Creators can delete own projects" 
  ON public.projects FOR DELETE 
  USING (auth.uid() = creator_user_id);

-- RLS Policies for project_media
CREATE POLICY "Anyone can view project media" 
  ON public.project_media FOR SELECT USING (true);

CREATE POLICY "Creators can insert media for own projects" 
  ON public.project_media FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_media.project_id 
    AND projects.creator_user_id = auth.uid()
  ));

CREATE POLICY "Creators can update media for own projects" 
  ON public.project_media FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_media.project_id 
    AND projects.creator_user_id = auth.uid()
  ));

CREATE POLICY "Creators can delete media for own projects" 
  ON public.project_media FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_media.project_id 
    AND projects.creator_user_id = auth.uid()
  ));

-- RLS Policies for threads
CREATE POLICY "Users can view own threads" 
  ON public.threads FOR SELECT 
  USING (auth.uid() = creator_user_id OR auth.uid() = client_user_id);

CREATE POLICY "Users can insert threads" 
  ON public.threads FOR INSERT 
  WITH CHECK (auth.uid() = creator_user_id OR auth.uid() = client_user_id);

CREATE POLICY "Users can update own threads" 
  ON public.threads FOR UPDATE 
  USING (auth.uid() = creator_user_id OR auth.uid() = client_user_id);

-- Update messages RLS to support thread_id
DROP POLICY IF EXISTS "Users can view messages in own matches" ON public.messages;
CREATE POLICY "Users can view messages in own threads" 
  ON public.messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.threads 
      WHERE threads.id = messages.thread_id 
      AND (threads.creator_user_id = auth.uid() OR threads.client_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in own matches" ON public.messages;
CREATE POLICY "Users can insert messages in own threads" 
  ON public.messages FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_user_id 
    AND EXISTS (
      SELECT 1 FROM public.threads 
      WHERE threads.id = messages.thread_id 
      AND (threads.creator_user_id = auth.uid() OR threads.client_user_id = auth.uid())
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_creator ON public.projects(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_project_media_project ON public.project_media(project_id);
CREATE INDEX IF NOT EXISTS idx_threads_users ON public.threads(creator_user_id, client_user_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_message ON public.threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(thread_id) WHERE read_at IS NULL;

-- Trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update thread last_message_at
CREATE OR REPLACE FUNCTION public.update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.threads 
  SET last_message_at = NEW.created_at 
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_thread_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_thread_last_message();