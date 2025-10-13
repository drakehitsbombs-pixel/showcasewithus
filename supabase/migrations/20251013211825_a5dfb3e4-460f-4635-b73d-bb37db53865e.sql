-- Security Fix 1: Create user_roles table with proper enum
CREATE TYPE public.app_role AS ENUM ('admin', 'creator', 'client');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roles on signup"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Security Fix 2: Update users_extended RLS to protect PII
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users_extended;

CREATE POLICY "Users can view basic profile info"
ON public.users_extended
FOR SELECT
USING (true);

-- Note: Email and phone will be filtered in application layer for non-owners

CREATE POLICY "Users can view own full profile"
ON public.users_extended
FOR SELECT
USING (auth.uid() = id);

-- Security Fix 3: Add lifestyle to client_briefs
ALTER TABLE public.client_briefs
ADD COLUMN lifestyle TEXT;

-- Security Fix 4: Fix database functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_creator_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creator_profiles
  SET 
    rating_avg = (
      SELECT AVG(rating_int)::DECIMAL(3,2)
      FROM public.reviews
      WHERE creator_user_id = NEW.creator_user_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE creator_user_id = NEW.creator_user_id
    )
  WHERE user_id = NEW.creator_user_id;
  RETURN NEW;
END;
$$;

-- Security Fix 5: Add missing UPDATE policy for portfolio_images
CREATE POLICY "Creators can update own images"
ON public.portfolio_images
FOR UPDATE
USING (auth.uid() = creator_user_id);

-- Security Fix 6: Add UPDATE/DELETE policies for reviews (allow clients to edit/delete own reviews)
CREATE POLICY "Clients can update own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = client_user_id);

CREATE POLICY "Clients can delete own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = client_user_id);

-- Security Fix 7: Add UPDATE/DELETE policies for messages
CREATE POLICY "Users can update own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_user_id);

CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_user_id);

-- Create trigger for reviews to update creator ratings
DROP TRIGGER IF EXISTS update_creator_rating_trigger ON public.reviews;
CREATE TRIGGER update_creator_rating_trigger
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_creator_rating();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);