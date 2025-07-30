import { TrendingUp, Calendar, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProgressionMetrics } from '@/types/autoProgression';
import { cn } from '@/lib/utils';

interface ProgressPatternCardProps {
  metrics: ProgressionMetrics[];
  period: 'week' | 'month' | 'quarter';
  onPeriodChange: (period: 'week' | 'month' | 'quarter') => void;
  className?: string;
}

export function ProgressPatternCard({ 
  metrics, 
  period, 
  onPeriodChange, 
  className 
}: ProgressPatternCardProps) {
  const formatWeight = (weight: number) => `${weight}kg`;
  const formatPercentage = (percent: number) => `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';  
      case 'quarter': return 'Quarterly';
      default: return 'Period';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Progress Patterns
          </div>
          <div className="flex gap-1">
            {(['week', 'month', 'quarter'] as const).map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  period === p 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {metrics.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No progress data available</p>
            <p className="text-sm text-muted-foreground">Complete more workouts to see patterns</p>
          </div>
        ) : (
          metrics.map((metric) => (
            <div key={metric.exercise} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{metric.exercise}</h4>
                <Badge variant="outline" className="text-xs">
                  {getPeriodLabel(metric.period)}
                </Badge>
              </div>

              {/* 1RM Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated 1RM</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatWeight(metric.metrics.oneRMProgress.current)}
                    </span>
                    <span className={cn("text-xs", getChangeColor(metric.metrics.oneRMProgress.change))}>
                      {formatPercentage(metric.metrics.oneRMProgress.changePercent)}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={Math.min(100, (metric.metrics.oneRMProgress.current / metric.metrics.oneRMProgress.start) * 100)} 
                  className="h-2" 
                />
              </div>

              {/* Volume Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Training Volume</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {Math.round(metric.metrics.volumeProgress.current)}kg
                    </span>
                    <span className={cn("text-xs", getChangeColor(metric.metrics.volumeProgress.change))}>
                      {formatPercentage(metric.metrics.volumeProgress.changePercent)}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={Math.min(100, (metric.metrics.volumeProgress.current / metric.metrics.volumeProgress.start) * 100)} 
                  className="h-2" 
                />
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                <div className="text-center">
                  <div className="text-sm font-medium text-foreground">
                    {Math.round(metric.metrics.consistencyScore * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Consistency</p>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-foreground">
                    {metric.metrics.averageRPE.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">Avg RPE</p>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-foreground">
                    {metric.metrics.prCount}
                  </div>
                  <p className="text-xs text-muted-foreground">PRs</p>
                </div>
              </div>

              {/* Performance Indicators */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {metric.metrics.plateauCount} plateaus
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {metric.metrics.progressionRate.toFixed(1)}kg/week
                </div>
              </div>

              {/* Projections */}
              {metric.projections && (
                <div className="space-y-2 pt-2 border-t">
                  <h5 className="text-xs font-medium text-muted-foreground">1RM Projections:</h5>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium">{formatWeight(metric.projections.oneRM.oneMonth)}</div>
                      <div className="text-muted-foreground">1 month</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{formatWeight(metric.projections.oneRM.threeMonths)}</div>
                      <div className="text-muted-foreground">3 months</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{formatWeight(metric.projections.oneRM.sixMonths)}</div>
                      <div className="text-muted-foreground">6 months</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Confidence: {Math.round(metric.projections.oneRM.confidence * 100)}%
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}