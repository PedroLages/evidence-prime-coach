import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Zap, Target, TrendingUp, Award, Activity } from 'lucide-react';
import { WorkoutAnalytics } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface WorkoutAnalyticsDashboardProps {
  analytics: WorkoutAnalytics;
  className?: string;
}

export function WorkoutAnalyticsDashboard({ analytics, className }: WorkoutAnalyticsDashboardProps) {
  const getConsistencyColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConsistencyLabel = (percentage: number) => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getRPEColor = (rpe: number) => {
    if (rpe >= 8.5) return 'text-red-600 bg-red-50 border-red-200';
    if (rpe >= 7) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRPELabel = (rpe: number) => {
    if (rpe >= 8.5) return 'High Intensity';
    if (rpe >= 7) return 'Moderate Intensity';
    return 'Low Intensity';
  };

  // Calculate weekly consistency percentage (assuming target of 3-4 workouts per week)
  const consistencyPercentage = Math.min((analytics.consistency.weeklyAverage / 3.5) * 100, 100);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Workouts</p>
                <p className="text-2xl font-bold text-foreground">{analytics.totalWorkouts}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold text-foreground">
                  {(analytics.totalVolume / 1000).toFixed(1)}k
                </p>
                <p className="text-xs text-muted-foreground">lbs lifted</p>
              </div>
              <Target className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold text-foreground">{analytics.averageDuration}m</p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-foreground">{analytics.consistency.streak}</p>
                <p className="text-xs text-muted-foreground">weeks</p>
              </div>
              <Award className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consistency & Intensity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Workout Consistency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Weekly Average</span>
                <span className={cn("font-bold", getConsistencyColor(consistencyPercentage))}>
                  {analytics.consistency.weeklyAverage.toFixed(1)} workouts
                </span>
              </div>
              <Progress value={consistencyPercentage} className="h-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Target: 3-4 per week</span>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getConsistencyColor(consistencyPercentage))}
                >
                  {getConsistencyLabel(consistencyPercentage)}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-foreground">{analytics.consistency.streak}</div>
                <p className="text-xs text-muted-foreground">Current Streak</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-foreground">{analytics.consistency.longestStreak}</div>
                <p className="text-xs text-muted-foreground">Best Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Training Intensity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average RPE</span>
                <span className="text-2xl font-bold text-foreground">
                  {analytics.averageRPE.toFixed(1)}/10
                </span>
              </div>
              <Progress value={analytics.averageRPE * 10} className="h-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Intensity Level</span>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getRPEColor(analytics.averageRPE))}
                >
                  {getRPELabel(analytics.averageRPE)}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">RPE Distribution</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium text-green-600">6-7</div>
                  <div className="text-muted-foreground">Moderate</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-yellow-600">7-8.5</div>
                  <div className="text-muted-foreground">Hard</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">8.5+</div>
                  <div className="text-muted-foreground">Max Effort</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercise Breakdown */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Exercise Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.exerciseBreakdown.slice(0, 8).map((exercise, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{exercise.exercise}</h4>
                  <p className="text-xs text-muted-foreground">
                    Last performed: {new Date(exercise.lastPerformed).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center text-xs">
                  <div>
                    <div className="font-bold text-foreground">{exercise.frequency}</div>
                    <div className="text-muted-foreground">Sessions</div>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">
                      {(exercise.totalVolume / 1000).toFixed(1)}k
                    </div>
                    <div className="text-muted-foreground">Volume</div>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">
                      {Math.round(exercise.avgWeight)}
                    </div>
                    <div className="text-muted-foreground">Avg Weight</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}