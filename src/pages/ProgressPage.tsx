import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Award,
  Weight,
  BarChart3,
  Timer,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsOverview } from '@/components/AnalyticsOverview';
import { PerformanceChart } from '@/components/PerformanceChart';
import { WorkoutAnalyticsDashboard } from '@/components/WorkoutAnalyticsDashboard';
import { ProgressAnalyzer } from '@/lib/analytics/progressAnalyzer';
import { PerformanceMetric, ProgressAnalysis, WorkoutAnalytics } from '@/types/analytics';

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [progressAnalysis, setProgressAnalysis] = useState<ProgressAnalysis | null>(null);
  const [workoutAnalytics, setWorkoutAnalytics] = useState<WorkoutAnalytics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);

  const progressStats = {
    weightGain: 2.2,
    totalWorkouts: 48,
    consistencyRate: 85,
    strongestLifts: [
      { name: 'Deadlift', weight: 120, improvement: '+15kg' },
      { name: 'Squat', weight: 95, improvement: '+12kg' },
      { name: 'Bench Press', weight: 77.5, improvement: '+10kg' },
      { name: 'Row', weight: 85, improvement: '+8kg' }
    ]
  };

  // Generate mock performance data
  useEffect(() => {
    const generateMockData = () => {
      const exercises = ['Bench Press', 'Squat', 'Deadlift', 'Row', 'Overhead Press'];
      const metrics: PerformanceMetric[] = [];
      
      // Generate data for the last 90 days
      for (let i = 0; i < 90; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // 3-4 workouts per week
        if (Math.random() > 0.4) {
          exercises.forEach(exercise => {
            if (Math.random() > 0.6) { // Not every exercise every workout
              const baseWeight = {
                'Bench Press': 70,
                'Squat': 90,
                'Deadlift': 110,
                'Row': 75,
                'Overhead Press': 55
              }[exercise] || 70;
              
              const progressFactor = (90 - i) / 90; // Slight upward trend
              const randomVariation = (Math.random() - 0.5) * 10;
              const weight = baseWeight + (progressFactor * 10) + randomVariation;
              const reps = Math.floor(Math.random() * 8) + 3;
              const sets = Math.floor(Math.random() * 3) + 3;
              const rpe = 6 + Math.random() * 3.5;
              
              metrics.push({
                date: date.toISOString().split('T')[0],
                exercise,
                weight: Math.max(weight, 20),
                reps,
                sets,
                rpe: Math.min(rpe, 10),
                volume: weight * reps * sets,
                oneRM: weight * (1 + reps / 30), // Epley formula approximation
                intensity: (weight / (baseWeight + 15)) * 100
              });
            }
          });
        }
      }
      
      setPerformanceMetrics(metrics.reverse());
      
      // Analyze the data
      const analysis = ProgressAnalyzer.analyzeProgress(metrics, getTimeframeDays(timeRange));
      setProgressAnalysis(analysis);
      
      const analytics = ProgressAnalyzer.calculateWorkoutAnalytics(metrics);
      setWorkoutAnalytics(analytics);
    };
    
    generateMockData();
  }, [timeRange]);

  const getTimeframeDays = (range: 'week' | 'month' | 'all') => {
    switch (range) {
      case 'week': return 7;
      case 'month': return 30;
      case 'all': return 365;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Progress Overview
        </h1>
        <p className="text-muted-foreground">
          Track your journey to 80kg and beyond
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg bg-muted p-1">
          {['week', 'month', 'all'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange(range as any)}
              className={timeRange === range ? "bg-gradient-primary text-primary-foreground" : ""}
            >
              {range === 'all' ? 'All Time' : `Last ${range}`}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strength">Strength</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="body">Body Comp</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {progressAnalysis && (
            <AnalyticsOverview analysis={progressAnalysis} />
          )}
          
          {workoutAnalytics && (
            <WorkoutAnalyticsDashboard analytics={workoutAnalytics} />
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {progressAnalysis && performanceMetrics.length > 0 && (
            <PerformanceChart 
              metrics={performanceMetrics}
              trends={progressAnalysis.trends}
            />
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Weight className="h-8 w-8 text-success mx-auto mb-2" />
                <div className="text-2xl font-bold text-success">+{progressStats.weightGain}</div>
                <p className="text-xs text-muted-foreground">kg gained</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{progressStats.totalWorkouts}</div>
                <p className="text-xs text-muted-foreground">workouts</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Target className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold">{progressStats.consistencyRate}%</div>
                <p className="text-xs text-muted-foreground">consistency</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Timer className="h-8 w-8 text-warning mx-auto mb-2" />
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-muted-foreground">avg min/workout</p>
              </CardContent>
            </Card>
          </div>

          {/* Weight Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weight Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Starting Weight</p>
                  <p className="text-lg font-bold">73.0 kg</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Current Weight</p>
                  <p className="text-lg font-bold">75.2 kg</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Target Weight</p>
                  <p className="text-lg font-bold">80.0 kg</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to Goal</span>
                  <span>44% complete (2.2/7.0 kg)</span>
                </div>
                <Progress value={44} className="h-3" />
              </div>
              
              <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                <p className="text-sm text-success-foreground">
                  🎯 Excellent progress! You're gaining at an optimal rate of ~0.18kg per week.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                  <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                    <Award className="h-5 w-5 text-success-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Bench Press PR!</h4>
                    <p className="text-sm text-muted-foreground">Hit 77.5kg for a clean 5 reps</p>
                  </div>
                  <Badge className="ml-auto">Yesterday</Badge>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">10-Day Streak</h4>
                    <p className="text-sm text-muted-foreground">Consistent workout schedule maintained</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">This week</Badge>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                    <Target className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Volume Milestone</h4>
                    <p className="text-sm text-muted-foreground">Completed 500 total sets this month</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">Last week</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strength" className="space-y-6">
          {/* Strength Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Strength Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressStats.strongestLifts.map((lift, index) => (
                  <div key={lift.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{lift.name}</span>
                      <div className="text-right">
                        <span className="font-bold">{lift.weight} kg</span>
                        <span className="text-sm text-success ml-2">{lift.improvement}</span>
                      </div>
                    </div>
                    <Progress value={75 + index * 5} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 1RM Estimates */}
          <Card>
            <CardHeader>
              <CardTitle>Estimated 1RM</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                  <h4 className="font-semibold">Bench Press</h4>
                  <p className="text-2xl font-bold text-primary">82.5 kg</p>
                  <p className="text-xs text-muted-foreground">+3.5kg this month</p>
                </div>
                <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                  <h4 className="font-semibold">Squat</h4>
                  <p className="text-2xl font-bold text-primary">107 kg</p>
                  <p className="text-xs text-muted-foreground">+5kg this month</p>
                </div>
                <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                  <h4 className="font-semibold">Deadlift</h4>
                  <p className="text-2xl font-bold text-primary">135 kg</p>
                  <p className="text-xs text-muted-foreground">+7kg this month</p>
                </div>
                <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                  <h4 className="font-semibold">Overhead Press</h4>
                  <p className="text-2xl font-bold text-primary">62 kg</p>
                  <p className="text-xs text-muted-foreground">+2kg this month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="body" className="space-y-6">
          {/* Body Composition */}
          <Card>
            <CardHeader>
              <CardTitle>Body Composition Changes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Estimated Muscle Gained</p>
                  <p className="text-2xl font-bold text-success">+1.8 kg</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Estimated Fat Gained</p>
                  <p className="text-2xl font-bold text-warning">+0.4 kg</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Lean Mass Ratio</span>
                  <span>82% of total gain</span>
                </div>
                <Progress value={82} className="h-2" />
              </div>
              
              <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                <p className="text-sm text-success-foreground">
                  ✨ Excellent body composition! You're gaining mostly lean mass.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Measurements */}
          <Card>
            <CardHeader>
              <CardTitle>Body Measurements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Chest', current: '102cm', change: '+2.5cm' },
                  { name: 'Arms', current: '36cm', change: '+1.8cm' },
                  { name: 'Waist', current: '82cm', change: '+1.2cm' },
                  { name: 'Thighs', current: '58cm', change: '+2.1cm' }
                ].map((measurement) => (
                  <div key={measurement.name} className="flex items-center justify-between p-2 rounded-lg border">
                    <span className="font-medium">{measurement.name}</span>
                    <div className="text-right">
                      <span className="font-bold">{measurement.current}</span>
                      <span className="text-sm text-success ml-2">{measurement.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habits" className="space-y-6">
          {/* Consistency Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Training Consistency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">85%</p>
                  <p className="text-xs text-muted-foreground">Workout Adherence</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">7.2h</p>
                  <p className="text-xs text-muted-foreground">Avg Sleep</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">12</p>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Goal</span>
                  <span>20/23 workouts completed</span>
                </div>
                <Progress value={87} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Weekly Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                  const completionRate = [95, 90, 0, 88, 92, 75, 0][index];
                  return (
                    <div key={day} className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">{day}</div>
                      <div className="h-20 bg-muted rounded-lg relative overflow-hidden">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-gradient-primary transition-all"
                          style={{ height: `${completionRate}%` }}
                        />
                      </div>
                      <div className="text-xs font-medium mt-1">{completionRate}%</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}