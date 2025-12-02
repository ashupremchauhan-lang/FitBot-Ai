-- Create storage bucket for medical records
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-records', 'medical-records', false);

-- Create RLS policies for medical records bucket
CREATE POLICY "Users can view own medical records"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'medical-records' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own medical records"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'medical-records' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own medical records"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'medical-records' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own medical records"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'medical-records' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add medical_records column to fitness_plans table
ALTER TABLE fitness_plans
ADD COLUMN medical_records TEXT[];