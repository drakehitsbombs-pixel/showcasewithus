-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('creator', 'client', 'admin');

-- Create enum for project types
CREATE TYPE project_type AS ENUM ('wedding', 'portrait', 'product', 'event', 'commercial', 'real_estate', 'other');

-- Create enum for subscription plans
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'pro_plus');

-- Create users_extended table (profiles)
CREATE TABLE public.users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  bio TEXT,
  city TEXT,
  geo_lat DECIMAL(10, 8),
  geo_lng DECIMAL(11, 8),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create creator_profiles table
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users_extended(id) ON DELETE CASCADE UNIQUE,
  price_band_low DECIMAL(10, 2),
  price_band_high DECIMAL(10, 2),
  travel_radius_km INT DEFAULT 50,
  styles TEXT[] DEFAULT '{}',
  availability_blocks JSONB DEFAULT '[]',
  verification_status TEXT DEFAULT 'unverified',
  rating_avg DECIMAL(3, 2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create portfolio_images table
CREATE TABLE public.portfolio_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID NOT NULL REFERENCES public.users_extended(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create client_briefs table
CREATE TABLE public.client_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES public.users_extended(id) ON DELETE CASCADE,
  project_type project_type NOT NULL,
  date_window_start DATE,
  date_window_end DATE,
  city TEXT,
  geo_lat DECIMAL(10, 8),
  geo_lng DECIMAL(11, 8),
  budget_low DECIMAL(10, 2),
  budget_high DECIMAL(10, 2),
  mood_tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID NOT NULL REFERENCES public.users_extended(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES public.users_extended(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES public.client_briefs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'liked',
  match_score INT DEFAULT 0,
  creator_liked BOOLEAN DEFAULT FALSE,
  client_liked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(creator_user_id, client_user_id, brief_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES public.users_extended(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  proposed_price DECIMAL(10, 2) NOT NULL,
  proposed_slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
  proposed_slot_end TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
  slot_end TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'soft_confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
  creator_user_id UUID NOT NULL REFERENCES public.users_extended(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES public.users_extended(id) ON DELETE CASCADE,
  rating_int INT NOT NULL CHECK (rating_int >= 1 AND rating_int <= 5),
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID NOT NULL REFERENCES public.users_extended(id) ON DELETE CASCADE UNIQUE,
  plan subscription_plan DEFAULT 'free',
  status TEXT DEFAULT 'active',
  renews_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users_extended
CREATE POLICY "Users can view all profiles" ON public.users_extended FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users_extended FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users_extended FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for creator_profiles
CREATE POLICY "Anyone can view creator profiles" ON public.creator_profiles FOR SELECT USING (true);
CREATE POLICY "Creators can update own profile" ON public.creator_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Creators can insert own profile" ON public.creator_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for portfolio_images
CREATE POLICY "Anyone can view portfolio images" ON public.portfolio_images FOR SELECT USING (true);
CREATE POLICY "Creators can insert own images" ON public.portfolio_images FOR INSERT WITH CHECK (auth.uid() = creator_user_id);
CREATE POLICY "Creators can delete own images" ON public.portfolio_images FOR DELETE USING (auth.uid() = creator_user_id);

-- RLS Policies for client_briefs
CREATE POLICY "Clients can view own briefs" ON public.client_briefs FOR SELECT USING (auth.uid() = client_user_id);
CREATE POLICY "Clients can insert own briefs" ON public.client_briefs FOR INSERT WITH CHECK (auth.uid() = client_user_id);
CREATE POLICY "Clients can update own briefs" ON public.client_briefs FOR UPDATE USING (auth.uid() = client_user_id);

-- RLS Policies for matches
CREATE POLICY "Users can view own matches" ON public.matches FOR SELECT USING (
  auth.uid() = creator_user_id OR auth.uid() = client_user_id
);
CREATE POLICY "Users can insert matches" ON public.matches FOR INSERT WITH CHECK (
  auth.uid() = creator_user_id OR auth.uid() = client_user_id
);
CREATE POLICY "Users can update own matches" ON public.matches FOR UPDATE USING (
  auth.uid() = creator_user_id OR auth.uid() = client_user_id
);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in own matches" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = messages.match_id 
    AND (matches.creator_user_id = auth.uid() OR matches.client_user_id = auth.uid())
  )
);
CREATE POLICY "Users can insert messages in own matches" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_user_id AND
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = match_id 
    AND (matches.creator_user_id = auth.uid() OR matches.client_user_id = auth.uid())
  )
);

-- RLS Policies for quotes
CREATE POLICY "Users can view quotes in own matches" ON public.quotes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = quotes.match_id 
    AND (matches.creator_user_id = auth.uid() OR matches.client_user_id = auth.uid())
  )
);
CREATE POLICY "Creators can insert quotes" ON public.quotes FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = match_id AND matches.creator_user_id = auth.uid()
  )
);
CREATE POLICY "Users can update quotes in own matches" ON public.quotes FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = quotes.match_id 
    AND (matches.creator_user_id = auth.uid() OR matches.client_user_id = auth.uid())
  )
);

-- RLS Policies for bookings
CREATE POLICY "Users can view bookings in own matches" ON public.bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = bookings.match_id 
    AND (matches.creator_user_id = auth.uid() OR matches.client_user_id = auth.uid())
  )
);
CREATE POLICY "Users can insert bookings" ON public.bookings FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = match_id 
    AND (matches.creator_user_id = auth.uid() OR matches.client_user_id = auth.uid())
  )
);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = bookings.match_id 
    AND (matches.creator_user_id = auth.uid() OR matches.client_user_id = auth.uid())
  )
);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Clients can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Creators can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = creator_user_id);
CREATE POLICY "Creators can insert own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = creator_user_id);
CREATE POLICY "Creators can update own subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = creator_user_id);

-- Create indexes for better query performance
CREATE INDEX idx_users_extended_role ON public.users_extended(role);
CREATE INDEX idx_creator_profiles_user_id ON public.creator_profiles(user_id);
CREATE INDEX idx_portfolio_images_creator_id ON public.portfolio_images(creator_user_id);
CREATE INDEX idx_client_briefs_client_id ON public.client_briefs(client_user_id);
CREATE INDEX idx_matches_creator_id ON public.matches(creator_user_id);
CREATE INDEX idx_matches_client_id ON public.matches(client_user_id);
CREATE INDEX idx_messages_match_id ON public.messages(match_id);
CREATE INDEX idx_quotes_match_id ON public.quotes(match_id);
CREATE INDEX idx_bookings_match_id ON public.bookings(match_id);
CREATE INDEX idx_reviews_creator_id ON public.reviews(creator_user_id);

-- GIN indexes for array columns
CREATE INDEX idx_creator_styles ON public.creator_profiles USING GIN(styles);
CREATE INDEX idx_portfolio_tags ON public.portfolio_images USING GIN(tags);
CREATE INDEX idx_brief_tags ON public.client_briefs USING GIN(mood_tags);

-- Trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_extended_updated_at BEFORE UPDATE ON public.users_extended FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON public.creator_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_briefs_updated_at BEFORE UPDATE ON public.client_briefs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update creator ratings
CREATE OR REPLACE FUNCTION update_creator_rating()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger for rating updates
CREATE TRIGGER update_rating_on_review AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_creator_rating();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolios', 'portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolios
CREATE POLICY "Anyone can view portfolio files" ON storage.objects FOR SELECT USING (bucket_id = 'portfolios');
CREATE POLICY "Creators can upload portfolios" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Creators can delete own portfolios" ON storage.objects FOR DELETE USING (
  bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatar files" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);