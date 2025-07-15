-- Phase 3: Core Calorie Tracking Dashboard - Database Schema

-- Create daily nutrition summaries for faster dashboard queries
CREATE TABLE IF NOT EXISTS daily_nutrition_summaries (
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
ALTER TABLE daily_nutrition_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own daily summaries"
    ON daily_nutrition_summaries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily summaries"
    ON daily_nutrition_summaries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily summaries"
    ON daily_nutrition_summaries FOR UPDATE
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_daily_summaries_user_date ON daily_nutrition_summaries(user_id, date);
CREATE INDEX idx_daily_summaries_date ON daily_nutrition_summaries(date);

-- Create user nutrition goals and preferences
CREATE TABLE IF NOT EXISTS user_nutrition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_calorie_goal INTEGER DEFAULT 2000,
    daily_protein_goal_g DECIMAL(6,2) DEFAULT 150,
    daily_carbs_goal_g DECIMAL(6,2) DEFAULT 200,
    daily_fat_goal_g DECIMAL(6,2) DEFAULT 70,
    daily_fiber_goal_g DECIMAL(6,2) DEFAULT 25,
    activity_level TEXT DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    weight_goal TEXT DEFAULT 'maintain' CHECK (weight_goal IN ('lose', 'maintain', 'gain')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_nutrition_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own nutrition goals"
    ON user_nutrition_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition goals"
    ON user_nutrition_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition goals"
    ON user_nutrition_goals FOR UPDATE
    USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_user_nutrition_goals_user_id ON user_nutrition_goals(user_id);

-- Function to update daily summaries
CREATE OR REPLACE FUNCTION update_daily_nutrition_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert daily summary
    INSERT INTO daily_nutrition_summaries (
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
        SUM(total_calories) as total_calories,
        SUM(total_protein_g) as total_protein_g,
        SUM(total_carbs_g) as total_carbs_g,
        SUM(total_fat_g) as total_fat_g,
        SUM(total_fiber_g) as total_fiber_g,
        COUNT(*) as meal_count
    FROM nutrition_logs 
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

-- Trigger to update daily summaries
CREATE TRIGGER trigger_update_daily_nutrition_summary
    AFTER INSERT OR UPDATE OR DELETE ON nutrition_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_nutrition_summary();

-- Create triggers to update updated_at columns
CREATE OR REPLACE TRIGGER update_daily_nutrition_summaries_updated_at
    BEFORE UPDATE ON daily_nutrition_summaries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_nutrition_goals_updated_at
    BEFORE UPDATE ON user_nutrition_goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
