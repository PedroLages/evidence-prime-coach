-- Create comprehensive goals tracking system
CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('strength', 'muscle_gain', 'weight_loss', 'endurance', 'health', 'skill')),
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    unit TEXT NOT NULL,
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'overdue')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create goal progress tracking table
CREATE TABLE IF NOT EXISTS goal_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    value DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    measurement_source TEXT, -- 'manual', 'body_measurement', 'workout_session'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure one progress entry per goal per date
    UNIQUE(goal_id, date)
);

-- Create goal milestones table for intermediate targets
CREATE TABLE IF NOT EXISTS goal_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    target_date DATE,
    achieved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_date ON goal_progress(goal_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal ON goal_milestones(goal_id);

-- Enable RLS (Row Level Security)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goals
CREATE POLICY "Users can view their own goals" ON goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON goals
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for goal progress
CREATE POLICY "Users can view their goal progress" ON goal_progress
    FOR SELECT USING (
        goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert their goal progress" ON goal_progress
    FOR INSERT WITH CHECK (
        goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their goal progress" ON goal_progress
    FOR UPDATE USING (
        goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete their goal progress" ON goal_progress
    FOR DELETE USING (
        goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
    );

-- Create RLS policies for goal milestones
CREATE POLICY "Users can view their goal milestones" ON goal_milestones
    FOR SELECT USING (
        goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert their goal milestones" ON goal_milestones
    FOR INSERT WITH CHECK (
        goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their goal milestones" ON goal_milestones
    FOR UPDATE USING (
        goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete their goal milestones" ON goal_milestones
    FOR DELETE USING (
        goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
    );

-- Add updated_at trigger for goals
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update goal status based on progress
CREATE OR REPLACE FUNCTION update_goal_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current_value and check completion
    UPDATE goals 
    SET 
        current_value = NEW.value,
        status = CASE 
            WHEN NEW.value >= target_value THEN 'completed'
            WHEN target_date < CURRENT_DATE AND NEW.value < target_value THEN 'overdue'
            ELSE 'active'
        END,
        updated_at = NOW()
    WHERE id = NEW.goal_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update goal status when progress is added
CREATE TRIGGER auto_update_goal_status
    AFTER INSERT OR UPDATE ON goal_progress
    FOR EACH ROW EXECUTE FUNCTION update_goal_status();

-- Create function to get goal completion percentage
CREATE OR REPLACE FUNCTION get_goal_completion_percentage(goal_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
    goal_record RECORD;
    completion_percentage DECIMAL;
BEGIN
    SELECT target_value, current_value INTO goal_record
    FROM goals WHERE id = goal_id_param;
    
    IF goal_record.target_value > 0 THEN
        completion_percentage := (goal_record.current_value / goal_record.target_value) * 100;
        -- Cap at 100%
        IF completion_percentage > 100 THEN
            completion_percentage := 100;
        END IF;
    ELSE
        completion_percentage := 0;
    END IF;
    
    RETURN completion_percentage;
END;
$$ LANGUAGE plpgsql;