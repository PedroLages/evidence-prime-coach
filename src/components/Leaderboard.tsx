import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, TrendingUp, Calendar, Dumbbell, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  metric_type: 'total_workouts' | 'total_volume' | 'streak_days' | 'prs_count';
  value: number;
  time_period: 'weekly' | 'monthly' | 'yearly' | 'all_time';
  rank_position: number;
  calculated_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<Record<string, LeaderboardEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly' | 'all_time'>('monthly');

  const fetchLeaderboardData = async () => {
    try {
      const metrics = ['total_workouts', 'total_volume', 'streak_days', 'prs_count'];
      const data: Record<string, LeaderboardEntry[]> = {};

      for (const metric of metrics) {
        const { data: entries, error } = await supabase
          .from('leaderboard_entries')
          .select('*')
          .eq('metric_type', metric)
          .eq('time_period', selectedPeriod)
          .order('rank_position', { ascending: true })
          .limit(10);

        if (error) throw error;
        data[metric] = (entries || []) as LeaderboardEntry[];
      }

      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Mock data for demonstration
      setLeaderboardData({
        total_workouts: generateMockLeaderboard('total_workouts'),
        total_volume: generateMockLeaderboard('total_volume'),
        streak_days: generateMockLeaderboard('streak_days'),
        prs_count: generateMockLeaderboard('prs_count')
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockLeaderboard = (metricType: string): LeaderboardEntry[] => {
    const mockUsers = [
      { name: 'Alex Johnson', avatar: '', value: metricType === 'total_volume' ? 125000 : 45 },
      { name: 'Sarah Smith', avatar: '', value: metricType === 'total_volume' ? 118000 : 42 },
      { name: 'Mike Chen', avatar: '', value: metricType === 'total_volume' ? 112000 : 38 },
      { name: 'Emma Davis', avatar: '', value: metricType === 'total_volume' ? 108000 : 35 },
      { name: 'Josh Wilson', avatar: '', value: metricType === 'total_volume' ? 105000 : 33 },
      { name: 'Lisa Garcia', avatar: '', value: metricType === 'total_volume' ? 98000 : 30 },
      { name: 'Tom Brown', avatar: '', value: metricType === 'total_volume' ? 95000 : 28 },
      { name: 'Maria Lopez', avatar: '', value: metricType === 'total_volume' ? 92000 : 25 },
      { name: 'David Kim', avatar: '', value: metricType === 'total_volume' ? 88000 : 22 },
      { name: 'Amy Taylor', avatar: '', value: metricType === 'total_volume' ? 85000 : 20 }
    ];

    return mockUsers.map((user, index) => ({
      id: `${metricType}-${index}`,
      user_id: `user-${index}`,
      metric_type: metricType as any,
      value: user.value,
      time_period: selectedPeriod,
      rank_position: index + 1,
      calculated_at: new Date().toISOString(),
      profiles: {
        full_name: user.name,
        avatar_url: user.avatar
      }
    }));
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'total_workouts':
        return <Calendar className="h-5 w-5" />;
      case 'total_volume':
        return <Dumbbell className="h-5 w-5" />;
      case 'streak_days':
        return <TrendingUp className="h-5 w-5" />;
      case 'prs_count':
        return <Trophy className="h-5 w-5" />;
      default:
        return <Medal className="h-5 w-5" />;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'total_workouts':
        return 'Total Workouts';
      case 'total_volume':
        return 'Total Volume (lbs)';
      case 'streak_days':
        return 'Longest Streak';
      case 'prs_count':
        return 'Personal Records';
      default:
        return metric;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">🥈 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-orange-600">🥉 3rd</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  const formatValue = (value: number, metric: string) => {
    if (metric === 'total_volume') {
      return value.toLocaleString();
    }
    return value.toString();
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, [selectedPeriod]);

  if (loading) {
    return <div>Loading leaderboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Leaderboard</h2>
        <p className="text-muted-foreground">See how you rank against the community</p>
      </div>

      <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
          <TabsTrigger value="all_time">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(leaderboardData).map(([metric, entries]) => (
              <Card key={metric}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {getMetricIcon(metric)}
                    <div>
                      <CardTitle>{getMetricLabel(metric)}</CardTitle>
                      <CardDescription>Top performers this {selectedPeriod.replace('_', ' ')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {entries.slice(0, 10).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {getRankBadge(entry.rank_position)}
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entry.profiles?.avatar_url} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            User #{entry.rank_position}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatValue(entry.value, metric)}</p>
                          <p className="text-xs text-muted-foreground">
                            {metric === 'total_volume' ? 'lbs' : 
                             metric === 'streak_days' ? 'days' : 
                             metric === 'total_workouts' ? 'workouts' : 'PRs'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};