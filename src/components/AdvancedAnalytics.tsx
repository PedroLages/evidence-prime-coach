import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Target, Calendar, Download, Filter, BarChart3, Activity, Trophy, Clock } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

export const AdvancedAnalytics: React.FC = () => {
  const { loading } = useAnalytics();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Mock data for advanced analytics
  const performanceData = [
    { date: '2024-01-01', strength: 85, endurance: 78, power: 82, volume: 1200 },
    { date: '2024-01-08', strength: 87, endurance: 80, power: 85, volume: 1350 },
    { date: '2024-01-15', strength: 89, endurance: 82, power: 87, volume: 1400 },
    { date: '2024-01-22', strength: 92, endurance: 85, power: 90, volume: 1500 },
    { date: '2024-01-29', strength: 94, endurance: 87, power: 92, volume: 1650 }
  ];

  const muscleGroupRadarData = [
    { muscle: 'Chest', current: 85, target: 80, fullMark: 100 },
    { muscle: 'Back', current: 72, target: 85, fullMark: 100 },
    { muscle: 'Legs', current: 95, target: 90, fullMark: 100 },
    { muscle: 'Shoulders', current: 60, target: 75, fullMark: 100 },
    { muscle: 'Arms', current: 78, target: 70, fullMark: 100 },
    { muscle: 'Core', current: 65, target: 80, fullMark: 100 }
  ];

  const prData = [
    { exercise: 'Bench Press', current: 225, previous: 215, change: 4.7 },
    { exercise: 'Squat', current: 315, previous: 305, change: 3.3 },
    { exercise: 'Deadlift', current: 405, previous: 385, change: 5.2 },
    { exercise: 'Overhead Press', current: 155, previous: 150, change: 3.3 }
  ];

  const goalData = [
    { goal: 'Bench 300lbs', current: 225, target: 300, progress: 75, deadline: '2024-06-01' },
    { goal: 'Squat 400lbs', current: 315, target: 400, progress: 78.8, deadline: '2024-08-01' },
    { goal: 'Cut to 180lbs', current: 195, target: 180, progress: 50, deadline: '2024-05-01' }
  ];

  if (loading) {
    return <div>Loading advanced analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Deep insights into your fitness journey</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as any)}>
        <TabsList>
          <TabsTrigger value="7d">7 Days</TabsTrigger>
          <TabsTrigger value="30d">30 Days</TabsTrigger>
          <TabsTrigger value="90d">90 Days</TabsTrigger>
          <TabsTrigger value="1y">1 Year</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTimeframe} className="space-y-6">
          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                Track your strength, endurance, and power over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="strength" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="endurance" stroke="hsl(var(--secondary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="power" stroke="hsl(var(--accent))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Volume Progression */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Training Volume
                </CardTitle>
                <CardDescription>Weekly volume progression</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="volume" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Muscle Group Focus Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Muscle Group Focus
                </CardTitle>
                <CardDescription>Current development vs target goals</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={muscleGroupRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="muscle" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Current Level"
                      dataKey="current"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Target Level"
                      dataKey="target"
                      stroke="hsl(var(--secondary))"
                      fill="hsl(var(--secondary))"
                      fillOpacity={0.1}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Personal Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Personal Records Progress
              </CardTitle>
              <CardDescription>Track your PRs and improvements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prData.map((pr) => (
                  <div key={pr.exercise} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{pr.exercise}</h4>
                      <p className="text-sm text-muted-foreground">
                        Previous: {pr.previous}lbs → Current: {pr.current}lbs
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={pr.change > 0 ? "default" : "secondary"}>
                        {pr.change > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {pr.change > 0 ? '+' : ''}{pr.change}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Goal Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goal Progress
              </CardTitle>
              <CardDescription>Track progress towards your fitness goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {goalData.map((goal) => (
                  <div key={goal.goal} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{goal.goal}</h4>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{goal.deadline}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                      <div className="text-sm text-muted-foreground min-w-0">
                        {goal.current} / {goal.target}
                      </div>
                      <Badge variant="outline">
                        {goal.progress.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};