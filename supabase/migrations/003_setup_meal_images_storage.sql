-- Create the meal-images bucket (private for security)
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-images', 'meal-images', false);

-- Create RLS policies for meal-images bucket
CREATE POLICY "Users can upload their own meal images" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'meal-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own meal images" ON storage.objects 
  FOR SELECT USING (
    bucket_id = 'meal-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own meal images" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'meal-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );