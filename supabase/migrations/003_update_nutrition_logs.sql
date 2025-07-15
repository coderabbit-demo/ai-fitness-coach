-- Update nutrition_logs table to match Phase 1 requirements
-- Add missing fields and update existing ones

-- Add missing columns
ALTER TABLE public.nutrition_logs 
ADD COLUMN IF NOT EXISTS logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update total_calories to allow decimal values
ALTER TABLE public.nutrition_logs 
ALTER COLUMN total_calories TYPE DECIMAL(8,2);

-- Update confidence_score to have default value
ALTER TABLE public.nutrition_logs 
ALTER COLUMN confidence_score SET DEFAULT 0.0;

-- Update food_items to have proper default
ALTER TABLE public.nutrition_logs 
ALTER COLUMN food_items SET DEFAULT '[]';

-- Create trigger to update updated_at column
CREATE OR REPLACE TRIGGER update_nutrition_logs_updated_at
    BEFORE UPDATE ON public.nutrition_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_id_logged_at 
ON public.nutrition_logs(user_id, logged_at DESC);

-- Verify RLS policies exist for nutrition_logs
CREATE POLICY IF NOT EXISTS "Users can view their own nutrition logs" 
ON public.nutrition_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own nutrition logs" 
ON public.nutrition_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own nutrition logs" 
ON public.nutrition_logs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own nutrition logs" 
ON public.nutrition_logs FOR DELETE 
USING (auth.uid() = user_id);