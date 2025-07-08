-- Add weight unit preferences to user profiles
-- This migration adds support for weight unit preferences (kg vs lb)

-- Update the preferences column to include weight unit preference for all existing users
-- Set default weight unit to 'kg' for existing users who don't have preferences set
UPDATE public.user_profiles 
SET preferences = COALESCE(preferences, '{}'::jsonb) || '{"weightUnit": "kg"}'::jsonb
WHERE preferences IS NULL OR NOT preferences ? 'weightUnit';

-- Add a comment to document the preferences structure
COMMENT ON COLUMN public.user_profiles.preferences IS 'User preferences stored as JSONB. Expected structure: {"weightUnit": "kg"|"lb", "heightUnit": "cm"|"ft", ...}';

-- Create an index on preferences for better query performance
-- Use BTREE index for text values instead of GIN
CREATE INDEX IF NOT EXISTS idx_user_profiles_preferences_weight_unit 
ON public.user_profiles ((preferences->>'weightUnit'));

-- Optional: Add a function to get user's weight unit preference with fallback
CREATE OR REPLACE FUNCTION public.get_user_weight_unit(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT preferences->>'weightUnit' FROM public.user_profiles WHERE id = user_id),
        'kg'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Add a function to update user's weight unit preference
CREATE OR REPLACE FUNCTION public.update_user_weight_unit(user_id UUID, weight_unit TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate the weight unit
    IF weight_unit NOT IN ('kg', 'lb') THEN
        RAISE EXCEPTION 'Invalid weight unit. Must be kg or lb.';
    END IF;
    
    -- Update the preferences
    UPDATE public.user_profiles 
    SET preferences = COALESCE(preferences, '{}'::jsonb) || jsonb_build_object('weightUnit', weight_unit)
    WHERE id = user_id;
    
    -- Check if the update was successful
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for the functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_weight_unit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_weight_unit(UUID, TEXT) TO authenticated; 