-- Create daily nutrition summaries table for faster dashboard queries
-- This table aggregates daily nutrition data for better performance

-- First, ensure we have the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create daily nutrition summaries table
CREATE TABLE public.daily_nutrition_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calories DECIMAL(8,2) DEFAULT 0,
    total_protein_g DECIMAL(6,2) DEFAULT 0,
    total_carbs_g DECIMAL(6,2) DEFAULT 0,
    total_fat_g DECIMAL(6,2) DEFAULT 0,
    total_fiber_g DECIMAL(6,2) DEFAULT 0,
    meal_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_nutrition_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own daily summaries"
    ON public.daily_nutrition_summaries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily summaries"
    ON public.daily_nutrition_summaries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily summaries"
    ON public.daily_nutrition_summaries FOR UPDATE
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_daily_summaries_user_date ON public.daily_nutrition_summaries(user_id, date);
CREATE INDEX idx_daily_summaries_date ON public.daily_nutrition_summaries(date);

-- Function to update daily summaries
CREATE OR REPLACE FUNCTION public.update_daily_nutrition_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert daily summary
    INSERT INTO public.daily_nutrition_summaries (
        user_id, 
        date, 
        total_calories, 
        total_protein_g, 
        total_carbs_g, 
        total_fat_g, 
        total_fiber_g, 
        meal_count
    )
    SELECT 
        user_id,
        DATE(created_at) as date,
        COALESCE(SUM(total_calories), 0) as total_calories,
        COALESCE(SUM(total_protein_g), 0) as total_protein_g,
        COALESCE(SUM(total_carbs_g), 0) as total_carbs_g,
        COALESCE(SUM(total_fat_g), 0) as total_fat_g,
        COALESCE(SUM(total_fiber_g), 0) as total_fiber_g,
        COUNT(*) as meal_count
    FROM public.nutrition_logs 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND DATE(created_at) = DATE(COALESCE(NEW.created_at, OLD.created_at))
      AND processing_status = 'completed'
    GROUP BY user_id, DATE(created_at)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        total_calories = EXCLUDED.total_calories,
        total_protein_g = EXCLUDED.total_protein_g,
        total_carbs_g = EXCLUDED.total_carbs_g,
        total_fat_g = EXCLUDED.total_fat_g,
        total_fiber_g = EXCLUDED.total_fiber_g,
        meal_count = EXCLUDED.meal_count,
        updated_at = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update daily summaries when nutrition logs change
CREATE TRIGGER trigger_update_daily_nutrition_summary
    AFTER INSERT OR UPDATE OR DELETE ON public.nutrition_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_daily_nutrition_summary();

-- Add updated_at trigger
CREATE TRIGGER update_daily_nutrition_summaries_updated_at
    BEFORE UPDATE ON public.daily_nutrition_summaries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();