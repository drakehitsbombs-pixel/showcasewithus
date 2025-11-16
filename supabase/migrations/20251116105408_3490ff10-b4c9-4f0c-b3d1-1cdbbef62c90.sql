-- Remove the role column from users_extended table to eliminate dual role storage
-- This prevents privilege escalation attacks where users could manipulate their role
-- Roles are now ONLY stored in the user_roles table with proper security

ALTER TABLE public.users_extended DROP COLUMN IF EXISTS role;