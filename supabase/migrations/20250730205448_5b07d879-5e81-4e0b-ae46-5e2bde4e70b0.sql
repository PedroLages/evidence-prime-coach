-- Create storage bucket for exercise images
INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-images', 'exercise-images', true);

-- Create policies for exercise images
CREATE POLICY "Anyone can view exercise images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'exercise-images');

CREATE POLICY "Authenticated users can upload exercise images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'exercise-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update exercise images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'exercise-images' AND auth.role() = 'authenticated');

-- Add image_url column to exercises table
ALTER TABLE public.exercises ADD COLUMN image_url TEXT;

-- Add function to create custom exercises
CREATE OR REPLACE FUNCTION public.create_custom_exercise(
  exercise_name TEXT,
  exercise_category TEXT,
  exercise_muscle_groups TEXT[],
  exercise_equipment TEXT[],
  exercise_instructions TEXT,
  exercise_video_url TEXT,
  exercise_image_url TEXT,
  exercise_difficulty_level TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_exercise_id UUID;
BEGIN
  INSERT INTO public.exercises (
    name, 
    category, 
    muscle_groups, 
    equipment, 
    instructions, 
    video_url, 
    image_url, 
    difficulty_level
  ) VALUES (
    exercise_name,
    exercise_category,
    exercise_muscle_groups,
    exercise_equipment,
    exercise_instructions,
    exercise_video_url,
    exercise_image_url,
    exercise_difficulty_level
  )
  RETURNING id INTO new_exercise_id;
  
  RETURN new_exercise_id;
END;
$$;