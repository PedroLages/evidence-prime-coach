-- Create storage bucket for progress photos
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', false);

-- Create policies for progress photos (private to user)
CREATE POLICY "Users can view their own progress photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own progress photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own progress photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own progress photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create body measurements table
CREATE TABLE public.body_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL(5,2), -- in kg or lbs
  body_fat_percentage DECIMAL(4,1), -- percentage
  muscle_mass DECIMAL(5,2), -- in kg or lbs
  waist DECIMAL(4,1), -- in cm or inches
  chest DECIMAL(4,1), -- in cm or inches
  arms DECIMAL(4,1), -- in cm or inches
  thighs DECIMAL(4,1), -- in cm or inches
  hips DECIMAL(4,1), -- in cm or inches
  neck DECIMAL(4,1), -- in cm or inches
  height DECIMAL(5,2), -- in cm or inches
  unit_system VARCHAR(10) DEFAULT 'metric', -- 'metric' or 'imperial'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on body measurements
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for body measurements
CREATE POLICY "Users can view their own body measurements" 
ON public.body_measurements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own body measurements" 
ON public.body_measurements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body measurements" 
ON public.body_measurements 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body measurements" 
ON public.body_measurements 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create progress photos table
CREATE TABLE public.progress_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_type VARCHAR(20) NOT NULL, -- 'front', 'side', 'back', 'other'
  image_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on progress photos
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for progress photos
CREATE POLICY "Users can view their own progress photos" 
ON public.progress_photos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress photos" 
ON public.progress_photos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress photos" 
ON public.progress_photos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress photos" 
ON public.progress_photos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_body_measurements_updated_at
  BEFORE UPDATE ON public.body_measurements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_progress_photos_updated_at
  BEFORE UPDATE ON public.progress_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_body_measurements_user_date ON public.body_measurements(user_id, date DESC);
CREATE INDEX idx_progress_photos_user_date ON public.progress_photos(user_id, date DESC);