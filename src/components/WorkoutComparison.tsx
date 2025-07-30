import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Equal, Calendar, Users, Target, Activity } from 'lucide-react';

interface WorkoutComparison {
  date: string;
  workout: string;
  volume: number;
  intensity: number;
  duration: number;
  exercises: number;
  rpe: number;
}

export const WorkoutComparison: React.FC = () => {
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>(['workout1', 'workout2']);
  const [comparisonType, setComparisonType] = useState<'personal' | 'peer' | 'template'>('personal');
  
  // Mock data for workout comparisons
  const workoutHistory: WorkoutComparison[] = [
    { date: '2024-01-15', workout: 'Push Day A', volume: 12500, intensity: 85, duration: 75, exercises: 6, rpe: 8 },
    { date: '2024-01-08', workout: 'Push Day A', volume: 11200, intensity: 82, duration: 70, exercises: 6, rpe: 7 },
    { date: '2024-01-01', workout: 'Push Day A', volume: 10800, intensity: 80, duration: 68, exercises: 6, rpe: 7 },
    { date: '2024-01-22', workout: 'Pull Day A', volume: 13200, intensity: 87, duration: 80, exercises: 7, rpe: 8 },
    { date: '2024-01-14', workout: 'Pull Day A', volume: 12800, intensity: 85, duration: 78, exercises: 7, rpe: 8 },
    { date: '2024-01-07', workout: 'Pull Day A', volume: 12000, intensity: 83, duration: 75, exercises: 7, rpe: 7 }
  ];

  const peerComparison = [
    { metric: 'Volume', you: 12500, peers: 11200, percentile: 75 },
    { metric: 'Intensity', you: 85, peers: 78, percentile: 82 },
    { metric: 'Duration', you: 75, peers: 68, percentile: 65 },
    { metric: 'Frequency', you: 5, peers: 4.2, percentile: 78 }
  ];

  const radarData = [
    { subject: 'Volume', A: 85, B: 72, fullMark: 100 },
    { subject: 'Intensity', A: 88, B: 75, fullMark: 100 },
    { subject: 'Duration', A: 75, B: 82, fullMark: 100 },
    { subject: 'Consistency', A: 92, B: 68, fullMark: 100 },
    { subject: 'Progressive Overload', A: 78, B: 85, fullMark: 100 },
    { subject: 'Recovery', A: 70, B: 88, fullMark: 100 }
  ];

  const getChangeIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 1) return <Equal className="h-4 w-4 text-gray-500" />;
    return change > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const pushWorkouts = workoutHistory.filter(w => w.workout.includes('Push'));
  const pullWorkouts = workoutHistory.filter(w => w.workout.includes('Pull'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Workout Comparison</h2>
          <p className="text-muted-foreground">Compare workouts to track progress and identify patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={comparisonType} onValueChange={(value) => setComparisonType(value as 'personal' | 'peer' | 'template')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal History</SelectItem>
              <SelectItem value="peer">Peer Comparison</SelectItem>
              <SelectItem value="template">Template vs Actual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          <TabsTrigger value="peer">Peer Analysis</TabsTrigger>
          <TabsTrigger value="radar">Performance Radar</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6">
          {/* Workout Progress Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Push Day Progress
                </CardTitle>
                <CardDescription>Volume and intensity trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={pushWorkouts.reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="intensity" stroke="hsl(var(--secondary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Pull Day Progress
                </CardTitle>
                <CardDescription>Volume and intensity trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={pullWorkouts.reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="intensity" stroke="hsl(var(--secondary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Session Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Session Comparison</CardTitle>
              <CardDescription>Compare your last few workouts side by side</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workoutHistory.slice(0, 3).map((workout, index) => {
                  const previousWorkout = workoutHistory[index + 1];
                  return (
                    <div key={workout.date} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{workout.workout}</h4>
                        <p className="text-sm text-muted-foreground">{workout.date}</p>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-medium">{workout.volume.toLocaleString()}</span>
                            {previousWorkout && getChangeIndicator(workout.volume, previousWorkout.volume)}
                          </div>
                          <p className="text-xs text-muted-foreground">Volume</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-medium">{workout.intensity}%</span>
                            {previousWorkout && getChangeIndicator(workout.intensity, previousWorkout.intensity)}
                          </div>
                          <p className="text-xs text-muted-foreground">Intensity</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-medium">{workout.duration}m</span>
                            {previousWorkout && getChangeIndicator(workout.duration, previousWorkout.duration)}
                          </div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-medium">{workout.rpe}/10</span>
                            {previousWorkout && getChangeIndicator(workout.rpe, previousWorkout.rpe)}
                          </div>
                          <p className="text-xs text-muted-foreground">RPE</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="peer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Peer Comparison
              </CardTitle>
              <CardDescription>See how you stack up against similar users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {peerComparison.map((metric) => (
                  <div key={metric.metric} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{metric.metric}</span>
                      <Badge variant={metric.percentile >= 75 ? "default" : metric.percentile >= 50 ? "secondary" : "outline"}>
                        {metric.percentile}th percentile
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>You: {metric.you}</span>
                          <span>Peers: {metric.peers}</span>
                        </div>
                        <ResponsiveContainer width="100%" height={30}>
                          <BarChart data={[{ you: metric.you, peers: metric.peers }]} layout="horizontal">
                            <Bar dataKey="you" fill="hsl(var(--primary))" />
                            <Bar dataKey="peers" fill="hsl(var(--muted))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="radar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Radar
              </CardTitle>
              <CardDescription>Multi-dimensional performance comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar name="Current Period" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Radar name="Previous Period" dataKey="B" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};