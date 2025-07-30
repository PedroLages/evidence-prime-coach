import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialFeed } from '@/components/SocialFeed';
import { CommunityChallenge } from '@/components/CommunityChallenge';
import { AchievementSystem } from '@/components/AchievementSystem';
import { Leaderboard } from '@/components/Leaderboard';
import { Users, Trophy, Award, BarChart3 } from 'lucide-react';

export default function SocialPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Social & Community</h1>
          <p className="text-muted-foreground">Connect, compete, and celebrate with the fitness community</p>
        </div>

        <Tabs defaultValue="feed" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="feed">
              <Users className="h-4 w-4 mr-2" />
              Social Feed
            </TabsTrigger>
            <TabsTrigger value="challenges">
              <Trophy className="h-4 w-4 mr-2" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Award className="h-4 w-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <SocialFeed />
          </TabsContent>

          <TabsContent value="challenges">
            <CommunityChallenge />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementSystem />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}