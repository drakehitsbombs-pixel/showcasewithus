-- Add denormalized identity fields to bookings table for better performance
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS location_text TEXT,
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS client_city TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS creator_name TEXT,
ADD COLUMN IF NOT EXISTS creator_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS creator_email TEXT;