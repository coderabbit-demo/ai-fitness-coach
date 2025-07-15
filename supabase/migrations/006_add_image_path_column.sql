-- Add image_path column to nutrition_logs for efficient path-based lookups
-- This migration adds a dedicated column for storing file paths without signed URLs

-- Add image_path column to store the actual file path (without signed URL)
ALTER TABLE public.nutrition_logs 
ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Create index on image_path for efficient exact match queries
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_image_path ON public.nutrition_logs(image_path);

-- Create composite index for user_id and image_path lookups
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_image_path ON public.nutrition_logs(user_id, image_path);

-- Update existing records to extract path from image_url (if any exist)
-- This handles the migration of existing data
UPDATE public.nutrition_logs 
SET image_path = REGEXP_REPLACE(image_url, '^.*/meal-images/', '')
WHERE image_url IS NOT NULL 
  AND image_url LIKE '%/meal-images/%'
  AND image_path IS NULL; 