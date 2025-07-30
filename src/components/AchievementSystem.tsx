import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Medal, Award, Crown, Flame, Target, TrendingUp, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Achievement {
  id: string;
  name: string;
  description: string;
  badge_icon: string;
  badge_color: string;
  achievement_type: 'workout_count' | 'streak' | 'pr' | 'milestone' | 'social' | 'challenge';
  criteria: any;
  is_active: boolean;
  created_at: string;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress_data: any;
  achievements: Achievement;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  trophy: Trophy,
  star: Star,
  medal: Medal,
  award: Award,
  crown: Crown,
  flame: Flame,
  fire: Flame,
  target: Target,
  'trending-up': TrendingUp,
  heart: Heart
};

const colorMap: Record<string, string> = {
  gold: 'text-yellow-500',
  silver: 'text-gray-400',
  bronze: 'text-orange-600',
  purple: 'text-purple-500',
  orange: 'text-orange-500',
  red: 'text-red-500',
  green: 'text-green-500',
  blue: 'text-blue-500',
  pink: 'text-pink-500'
};

export const AchievementSystem: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const fetchAchievements = async () => {
    try {
      // Fetch all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (achievementsError) throw achievementsError;
      setAchievements((achievementsData || []) as Achievement[]);

      // Fetch user achievements if logged in
      if (user) {
        const { data: userAchievementsData, error: userAchievementsError } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false });

        if (userAchievementsError) throw userAchievementsError;
        
        // Mock user achievements with achievement data for now
        const userAchievementsWithData = (userAchievementsData || []).map(ua => ({
          ...ua,
          achievements: achievementsData?.find(a => a.id === ua.achievement_id) as Achievement
        })).filter(ua => ua.achievements);
        
        setUserAchievements(userAchievementsWithData as UserAchievement[]);

        // Calculate progress for unearned achievements
        await calculateProgress((achievementsData || []) as Achievement[]);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = async (allAchievements: Achievement[]) => {
    if (!user) return;

    const earnedAchievementIds = userAchievements.map(ua => ua.achievement_id);
    const unearnedAchievements = allAchievements.filter(a => !earnedAchievementIds.includes(a.id));
    
    const progressData: Record<string, number> = {};

    for (const achievement of unearnedAchievements) {
      let currentProgress = 0;

      switch (achievement.achievement_type) {
        case 'workout_count':
          const { count: workoutCount } = await supabase
            .from('workout_sessions')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .not('completed_at', 'is', null);
          
          currentProgress = workoutCount || 0;
          break;

        case 'streak':
          // This would require more complex logic to calculate actual streaks
          // For now, we'll use a simplified version
          currentProgress = 5; // Mock streak data
          break;

        case 'pr':
          const { count: prCount } = await supabase
            .from('performance_metrics')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('metric_type', 'personal_record');
          
          currentProgress = prCount || 0;
          break;

        case 'social':
          const { count: likesCount } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id);
          
          currentProgress = likesCount || 0;
          break;

        default:
          currentProgress = 0;
      }

      progressData[achievement.id] = currentProgress;
    }

    setProgress(progressData);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Trophy;
    return IconComponent;
  };

  const getColorClass = (color: string) => {
    return colorMap[color] || 'text-gray-500';
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(100, (current / target) * 100);
  };

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  if (loading) {
    return <div>Loading achievements...</div>;
  }

  const earnedAchievements = userAchievements.map(ua => ua.achievements);
  const unearnedAchievements = achievements.filter(a => 
    !userAchievements.some(ua => ua.achievement_id === a.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Achievements</h2>
        <p className="text-muted-foreground">Track your fitness milestones and unlock badges</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{earnedAchievements.length}</p>
            <p className="text-sm text-muted-foreground">Achievements Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{unearnedAchievements.length}</p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">
              {Math.round((earnedAchievements.length / achievements.length) * 100)}%
            </p>
            <p className="text-sm text-muted-foreground">Completion Rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="earned">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="earned">Earned ({earnedAchievements.length})</TabsTrigger>
          <TabsTrigger value="available">Available ({unearnedAchievements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="space-y-4">
          {earnedAchievements.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No achievements earned yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete workouts and hit milestones to earn your first achievement!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedAchievements.map((achievement) => {
                const IconComponent = getIcon(achievement.badge_icon);
                const colorClass = getColorClass(achievement.badge_color);
                
                return (
                  <Card key={achievement.id} className="relative overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="bg-green-500">
                        Earned
                      </Badge>
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <IconComponent className={`h-8 w-8 ${colorClass}`} />
                        <div>
                          <CardTitle className="text-lg">{achievement.name}</CardTitle>
                          <CardDescription>{achievement.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="capitalize">
                        {achievement.achievement_type.replace('_', ' ')}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unearnedAchievements.map((achievement) => {
              const IconComponent = getIcon(achievement.badge_icon);
              const colorClass = getColorClass(achievement.badge_color);
              const currentProgress = progress[achievement.id] || 0;
              const target = achievement.criteria.count || achievement.criteria.days || achievement.criteria.likes || 1;
              const progressPercentage = getProgressPercentage(currentProgress, target);
              
              return (
                <Card key={achievement.id} className="relative overflow-hidden opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-8 w-8 ${colorClass} opacity-50`} />
                      <div>
                        <CardTitle className="text-lg">{achievement.name}</CardTitle>
                        <CardDescription>{achievement.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{currentProgress} / {target}</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {achievement.achievement_type.replace('_', ' ')}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};