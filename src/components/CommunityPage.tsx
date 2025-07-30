import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialFeed } from '@/components/SocialFeed';
import { CommunityLeaderboard } from '@/components/CommunityLeaderboard';
import { AchievementSystem } from '@/components/AchievementSystem';
import { Users, Trophy, Award } from 'lucide-react';

export function CommunityPage() {
  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Community</h1>
        <p className="text-muted-foreground">
          Connect with fellow fitness enthusiasts, share your progress, and celebrate achievements together.
        </p>
      </div>

      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Social Feed</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span>Leaderboard</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Achievements</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          <SocialFeed />
        </TabsContent>

        <TabsContent value="leaderboard">
          <CommunityLeaderboard />
        </TabsContent>

        <TabsContent value="achievements">
          <AchievementSystem />
        </TabsContent>
      </Tabs>
    </div>
  );
}