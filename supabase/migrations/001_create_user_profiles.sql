-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    height_cm INTEGER,
    weight_kg DECIMAL(5,2),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
    fitness_goals TEXT[],
    medical_conditions TEXT[],
    dietary_restrictions TEXT[],
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weight_logs table for tracking weight over time
CREATE TABLE IF NOT EXISTS public.weight_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    weight_kg DECIMAL(5,2) NOT NULL,
    body_fat_percentage DECIMAL(4,2),
    muscle_mass_kg DECIMAL(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'smart_scale', 'healthkit')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nutrition_logs table for food tracking
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    food_items JSONB NOT NULL,
    total_calories INTEGER,
    total_protein_g DECIMAL(6,2),
    total_carbs_g DECIMAL(6,2),
    total_fat_g DECIMAL(6,2),
    total_fiber_g DECIMAL(6,2),
    image_url TEXT,
    confidence_score DECIMAL(3,2),
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mood_logs table for tracking mental health
CREATE TABLE IF NOT EXISTS public.mood_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_recommendations table for storing AI-generated recommendations
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('workout', 'nutrition', 'wellness', 'goal_adjustment')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed')),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for weight_logs
CREATE POLICY "Users can view their own weight logs" ON public.weight_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight logs" ON public.weight_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight logs" ON public.weight_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight logs" ON public.weight_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for nutrition_logs
CREATE POLICY "Users can view their own nutrition logs" ON public.nutrition_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition logs" ON public.nutrition_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition logs" ON public.nutrition_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition logs" ON public.nutrition_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for mood_logs
CREATE POLICY "Users can view their own mood logs" ON public.mood_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood logs" ON public.mood_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood logs" ON public.mood_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood logs" ON public.mood_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for ai_recommendations
CREATE POLICY "Users can view their own AI recommendations" ON public.ai_recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI recommendations" ON public.ai_recommendations
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id_recorded_at ON public.weight_logs(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_id_recorded_at ON public.nutrition_logs(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_id_recorded_at ON public.mood_logs(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id_status ON public.ai_recommendations(user_id, status);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE OR REPLACE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_ai_recommendations_updated_at
    BEFORE UPDATE ON public.ai_recommendations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
