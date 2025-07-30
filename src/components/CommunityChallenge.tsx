import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Trophy, Target, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: 'distance' | 'time' | 'weight' | 'reps' | 'consistency';
  target_value: number;
  target_unit: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by: string;
  max_participants: number;
  prize_description: string;
  created_at: string;
  participant_count?: number;
  user_participation?: {
    current_value: number;
    is_completed: boolean;
  };
}

export const CommunityChallenge: React.FC = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  const fetchChallenges = async () => {
    try {
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get participant counts and user participation
      const challengesWithData = await Promise.all(
        (challengesData || []).map(async (challenge) => {
          // Get participant count
          const { count } = await supabase
            .from('challenge_participants')
            .select('*', { count: 'exact' })
            .eq('challenge_id', challenge.id);

          // Get user participation if logged in
          let userParticipation = null;
          if (user) {
            const { data: participation } = await supabase
              .from('challenge_participants')
              .select('current_value, is_completed')
              .eq('challenge_id', challenge.id)
              .eq('user_id', user.id)
              .single();
            
            userParticipation = participation;
          }

          return {
            ...challenge,
            participant_count: count || 0,
            user_participation: userParticipation
          } as Challenge;
        })
      );

      setChallenges(challengesWithData);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          current_value: 0
        });

      if (error) throw error;
      await fetchChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  const updateProgress = async (challengeId: string, newValue: number) => {
    if (!user) return;

    try {
      const challenge = challenges.find(c => c.id === challengeId);
      const isCompleted = challenge ? newValue >= challenge.target_value : false;

      const { error } = await supabase
        .from('challenge_participants')
        .update({
          current_value: newValue,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchChallenges();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(100, (current / target) * 100);
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'distance':
        return <MapPin className="h-5 w-5" />;
      case 'time':
        return <Clock className="h-5 w-5" />;
      case 'weight':
        return <Trophy className="h-5 w-5" />;
      case 'reps':
        return <Target className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  if (loading) {
    return <div>Loading challenges...</div>;
  }

  const activeChallenges = challenges.filter(c => getDaysRemaining(c.end_date) > 0);
  const completedChallenges = challenges.filter(c => 
    c.user_participation?.is_completed || getDaysRemaining(c.end_date) === 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Community Challenges</h2>
        <p className="text-muted-foreground">Join challenges and compete with the community</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Challenges</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No active challenges available</p>
              </CardContent>
            </Card>
          ) : (
            activeChallenges.map((challenge) => {
              const daysRemaining = getDaysRemaining(challenge.end_date);
              const userProgress = challenge.user_participation?.current_value || 0;
              const progressPercentage = getProgressPercentage(userProgress, challenge.target_value);
              
              return (
                <Card key={challenge.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getChallengeIcon(challenge.challenge_type)}
                        <div>
                          <CardTitle>{challenge.title}</CardTitle>
                          <CardDescription>{challenge.description}</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={daysRemaining > 7 ? "default" : "destructive"}>
                          {daysRemaining} days left
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{challenge.target_value}</p>
                        <p className="text-sm text-muted-foreground">{challenge.target_unit} Goal</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{challenge.participant_count}</p>
                        <p className="text-sm text-muted-foreground">Participants</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{format(new Date(challenge.start_date), 'MMM d')}</p>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{format(new Date(challenge.end_date), 'MMM d')}</p>
                        <p className="text-sm text-muted-foreground">End Date</p>
                      </div>
                    </div>

                    {challenge.prize_description && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium">Prize: {challenge.prize_description}</span>
                        </div>
                      </div>
                    )}

                    {challenge.user_participation ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Your Progress</span>
                          <span>{userProgress} / {challenge.target_value} {challenge.target_unit}</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateProgress(challenge.id, userProgress + 1)}
                            disabled={challenge.user_participation.is_completed}
                          >
                            +1 {challenge.target_unit}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateProgress(challenge.id, userProgress + 5)}
                            disabled={challenge.user_participation.is_completed}
                          >
                            +5 {challenge.target_unit}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => joinChallenge(challenge.id)}
                        className="w-full"
                        disabled={!user}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Join Challenge
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No completed challenges yet</p>
              </CardContent>
            </Card>
          ) : (
            completedChallenges.map((challenge) => (
              <Card key={challenge.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getChallengeIcon(challenge.challenge_type)}
                      <div>
                        <CardTitle>{challenge.title}</CardTitle>
                        <CardDescription>{challenge.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {challenge.user_participation?.is_completed ? 'Completed' : 'Ended'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {challenge.user_participation && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Final Progress</span>
                        <span>
                          {challenge.user_participation.current_value} / {challenge.target_value} {challenge.target_unit}
                        </span>
                      </div>
                      <Progress 
                        value={getProgressPercentage(challenge.user_participation.current_value, challenge.target_value)} 
                        className="h-2" 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};