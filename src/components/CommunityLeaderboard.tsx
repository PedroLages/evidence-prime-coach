import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  user: {
    name: string;
    avatar: string;
    level: number;
  };
  score: number;
  rank: number;
  change: number; // +/- position change
  metric: string;
}

const weeklyLeaderboard: LeaderboardEntry[] = [
  {
    id: '1',
    user: { name: 'Alex Johnson', avatar: '', level: 18 },
    score: 2450,
    rank: 1,
    change: 2,
    metric: 'Total Volume (lbs)'
  },
  {
    id: '2',
    user: { name: 'Sarah Chen', avatar: '', level: 16 },
    score: 2380,
    rank: 2,
    change: -1,
    metric: 'Total Volume (lbs)'
  },
  {
    id: '3',
    user: { name: 'Mike Rodriguez', avatar: '', level: 15 },
    score: 2250,
    rank: 3,
    change: 1,
    metric: 'Total Volume (lbs)'
  },
  {
    id: '4',
    user: { name: 'Emma Wilson', avatar: '', level: 14 },
    score: 2180,
    rank: 4,
    change: 0,
    metric: 'Total Volume (lbs)'
  },
  {
    id: '5',
    user: { name: 'David Kim', avatar: '', level: 13 },
    score: 2100,
    rank: 5,
    change: -3,
    metric: 'Total Volume (lbs)'
  }
];

const monthlyLeaderboard: LeaderboardEntry[] = [
  {
    id: '1',
    user: { name: 'Sarah Chen', avatar: '', level: 16 },
    score: 24,
    rank: 1,
    change: 3,
    metric: 'Workouts Completed'
  },
  {
    id: '2',
    user: { name: 'Alex Johnson', avatar: '', level: 18 },
    score: 22,
    rank: 2,
    change: 0,
    metric: 'Workouts Completed'
  },
  {
    id: '3',
    user: { name: 'Emma Wilson', avatar: '', level: 14 },
    score: 20,
    rank: 3,
    change: 1,
    metric: 'Workouts Completed'
  },
  {
    id: '4',
    user: { name: 'Mike Rodriguez', avatar: '', level: 15 },
    score: 19,
    rank: 4,
    change: -2,
    metric: 'Workouts Completed'
  },
  {
    id: '5',
    user: { name: 'David Kim', avatar: '', level: 13 },
    score: 18,
    rank: 5,
    change: 1,
    metric: 'Workouts Completed'
  }
];

export function CommunityLeaderboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return <span className="text-green-500 text-xs">↗ +{change}</span>;
    } else if (change < 0) {
      return <span className="text-red-500 text-xs">↘ {change}</span>;
    }
    return <span className="text-muted-foreground text-xs">—</span>;
  };

  const renderLeaderboard = (data: LeaderboardEntry[]) => (
    <div className="space-y-3">
      {data.map((entry, index) => (
        <Card key={entry.id} className={index < 3 ? 'border-primary/20' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8">
                {getRankIcon(entry.rank)}
              </div>
              
              <Avatar>
                <AvatarImage src={entry.user.avatar} />
                <AvatarFallback>{entry.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{entry.user.name}</span>
                  <Badge variant="secondary">Level {entry.user.level}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {entry.score.toLocaleString()} {entry.metric}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-bold text-lg">{entry.score.toLocaleString()}</div>
                {getChangeIndicator(entry.change)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Community Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weekly">This Week</TabsTrigger>
              <TabsTrigger value="monthly">This Month</TabsTrigger>
            </TabsList>
            
            <TabsContent value="weekly" className="mt-6">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Weekly Champions</h3>
                  <p className="text-sm text-muted-foreground">
                    Based on total training volume this week
                  </p>
                </div>
                {renderLeaderboard(weeklyLeaderboard)}
              </div>
            </TabsContent>
            
            <TabsContent value="monthly" className="mt-6">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Monthly Champions</h3>
                  <p className="text-sm text-muted-foreground">
                    Based on consistency and workout frequency
                  </p>
                </div>
                {renderLeaderboard(monthlyLeaderboard)}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}