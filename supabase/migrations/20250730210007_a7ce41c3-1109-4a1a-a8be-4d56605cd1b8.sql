-- Fix the security warning by updating the function search path
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
SET search_path = public
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