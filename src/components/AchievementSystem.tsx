import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Target, Zap, Award, Lock } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'strength' | 'endurance' | 'consistency' | 'social';
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
  reward?: {
    type: 'xp' | 'badge' | 'title';
    value: string;
  };
}

const achievements: Achievement[] = [
  {
    id: '1',
    title: 'First Steps',
    description: 'Complete your first workout',
    category: 'consistency',
    tier: 'bronze',
    isUnlocked: true,
    progress: 1,
    maxProgress: 1,
    unlockedAt: '2 days ago',
    reward: { type: 'xp', value: '100 XP' }
  },
  {
    id: '2',
    title: 'Strength Seeker',
    description: 'Bench press your body weight',
    category: 'strength',
    tier: 'silver',
    isUnlocked: true,
    progress: 1,
    maxProgress: 1,
    unlockedAt: '1 week ago',
    reward: { type: 'badge', value: 'Strength Badge' }
  },
  {
    id: '3',
    title: 'Week Warrior',
    description: 'Work out 5 times in a week',
    category: 'consistency',
    tier: 'silver',
    isUnlocked: false,
    progress: 3,
    maxProgress: 5
  },
  {
    id: '4',
    title: 'Social Butterfly',
    description: 'Share 10 workout posts',
    category: 'social',
    tier: 'bronze',
    isUnlocked: false,
    progress: 6,
    maxProgress: 10
  },
  {
    id: '5',
    title: 'Endurance Elite',
    description: 'Complete a 60-minute workout',
    category: 'endurance',
    tier: 'gold',
    isUnlocked: false,
    progress: 45,
    maxProgress: 60
  },
  {
    id: '6',
    title: 'Gym Legend',
    description: 'Work out for 100 consecutive days',
    category: 'consistency',
    tier: 'diamond',
    isUnlocked: false,
    progress: 23,
    maxProgress: 100
  }
];

export function AchievementSystem() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength': return <Trophy className="h-4 w-4" />;
      case 'endurance': return <Zap className="h-4 w-4" />;
      case 'consistency': return <Target className="h-4 w-4" />;
      case 'social': return <Star className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-700 text-amber-100';
      case 'silver': return 'bg-gray-500 text-gray-100';
      case 'gold': return 'bg-yellow-500 text-yellow-900';
      case 'diamond': return 'bg-blue-600 text-blue-100';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.isUnlocked).length,
    totalXP: achievements.filter(a => a.isUnlocked && a.reward?.type === 'xp').reduce((sum, a) => sum + parseInt(a.reward?.value || '0'), 0)
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Achievement System</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.unlocked}</div>
              <div className="text-sm text-muted-foreground">Unlocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalXP}</div>
              <div className="text-sm text-muted-foreground">Total XP</div>
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="strength">Strength</TabsTrigger>
              <TabsTrigger value="endurance">Endurance</TabsTrigger>
              <TabsTrigger value="consistency">Consistency</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6">
              <div className="grid gap-4">
                {filteredAchievements.map((achievement) => (
                  <Card key={achievement.id} className={achievement.isUnlocked ? 'border-primary/50' : 'border-muted'}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-lg ${achievement.isUnlocked ? 'bg-primary/10' : 'bg-muted'}`}>
                          {achievement.isUnlocked ? getCategoryIcon(achievement.category) : <Lock className="h-4 w-4" />}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-semibold ${achievement.isUnlocked ? '' : 'text-muted-foreground'}`}>
                              {achievement.title}
                            </h3>
                            <Badge className={getTierColor(achievement.tier)}>
                              {achievement.tier}
                            </Badge>
                            {achievement.isUnlocked && (
                              <Badge variant="secondary">Unlocked</Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {achievement.description}
                          </p>
                          
                          {!achievement.isUnlocked && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Progress</span>
                                <span>{achievement.progress}/{achievement.maxProgress}</span>
                              </div>
                              <Progress 
                                value={(achievement.progress / achievement.maxProgress) * 100} 
                                className="h-2"
                              />
                            </div>
                          )}
                          
                          {achievement.isUnlocked && achievement.unlockedAt && (
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Unlocked {achievement.unlockedAt}</span>
                              {achievement.reward && (
                                <span className="font-medium text-primary">
                                  +{achievement.reward.value}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}