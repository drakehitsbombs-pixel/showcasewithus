-- Add denormalized user fields to threads for fast identity resolution
ALTER TABLE threads 
  ADD COLUMN creator_name TEXT,
  ADD COLUMN creator_avatar_url TEXT,
  ADD COLUMN client_name TEXT,
  ADD COLUMN client_avatar_url TEXT;

-- Function to update thread with user info
CREATE OR REPLACE FUNCTION update_thread_user_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Update creator info
  UPDATE threads t
  SET 
    creator_name = u.name,
    creator_avatar_url = cp.avatar_url
  FROM users_extended u
  LEFT JOIN creator_profiles cp ON cp.user_id = u.id
  WHERE t.creator_user_id = u.id
    AND t.id = NEW.id;
  
  -- Update client info
  UPDATE threads t
  SET 
    client_name = u.name,
    client_avatar_url = COALESCE(cp.avatar_url, u.avatar_url)
  FROM users_extended u
  LEFT JOIN creator_profiles cp ON cp.user_id = u.id
  WHERE t.client_user_id = u.id
    AND t.id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to populate user info on thread creation
CREATE TRIGGER populate_thread_user_info
  AFTER INSERT ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_user_info();

-- Backfill existing threads with user info
UPDATE threads t
SET 
  creator_name = u.name,
  creator_avatar_url = cp.avatar_url
FROM users_extended u
LEFT JOIN creator_profiles cp ON cp.user_id = u.id
WHERE t.creator_user_id = u.id;

UPDATE threads t
SET 
  client_name = u.name,
  client_avatar_url = COALESCE(cp.avatar_url, u.avatar_url)
FROM users_extended u
LEFT JOIN creator_profiles cp ON cp.user_id = u.id
WHERE t.client_user_id = u.id;