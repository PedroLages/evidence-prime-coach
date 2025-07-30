-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  primary_goals TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  muscle_groups TEXT[] NOT NULL,
  equipment TEXT[],
  instructions TEXT,
  video_url TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout templates table
CREATE TABLE public.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  estimated_duration INTEGER, -- in minutes
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout template exercises junction table
CREATE TABLE public.workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight DECIMAL,
  rest_seconds INTEGER,
  notes TEXT,
  UNIQUE(template_id, order_index)
);

-- Create workout sessions table
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  total_volume DECIMAL,
  average_rpe DECIMAL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout session exercises table
CREATE TABLE public.workout_session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  sets_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sets table for tracking individual sets
CREATE TABLE public.sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id UUID REFERENCES public.workout_session_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight DECIMAL,
  reps INTEGER,
  rpe DECIMAL CHECK (rpe >= 1 AND rpe <= 10),
  rest_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Create readiness metrics table
CREATE TABLE public.readiness_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  muscle_soreness INTEGER CHECK (muscle_soreness >= 1 AND muscle_soreness <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  motivation INTEGER CHECK (motivation >= 1 AND motivation <= 10),
  hrv_score DECIMAL,
  overall_readiness DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create ai_insights table
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB,
  confidence_score DECIMAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create progression_data table
CREATE TABLE public.progression_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  estimated_1rm DECIMAL,
  confidence_score DECIMAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  calculation_method TEXT,
  data_points JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progression_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for workout templates
CREATE POLICY "Users can view their own templates and public templates" ON public.workout_templates
  FOR SELECT USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can manage their own templates" ON public.workout_templates
  FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for workout template exercises
CREATE POLICY "Users can manage template exercises for their templates" ON public.workout_template_exercises
  FOR ALL USING (
    template_id IN (
      SELECT id FROM public.workout_templates WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for workout sessions
CREATE POLICY "Users can manage their own workout sessions" ON public.workout_sessions
  FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for workout session exercises
CREATE POLICY "Users can manage their session exercises" ON public.workout_session_exercises
  FOR ALL USING (
    session_id IN (
      SELECT id FROM public.workout_sessions WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for sets
CREATE POLICY "Users can manage their sets" ON public.sets
  FOR ALL USING (
    session_exercise_id IN (
      SELECT wse.id FROM public.workout_session_exercises wse
      JOIN public.workout_sessions ws ON wse.session_id = ws.id
      WHERE ws.user_id = auth.uid()
    )
  );

-- Create RLS policies for readiness metrics
CREATE POLICY "Users can manage their own readiness metrics" ON public.readiness_metrics
  FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for AI insights
CREATE POLICY "Users can manage their own AI insights" ON public.ai_insights
  FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for progression data
CREATE POLICY "Users can manage their own progression data" ON public.progression_data
  FOR ALL USING (user_id = auth.uid());

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_templates_updated_at
  BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some basic exercises
INSERT INTO public.exercises (name, category, muscle_groups, equipment, instructions, difficulty_level) VALUES
('Push-ups', 'Strength', ARRAY['chest', 'shoulders', 'triceps'], ARRAY['bodyweight'], 'Start in a plank position with hands slightly wider than shoulders. Lower your body until chest nearly touches the floor, then push back up.', 'beginner'),
('Squats', 'Strength', ARRAY['quadriceps', 'glutes', 'hamstrings'], ARRAY['bodyweight'], 'Stand with feet shoulder-width apart. Lower your body as if sitting back into a chair, keeping knees behind toes. Return to standing.', 'beginner'),
('Deadlifts', 'Strength', ARRAY['hamstrings', 'glutes', 'back'], ARRAY['barbell'], 'Stand with feet hip-width apart, barbell over mid-foot. Hinge at hips, grab bar, and lift by driving through heels and extending hips.', 'intermediate'),
('Pull-ups', 'Strength', ARRAY['back', 'biceps'], ARRAY['pull-up bar'], 'Hang from bar with arms fully extended. Pull your body up until chin clears the bar, then lower with control.', 'intermediate'),
('Bench Press', 'Strength', ARRAY['chest', 'shoulders', 'triceps'], ARRAY['barbell', 'bench'], 'Lie on bench with feet on floor. Lower barbell to chest with control, then press back up to full arm extension.', 'intermediate'),
('Plank', 'Core', ARRAY['core', 'shoulders'], ARRAY['bodyweight'], 'Hold a straight line from head to heels in push-up position, supporting weight on forearms and toes.', 'beginner'),
('Lunges', 'Strength', ARRAY['quadriceps', 'glutes', 'hamstrings'], ARRAY['bodyweight'], 'Step forward into a lunge position, lowering back knee toward ground. Push through front heel to return to standing.', 'beginner'),
('Overhead Press', 'Strength', ARRAY['shoulders', 'triceps'], ARRAY['barbell'], 'Stand with feet shoulder-width apart. Press barbell from shoulder level to overhead, keeping core tight.', 'intermediate');