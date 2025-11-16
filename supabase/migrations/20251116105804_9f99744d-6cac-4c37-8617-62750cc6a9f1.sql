-- Fix mutable search_path security issue in database functions
-- This prevents schema-based attacks by fixing the search path

-- Fix generate_slug function
CREATE OR REPLACE FUNCTION public.generate_slug(display_name text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(display_name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Add random suffix
  final_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM users_extended WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || substr(md5(random()::text || counter::text), 1, 6);
  END LOOP;
  
  RETURN final_slug;
END;
$function$;

-- Fix auto_generate_slug trigger function
CREATE OR REPLACE FUNCTION public.auto_generate_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$function$;