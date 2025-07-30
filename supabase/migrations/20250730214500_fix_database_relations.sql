-- Fix database relations and consistency issues
-- This migration adds missing foreign key constraints, indexes, and data integrity checks

-- Add missing foreign key constraints for referential integrity

-- Body measurements
ALTER TABLE public.body_measurements 
ADD CONSTRAINT fk_body_measurements_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Progress photos
ALTER TABLE public.progress_photos 
ADD CONSTRAINT fk_progress_photos_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Workout templates
ALTER TABLE public.workout_templates 
ADD CONSTRAINT fk_workout_templates_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Workout template exercises
ALTER TABLE public.workout_template_exercises 
ADD CONSTRAINT fk_workout_template_exercises_template_id 
FOREIGN KEY (template_id) REFERENCES public.workout_templates(id) ON DELETE CASCADE;

ALTER TABLE public.workout_template_exercises 
ADD CONSTRAINT fk_workout_template_exercises_exercise_id 
FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

-- Workout sessions
ALTER TABLE public.workout_sessions 
ADD CONSTRAINT fk_workout_sessions_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.workout_sessions 
ADD CONSTRAINT fk_workout_sessions_template_id 
FOREIGN KEY (template_id) REFERENCES public.workout_templates(id) ON DELETE SET NULL;

-- Workout session exercises
ALTER TABLE public.workout_session_exercises 
ADD CONSTRAINT fk_workout_session_exercises_session_id 
FOREIGN KEY (session_id) REFERENCES public.workout_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.workout_session_exercises 
ADD CONSTRAINT fk_workout_session_exercises_exercise_id 
FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

-- Sets
ALTER TABLE public.sets 
ADD CONSTRAINT fk_sets_session_exercise_id 
FOREIGN KEY (session_exercise_id) REFERENCES public.workout_session_exercises(id) ON DELETE CASCADE;

-- Readiness metrics
ALTER TABLE public.readiness_metrics 
ADD CONSTRAINT fk_readiness_metrics_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- AI insights
ALTER TABLE public.ai_insights 
ADD CONSTRAINT fk_ai_insights_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Progression data
ALTER TABLE public.progression_data 
ADD CONSTRAINT fk_progression_data_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.progression_data 
ADD CONSTRAINT fk_progression_data_exercise_id 
FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

-- Daily metrics
ALTER TABLE public.daily_metrics 
ADD CONSTRAINT fk_daily_metrics_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Performance metrics
ALTER TABLE public.performance_metrics 
ADD CONSTRAINT fk_performance_metrics_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Social features foreign keys
ALTER TABLE public.user_connections 
ADD CONSTRAINT fk_user_connections_follower 
FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_connections 
ADD CONSTRAINT fk_user_connections_following 
FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Social posts
ALTER TABLE public.social_posts 
ADD CONSTRAINT fk_social_posts_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Post likes
ALTER TABLE public.post_likes 
ADD CONSTRAINT fk_post_likes_post_id 
FOREIGN KEY (post_id) REFERENCES public.social_posts(id) ON DELETE CASCADE;

ALTER TABLE public.post_likes 
ADD CONSTRAINT fk_post_likes_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Post comments
ALTER TABLE public.post_comments 
ADD CONSTRAINT fk_post_comments_post_id 
FOREIGN KEY (post_id) REFERENCES public.social_posts(id) ON DELETE CASCADE;

ALTER TABLE public.post_comments 
ADD CONSTRAINT fk_post_comments_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Challenges
ALTER TABLE public.challenges 
ADD CONSTRAINT fk_challenges_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Challenge participants
ALTER TABLE public.challenge_participants 
ADD CONSTRAINT fk_challenge_participants_challenge_id 
FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;

ALTER TABLE public.challenge_participants 
ADD CONSTRAINT fk_challenge_participants_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User achievements
ALTER TABLE public.user_achievements 
ADD CONSTRAINT fk_user_achievements_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_achievements 
ADD CONSTRAINT fk_user_achievements_achievement_id 
FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE;

-- Leaderboard entries
ALTER TABLE public.leaderboard_entries 
ADD CONSTRAINT fk_leaderboard_entries_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add performance indexes for common query patterns

-- Social feature indexes
CREATE INDEX IF NOT EXISTS idx_user_connections_follower_id ON public.user_connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_following_id ON public.user_connections(following_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON public.social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON public.social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_public ON public.social_posts(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_active_dates ON public.challenges(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user_metric ON public.leaderboard_entries(user_id, metric_type, time_period);

-- Core workout indexes
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_started_at ON public.workout_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_session_exercises_session_id ON public.workout_session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_session_exercises_exercise_id ON public.workout_session_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_sets_session_exercise_id ON public.sets(session_exercise_id);
CREATE INDEX IF NOT EXISTS idx_readiness_metrics_user_date ON public.readiness_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_type ON public.ai_insights(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON public.ai_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progression_data_user_exercise ON public.progression_data(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON public.daily_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_date ON public.performance_metrics(user_id, date DESC);

-- Exercise and template indexes
CREATE INDEX IF NOT EXISTS idx_exercises_category ON public.exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON public.exercises USING GIN(muscle_groups);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON public.exercises USING GIN(equipment);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_id ON public.workout_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_public ON public.workout_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_workout_template_exercises_template_order ON public.workout_template_exercises(template_id, order_index);

-- Body measurements and progress tracking indexes
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON public.body_measurements(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_date ON public.progress_photos(user_id, created_at DESC);

-- Add data integrity constraints

-- Body measurements validation
ALTER TABLE public.body_measurements 
ADD CONSTRAINT check_weight_positive CHECK (weight > 0);

ALTER TABLE public.body_measurements 
ADD CONSTRAINT check_body_fat_range CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100);

-- Social posts validation
ALTER TABLE public.social_posts 
ADD CONSTRAINT check_likes_count_positive CHECK (likes_count >= 0);

ALTER TABLE public.social_posts 
ADD CONSTRAINT check_comments_count_positive CHECK (comments_count >= 0);

-- Challenge validation
ALTER TABLE public.challenges 
ADD CONSTRAINT check_challenge_dates CHECK (end_date > start_date);

ALTER TABLE public.challenges 
ADD CONSTRAINT check_max_participants_positive CHECK (max_participants > 0);

-- Sets validation
ALTER TABLE public.sets 
ADD CONSTRAINT check_reps_positive CHECK (reps > 0);

ALTER TABLE public.sets 
ADD CONSTRAINT check_weight_non_negative CHECK (weight >= 0);

-- Readiness metrics validation
ALTER TABLE public.readiness_metrics 
ADD CONSTRAINT check_sleep_hours_range CHECK (sleep_hours >= 0 AND sleep_hours <= 24);

ALTER TABLE public.readiness_metrics 
ADD CONSTRAINT check_stress_level_range CHECK (stress_level >= 1 AND stress_level <= 10);

ALTER TABLE public.readiness_metrics 
ADD CONSTRAINT check_energy_level_range CHECK (energy_level >= 1 AND energy_level <= 10);

-- Add unique constraints where needed
ALTER TABLE public.exercises 
ADD CONSTRAINT unique_exercise_name UNIQUE (name);

-- Add missing unique constraint to achievements table (fixing duplicate from migration)
ALTER TABLE public.achievements 
ADD CONSTRAINT unique_achievement_name UNIQUE (name);

-- Create functions for updating counts (denormalized data consistency)
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for maintaining denormalized counts
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.post_likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON public.post_comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();