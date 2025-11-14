-- Add display_name column to creator_profiles
ALTER TABLE public.creator_profiles 
ADD COLUMN display_name text;

-- Create index for better query performance
CREATE INDEX idx_creator_profiles_display_name ON public.creator_profiles(display_name);

-- Function to compute display name from user data
CREATE OR REPLACE FUNCTION public.compute_display_name(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_email text;
  v_email_local text;
  v_result text;
BEGIN
  -- Get user data
  SELECT name, email INTO v_name, v_email
  FROM users_extended
  WHERE id = p_user_id;
  
  -- Priority 1: user name
  IF v_name IS NOT NULL AND trim(v_name) != '' THEN
    RETURN trim(v_name);
  END IF;
  
  -- Priority 2: capitalize email local part
  IF v_email IS NOT NULL THEN
    v_email_local := split_part(v_email, '@', 1);
    -- Replace separators with spaces and capitalize each word
    v_email_local := regexp_replace(v_email_local, '[._-]+', ' ', 'g');
    v_result := initcap(v_email_local);
    IF trim(v_result) != '' THEN
      RETURN trim(v_result);
    END IF;
  END IF;
  
  -- Final fallback
  RETURN 'Photographer';
END;
$$;

-- Trigger function to auto-update display_name
CREATE OR REPLACE FUNCTION public.update_creator_display_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only compute if show_name_public is not false
  IF NEW.show_name_public = false THEN
    NEW.display_name := 'Photographer';
  ELSE
    NEW.display_name := compute_display_name(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER trigger_update_creator_display_name
BEFORE INSERT OR UPDATE ON public.creator_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_creator_display_name();

-- Backfill existing profiles
UPDATE public.creator_profiles
SET display_name = CASE 
  WHEN show_name_public = false THEN 'Photographer'
  ELSE compute_display_name(user_id)
END;
