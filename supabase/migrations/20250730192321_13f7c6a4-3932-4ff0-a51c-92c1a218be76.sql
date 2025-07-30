-- Create only the missing tables and update existing ones

-- Check if daily_metrics table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_metrics') THEN
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
        
        ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own daily metrics" ON public.daily_metrics
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can create their own daily metrics" ON public.daily_metrics
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own daily metrics" ON public.daily_metrics
          FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own daily metrics" ON public.daily_metrics
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Check if performance_metrics table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'performance_metrics') THEN
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
        
        ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own performance metrics" ON public.performance_metrics
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can create their own performance metrics" ON public.performance_metrics
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own performance metrics" ON public.performance_metrics
          FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own performance metrics" ON public.performance_metrics
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create indexes for better performance if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_metrics_user_date') THEN
        CREATE INDEX idx_daily_metrics_user_date ON public.daily_metrics(user_id, date);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_performance_metrics_user_exercise') THEN
        CREATE INDEX idx_performance_metrics_user_exercise ON public.performance_metrics(user_id, exercise_id);
    END IF;
END $$;