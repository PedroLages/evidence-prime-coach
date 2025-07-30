-- Create social features tables

-- User connections/following system
CREATE TABLE IF NOT EXISTS public.user_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Social feed posts
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('workout', 'achievement', 'progress', 'milestone')),
  content TEXT NOT NULL,
  data JSONB,
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Post likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Post comments
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Community challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('distance', 'time', 'weight', 'reps', 'consistency')),
  target_value NUMERIC,
  target_unit TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  max_participants INTEGER,
  prize_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Challenge participants
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL,
  user_id UUID NOT NULL,
  current_value NUMERIC DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(challenge_id, user_id)
);

-- Achievements and badges
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  badge_icon TEXT,
  badge_color TEXT,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('workout_count', 'streak', 'pr', 'milestone', 'social', 'challenge')),
  criteria JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  progress_data JSONB,
  UNIQUE(user_id, achievement_id)
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('total_workouts', 'total_volume', 'streak_days', 'prs_count')),
  value NUMERIC NOT NULL,
  time_period TEXT NOT NULL CHECK (time_period IN ('weekly', 'monthly', 'yearly', 'all_time')),
  rank_position INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, metric_type, time_period)
);

-- Enable RLS
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User connections
CREATE POLICY "Users can view connections" ON public.user_connections 
FOR SELECT USING (auth.uid() IN (follower_id, following_id));

CREATE POLICY "Users can create connections" ON public.user_connections 
FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their connections" ON public.user_connections 
FOR DELETE USING (auth.uid() = follower_id);

-- Social posts
CREATE POLICY "Users can view public posts and own posts" ON public.social_posts 
FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own posts" ON public.social_posts 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.social_posts 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.social_posts 
FOR DELETE USING (auth.uid() = user_id);

-- Post likes
CREATE POLICY "Users can view all likes" ON public.post_likes 
FOR SELECT USING (true);

CREATE POLICY "Users can create likes" ON public.post_likes 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.post_likes 
FOR DELETE USING (auth.uid() = user_id);

-- Post comments
CREATE POLICY "Users can view comments on visible posts" ON public.post_comments 
FOR SELECT USING (
  post_id IN (
    SELECT id FROM public.social_posts 
    WHERE is_public = true OR user_id = auth.uid()
  )
);

CREATE POLICY "Users can create comments" ON public.post_comments 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.post_comments 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.post_comments 
FOR DELETE USING (auth.uid() = user_id);

-- Challenges
CREATE POLICY "Users can view active challenges" ON public.challenges 
FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create challenges" ON public.challenges 
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Challenge creators can update their challenges" ON public.challenges 
FOR UPDATE USING (auth.uid() = created_by);

-- Challenge participants
CREATE POLICY "Users can view challenge participants" ON public.challenge_participants 
FOR SELECT USING (true);

CREATE POLICY "Users can join challenges" ON public.challenge_participants 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation" ON public.challenge_participants 
FOR UPDATE USING (auth.uid() = user_id);

-- Achievements
CREATE POLICY "Users can view all achievements" ON public.achievements 
FOR SELECT USING (is_active = true);

-- User achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create user achievements" ON public.user_achievements 
FOR INSERT WITH CHECK (true);

-- Leaderboards
CREATE POLICY "Users can view leaderboards" ON public.leaderboard_entries 
FOR SELECT USING (true);

CREATE POLICY "System can manage leaderboard entries" ON public.leaderboard_entries 
FOR ALL USING (true);

-- Insert default achievements
INSERT INTO public.achievements (name, description, badge_icon, badge_color, achievement_type, criteria) VALUES
('First Workout', 'Complete your first workout', 'trophy', 'gold', 'workout_count', '{"count": 1}'),
('Getting Started', 'Complete 5 workouts', 'star', 'silver', 'workout_count', '{"count": 5}'),
('Consistent', 'Complete 10 workouts', 'medal', 'bronze', 'workout_count', '{"count": 10}'),
('Dedicated', 'Complete 25 workouts', 'award', 'gold', 'workout_count', '{"count": 25}'),
('Fitness Enthusiast', 'Complete 50 workouts', 'crown', 'purple', 'workout_count', '{"count": 50}'),
('Week Warrior', 'Maintain a 7-day workout streak', 'flame', 'orange', 'streak', '{"days": 7}'),
('Month Master', 'Maintain a 30-day workout streak', 'fire', 'red', 'streak', '{"days": 30}'),
('Personal Best', 'Set your first personal record', 'target', 'green', 'pr', '{"count": 1}'),
('Record Breaker', 'Set 10 personal records', 'trending-up', 'blue', 'pr', '{"count": 10}'),
('Social Butterfly', 'Get 50 likes on your posts', 'heart', 'pink', 'social', '{"likes": 50}')
ON CONFLICT (name) DO NOTHING;