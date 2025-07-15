-- Add processing status and timestamps to nutrition_logs for Phase 2
-- This migration adds fields needed for AI processing workflow

-- Add processing status and timestamps to nutrition_logs
ALTER TABLE public.nutrition_logs 
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add indexes for processing status queries
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_processing_status ON public.nutrition_logs(processing_status);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON public.nutrition_logs(user_id, created_at);

-- Add image_url column if it doesn't exist (for storing meal images)
ALTER TABLE public.nutrition_logs 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update RLS policies to include new fields
-- No additional policies needed as existing policies cover the new fields 