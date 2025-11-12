-- Add min_project_budget_usd column to creator_profiles
ALTER TABLE creator_profiles 
ADD COLUMN min_project_budget_usd NUMERIC;

-- Migrate existing data: use COALESCE to pick first non-null value
UPDATE creator_profiles
SET min_project_budget_usd = COALESCE(
  LEAST(price_band_low, price_band_high),  -- Use the lower of the two if both exist
  price_band_low,                           -- Otherwise use price_band_low
  price_band_high,                          -- Otherwise use price_band_high
  0                                         -- Default to 0 if all are null
);

-- Make the column NOT NULL with default 0
ALTER TABLE creator_profiles 
ALTER COLUMN min_project_budget_usd SET NOT NULL,
ALTER COLUMN min_project_budget_usd SET DEFAULT 0;

-- Drop the old columns
ALTER TABLE creator_profiles 
DROP COLUMN IF EXISTS price_band_low,
DROP COLUMN IF EXISTS price_band_high;

-- Add estimated_budget_usd to bookings if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'estimated_budget_usd'
  ) THEN
    ALTER TABLE bookings ADD COLUMN estimated_budget_usd NUMERIC;
  END IF;
END $$;