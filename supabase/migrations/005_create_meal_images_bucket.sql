-- Create storage bucket for meal images
-- This migration sets up the storage infrastructure for Phase 2

-- Create storage bucket for meal images
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-images', 'meal-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for meal images
CREATE POLICY IF NOT EXISTS "Users can upload their own meal images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'meal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can view their own meal images" ON storage.objects
FOR SELECT USING (bucket_id = 'meal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can update their own meal images" ON storage.objects
FOR UPDATE USING (bucket_id = 'meal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can delete their own meal images" ON storage.objects
FOR DELETE USING (bucket_id = 'meal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 