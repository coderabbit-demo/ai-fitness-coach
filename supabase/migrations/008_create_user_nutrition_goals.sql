-- Create user nutrition goals and preferences table
-- This table stores personalized nutrition targets for each user

CREATE TABLE public.user_nutrition_goals (
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
ALTER TABLE public.user_nutrition_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own nutrition goals"
    ON public.user_nutrition_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition goals"
    ON public.user_nutrition_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition goals"
    ON public.user_nutrition_goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition goals"
    ON public.user_nutrition_goals FOR DELETE
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_user_nutrition_goals_user_id ON public.user_nutrition_goals(user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_nutrition_goals_updated_at
    BEFORE UPDATE ON public.user_nutrition_goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default goals for existing users (optional)
-- This will create default goals for any existing users
INSERT INTO public.user_nutrition_goals (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_nutrition_goals)
ON CONFLICT (user_id) DO NOTHING;