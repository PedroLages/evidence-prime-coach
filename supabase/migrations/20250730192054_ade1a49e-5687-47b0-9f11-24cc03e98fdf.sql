-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER,
  fitness_goal TEXT CHECK (fitness_goal IN ('strength', 'muscle_gain', 'endurance', 'weight_loss', 'general_fitness')),
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  coaching_style TEXT CHECK (coaching_style IN ('motivational', 'analytical', 'supportive', 'direct')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workouts table
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('strength', 'cardio', 'hiit', 'yoga', 'stretching', 'custom')),
  description TEXT,
  estimated_duration INTEGER, -- in minutes
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full_body')),
  muscle_groups TEXT[] NOT NULL,
  equipment TEXT[],
  instructions TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workout_exercises table (junction table)
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight DECIMAL,
  duration INTEGER, -- in seconds for time-based exercises
  rest_time INTEGER, -- in seconds
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workout_sessions table (actual workout completions)
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER, -- in seconds
  notes TEXT,
  overall_rpe DECIMAL CHECK (overall_rpe >= 1 AND overall_rpe <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create session_exercises table (actual exercise performance)
CREATE TABLE public.session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  workout_exercise_id UUID REFERENCES public.workout_exercises(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL,
  sets_completed INTEGER DEFAULT 0,
  reps_completed INTEGER,
  weight_used DECIMAL,
  duration_completed INTEGER, -- in seconds
  rpe DECIMAL CHECK (rpe >= 1 AND rpe <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create daily_metrics table for readiness tracking
CREATE TABLE public.daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_hours DECIMAL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  soreness_level INTEGER CHECK (soreness_level >= 1 AND soreness_level <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  hrv_score DECIMAL,
  resting_hr INTEGER,
  motivation_level INTEGER CHECK (motivation_level >= 1 AND motivation_level <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create performance_metrics table for analytics
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  metric_type TEXT CHECK (metric_type IN ('volume', 'one_rm', 'rpe', 'duration', 'distance')),
  value DECIMAL NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Workouts policies
CREATE POLICY "Users can view their own workouts" ON public.workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workouts" ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Exercises are public (read-only for all users)
CREATE POLICY "Anyone can view exercises" ON public.exercises
  FOR SELECT USING (true);

-- Workout exercises policies (inherit from workout)
CREATE POLICY "Users can view workout exercises they own" ON public.workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workouts 
      WHERE workouts.id = workout_exercises.workout_id 
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage workout exercises they own" ON public.workout_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workouts 
      WHERE workouts.id = workout_exercises.workout_id 
      AND workouts.user_id = auth.uid()
    )
  );

-- Workout sessions policies
CREATE POLICY "Users can view their own workout sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout sessions" ON public.workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Session exercises policies (inherit from session)
CREATE POLICY "Users can view session exercises they own" ON public.session_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions 
      WHERE workout_sessions.id = session_exercises.session_id 
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage session exercises they own" ON public.session_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions 
      WHERE workout_sessions.id = session_exercises.session_id 
      AND workout_sessions.user_id = auth.uid()
    )
  );

-- Daily metrics policies
CREATE POLICY "Users can view their own daily metrics" ON public.daily_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily metrics" ON public.daily_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily metrics" ON public.daily_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily metrics" ON public.daily_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- Performance metrics policies
CREATE POLICY "Users can view their own performance metrics" ON public.performance_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own performance metrics" ON public.performance_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance metrics" ON public.performance_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance metrics" ON public.performance_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample exercises
INSERT INTO public.exercises (name, category, muscle_groups, equipment, instructions) VALUES
('Push-ups', 'chest', ARRAY['chest', 'shoulders', 'triceps'], ARRAY['bodyweight'], 'Start in a plank position, lower your body until your chest nearly touches the floor, then push back up.'),
('Squats', 'legs', ARRAY['quadriceps', 'glutes', 'hamstrings'], ARRAY['bodyweight'], 'Stand with feet shoulder-width apart, lower your body as if sitting back into a chair, then return to standing.'),
('Pull-ups', 'back', ARRAY['lats', 'biceps', 'rhomboids'], ARRAY['pull-up bar'], 'Hang from a bar with palms facing away, pull your body up until your chin clears the bar.'),
('Deadlifts', 'back', ARRAY['hamstrings', 'glutes', 'lower back'], ARRAY['barbell', 'weights'], 'Stand with feet hip-width apart, bend at hips and knees to lower and grab the bar, then stand up straight.'),
('Bench Press', 'chest', ARRAY['chest', 'shoulders', 'triceps'], ARRAY['barbell', 'bench', 'weights'], 'Lie on bench, lower bar to chest, then press up to arm''s length.'),
('Plank', 'core', ARRAY['abs', 'core'], ARRAY['bodyweight'], 'Hold a push-up position with forearms on the ground, keeping your body in a straight line.');

-- Create indexes for better performance
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX idx_daily_metrics_user_date ON public.daily_metrics(user_id, date);
CREATE INDEX idx_performance_metrics_user_exercise ON public.performance_metrics(user_id, exercise_id);
CREATE INDEX idx_session_exercises_session_id ON public.session_exercises(session_id);