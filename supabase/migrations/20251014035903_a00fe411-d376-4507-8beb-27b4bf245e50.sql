-- Add admin RLS policy to users_extended table
-- This allows admins to view all user data while maintaining user privacy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users_extended' 
    AND policyname = 'Admins can view all user data'
  ) THEN
    CREATE POLICY "Admins can view all user data"
      ON public.users_extended FOR SELECT
      USING (
        auth.uid() = id OR  -- Users can view their own data
        public.has_role(auth.uid(), 'admin')  -- Admins can view all data
      );
  END IF;
END $$;

-- Add Storage RLS policies for avatars bucket
-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies for avatars
  DROP POLICY IF EXISTS "Users can upload to own avatar folder" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
  
  -- Create avatars policies
  CREATE POLICY "Users can upload to own avatar folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Users can update own avatars"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Users can delete own avatars"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
END $$;

-- Add Storage RLS policies for portfolios bucket
DO $$
BEGIN
  -- Drop existing policies for portfolios
  DROP POLICY IF EXISTS "Users can upload to own portfolio folder" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own portfolios" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own portfolios" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view portfolios" ON storage.objects;
  
  -- Create portfolios policies
  CREATE POLICY "Users can upload to own portfolio folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'portfolios' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Users can update own portfolios"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'portfolios' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Users can delete own portfolios"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'portfolios' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Anyone can view portfolios"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'portfolios');
END $$;

-- Add Storage RLS policies for surf-videos bucket
DO $$
BEGIN
  -- Drop existing policies for surf-videos
  DROP POLICY IF EXISTS "Users can upload to own surf-videos folder" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own surf-videos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own surf-videos" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view surf-videos" ON storage.objects;
  
  -- Create surf-videos policies
  CREATE POLICY "Users can upload to own surf-videos folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'surf-videos' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Users can update own surf-videos"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'surf-videos' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Users can delete own surf-videos"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'surf-videos' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Anyone can view surf-videos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'surf-videos');
END $$;