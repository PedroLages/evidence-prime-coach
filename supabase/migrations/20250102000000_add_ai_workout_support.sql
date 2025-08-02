-- Add support for AI-generated workouts
-- Add columns to existing workout_templates table to support AI metadata

ALTER TABLE public.workout_templates 
ADD COLUMN source_type TEXT DEFAULT 'user' CHECK (source_type IN ('user', 'ai_generated', 'system')),
ADD COLUMN ai_metadata JSONB,
ADD COLUMN generation_params JSONB;

-- Update existing records to have source_type 'user'
UPDATE public.workout_templates SET source_type = 'user' WHERE source_type IS NULL;

-- Add comment to explain the new fields
COMMENT ON COLUMN public.workout_templates.source_type IS 'Type of workout: user (manually created), ai_generated (AI created), system (pre-built)';
COMMENT ON COLUMN public.workout_templates.ai_metadata IS 'Metadata for AI-generated workouts including confidence, reasoning, etc.';
COMMENT ON COLUMN public.workout_templates.generation_params IS 'Parameters used to generate the AI workout (workout type, preferences, etc.)';

-- Add index on source_type for efficient filtering
CREATE INDEX idx_workout_templates_source_type ON public.workout_templates(source_type);
CREATE INDEX idx_workout_templates_user_source ON public.workout_templates(user_id, source_type);