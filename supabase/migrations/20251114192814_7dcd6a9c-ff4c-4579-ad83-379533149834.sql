-- Add slug column to creator_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'creator_profiles' 
                 AND column_name = 'slug') THEN
    ALTER TABLE public.creator_profiles ADD COLUMN slug text;
  END IF;
END $$;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_profiles_slug_unique ON public.creator_profiles(slug);

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_creator_slug(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name text;
  v_email text;
  v_base_slug text;
  v_final_slug text;
  v_counter integer := 0;
BEGIN
  -- Get display name and email
  SELECT display_name INTO v_display_name
  FROM creator_profiles
  WHERE user_id = p_user_id;
  
  -- If no display name, get from users_extended
  IF v_display_name IS NULL OR trim(v_display_name) = '' THEN
    SELECT name, email INTO v_display_name, v_email
    FROM users_extended
    WHERE id = p_user_id;
    
    -- Use email local part if name is empty
    IF v_display_name IS NULL OR trim(v_display_name) = '' THEN
      IF v_email IS NOT NULL THEN
        v_display_name := split_part(v_email, '@', 1);
      ELSE
        v_display_name := 'photographer';
      END IF;
    END IF;
  END IF;
  
  -- Create base slug: lowercase, replace spaces and special chars with hyphens
  v_base_slug := lower(v_display_name);
  v_base_slug := regexp_replace(v_base_slug, '[^a-z0-9]+', '-', 'g');
  v_base_slug := regexp_replace(v_base_slug, '^-+|-+$', '', 'g');
  v_base_slug := left(v_base_slug, 50);
  
  -- Add random suffix to ensure uniqueness
  v_final_slug := v_base_slug || '-' || substr(md5(random()::text), 1, 6);
  
  -- Ensure uniqueness with counter if needed
  WHILE EXISTS (SELECT 1 FROM creator_profiles WHERE slug = v_final_slug) LOOP
    v_counter := v_counter + 1;
    v_final_slug := v_base_slug || '-' || substr(md5(random()::text || v_counter::text), 1, 6);
  END LOOP;
  
  RETURN v_final_slug;
END;
$$;

-- Trigger to auto-generate slug if missing
CREATE OR REPLACE FUNCTION public.ensure_creator_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
    NEW.slug := generate_creator_slug(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_ensure_creator_slug ON public.creator_profiles;
CREATE TRIGGER trigger_ensure_creator_slug
BEFORE INSERT OR UPDATE ON public.creator_profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_creator_slug();

-- Backfill slugs for existing profiles
UPDATE public.creator_profiles
SET slug = generate_creator_slug(user_id)
WHERE slug IS NULL OR trim(slug) = '';
