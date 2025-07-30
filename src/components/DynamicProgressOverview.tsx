import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Weight,
  BarChart3,
  Timer,
  Zap,
  Calendar,
  Award
} from 'lucide-react';
import { useDynamicAnalytics } from '@/hooks/useDynamicAnalytics';
import { formatWeight, getDefaultUnits } from '@/lib/units';
import { useProfile } from '@/hooks/useProfile';

export function DynamicProgressOverview() {
  const { profile } = useProfile();
  const { workoutStatistics, exercisePerformance, progressOverview, loading, error } = useDynamicAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Error loading analytics: {error}</p>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  if (!workoutStatistics || !progressOverview) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No workout data available yet.</p>
        <p className="text-sm text-muted-foreground mt-2">Start logging workouts to see your progress!</p>
      </div>
    );
  }

  const units = getDefaultUnits(profile?.unit_system || 'metric');

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            {progressOverview.weightProgress.totalChange !== null ? (
              <>
                <Weight className={`h-8 w-8 mx-auto mb-2 ${
                  progressOverview.weightProgress.totalChange > 0 ? 'text-success' : 'text-warning'
                }`} />
                <div className={`text-2xl font-bold ${
                  progressOverview.weightProgress.totalChange > 0 ? 'text-success' : 'text-warning'
                }`}>
                  {progressOverview.weightProgress.totalChange > 0 ? '+' : ''}
                  {progressOverview.weightProgress.totalChange.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">{units.weightUnit} {
                  progressOverview.weightProgress.totalChange > 0 ? 'gained' : 'lost'
                }</p>
              </>
            ) : (
              <>
                <Weight className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <div className="text-2xl font-bold text-muted-foreground">--</div>
                <p className="text-xs text-muted-foreground">no data</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{workoutStatistics.totalWorkouts}</div>
            <p className="text-xs text-muted-foreground">workouts</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <Target className="h-8 w-8 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold">{workoutStatistics.workoutConsistency.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">consistency</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <Timer className="h-8 w-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {workoutStatistics.averageWorkoutDuration > 0 ? workoutStatistics.averageWorkoutDuration.toFixed(0) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">avg min/workout</p>
          </CardContent>
        </Card>
      </div>

      {/* Weight Progress */}
      {progressOverview.weightProgress.currentWeight && (
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
                <p className="text-lg font-bold">
                  {formatWeight(progressOverview.weightProgress.startWeight, units.weightUnit)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <p className="text-lg font-bold">
                  {formatWeight(progressOverview.weightProgress.currentWeight, units.weightUnit)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Target Weight</p>
                <p className="text-lg font-bold">
                  {formatWeight(progressOverview.weightProgress.targetWeight, units.weightUnit)}
                </p>
              </div>
            </div>
            
            {progressOverview.weightProgress.progressPercentage !== null && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to Goal</span>
                    <span>
                      {progressOverview.weightProgress.progressPercentage.toFixed(0)}% complete 
                      {progressOverview.weightProgress.totalChange && (
                        ` (${Math.abs(progressOverview.weightProgress.totalChange).toFixed(1)}/${
                          Math.abs((progressOverview.weightProgress.targetWeight || 0) - (progressOverview.weightProgress.startWeight || 0)).toFixed(1)
                        } ${units.weightUnit})`
                      )}
                    </span>
                  </div>
                  <Progress 
                    value={Math.max(0, Math.min(100, progressOverview.weightProgress.progressPercentage))} 
                    className="h-3" 
                  />
                </div>
                
                {progressOverview.weightProgress.weeklyRate && (
                  <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                    <p className="text-sm">
                      🎯 {progressOverview.weightProgress.weeklyRate > 0 ? 'Great progress!' : 'Steady progress!'} 
                      {' '}You're {progressOverview.weightProgress.weeklyRate > 0 ? 'gaining' : 'losing'} at{' '}
                      {Math.abs(progressOverview.weightProgress.weeklyRate).toFixed(2)}{units.weightUnit} per week.
                      {progressOverview.weightProgress.projectedGoalDate && (
                        <span> Goal projected for {new Date(progressOverview.weightProgress.projectedGoalDate).toLocaleDateString()}.</span>
                      )}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Workout Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Workout Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gradient-subtle rounded-lg">
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-xl font-bold">
                  {workoutStatistics.totalVolume.toLocaleString()} {units.weightUnit}
                </p>
              </div>
              <div className="text-center p-3 bg-gradient-subtle rounded-lg">
                <p className="text-sm text-muted-foreground">Total Sets</p>
                <p className="text-xl font-bold">{workoutStatistics.totalSets.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 bg-gradient-subtle rounded-lg">
                <p className="text-sm text-muted-foreground">Avg Intensity</p>
                <p className="text-xl font-bold">
                  {workoutStatistics.trainingIntensity > 0 ? workoutStatistics.trainingIntensity.toFixed(1) : '--'} RPE
                </p>
              </div>
              <div className="text-center p-3 bg-gradient-subtle rounded-lg">
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-xl font-bold">{workoutStatistics.currentStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Last 30 Days</span>
                <Badge variant="secondary">{workoutStatistics.recentWorkouts} workouts</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Longest Streak</span>
                <Badge variant="outline">{workoutStatistics.longestStreak} days</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Adherence Rate</span>
                <Badge variant={progressOverview.consistency.adherenceRate > 80 ? 'default' : 'secondary'}>
                  {progressOverview.consistency.adherenceRate.toFixed(0)}%
                </Badge>
              </div>
              
              {progressOverview.strengthProgress.overallTrend && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall Trend</span>
                  <div className="flex items-center gap-1">
                    {progressOverview.strengthProgress.overallTrend === 'improving' && (
                      <>
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-sm text-success">Improving</span>
                      </>
                    )}
                    {progressOverview.strengthProgress.overallTrend === 'declining' && (
                      <>
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">Declining</span>
                      </>
                    )}
                    {progressOverview.strengthProgress.overallTrend === 'stable' && (
                      <>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Stable</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercise Performance Breakdown */}
      {exercisePerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Exercise Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exercisePerformance.slice(0, 6).map((exercise, index) => (
                <div key={exercise.exercise} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <h4 className="font-medium">{exercise.exercise}</h4>
                    <p className="text-sm text-muted-foreground">
                      Max: {exercise.maxWeight}{units.weightUnit} • 
                      Volume: {exercise.totalVolume.toLocaleString()}{units.weightUnit} • 
                      Sets: {exercise.totalSets}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {exercise.trend === 'improving' && (
                      <TrendingUp className="h-4 w-4 text-success" />
                    )}
                    {exercise.trend === 'declining' && (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    {exercise.trend === 'stable' && (
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    )}
                    {exercise.personalRecords > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {exercise.personalRecords} PR{exercise.personalRecords > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}