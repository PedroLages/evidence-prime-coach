import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Calendar, Zap } from 'lucide-react';
import { ProgressAnalysis, TrendAnalysis } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface AnalyticsOverviewProps {
  analysis: ProgressAnalysis;
  className?: string;
}

export function AnalyticsOverview({ analysis, className }: AnalyticsOverviewProps) {
  const getTrendIcon = (direction: TrendAnalysis['direction']) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTrendColor = (direction: TrendAnalysis['direction']) => {
    switch (direction) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'declining':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const improvingTrends = analysis.trends.filter(t => t.direction === 'improving').length;
  const decliningTrends = analysis.trends.filter(t => t.direction === 'declining').length;
  const stableTrends = analysis.trends.filter(t => t.direction === 'stable').length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Score */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress Score</span>
              <span className={cn("text-2xl font-bold", getScoreColor(analysis.overallScore))}>
                {Math.round(analysis.overallScore)}%
              </span>
            </div>
            <Progress value={analysis.overallScore} className="h-3" />
            
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-lg font-bold">{improvingTrends}</span>
                </div>
                <p className="text-xs text-muted-foreground">Improving</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-600">
                  <Minus className="h-4 w-4" />
                  <span className="text-lg font-bold">{stableTrends}</span>
                </div>
                <p className="text-xs text-muted-foreground">Stable</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-red-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-lg font-bold">{decliningTrends}</span>
                </div>
                <p className="text-xs text-muted-foreground">Declining</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Trends */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Exercise Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.trends.slice(0, 6).map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getTrendIcon(trend.direction)}
                  <div>
                    <h4 className="font-medium text-sm">{trend.exercise}</h4>
                    <p className="text-xs text-muted-foreground">
                      {trend.dataPoints} sessions • {trend.timeframe}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getTrendColor(trend.direction))}
                  >
                    {trend.direction}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(trend.confidence * 100)}% confidence
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {analysis.achievements.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.achievements.slice(0, 4).map((achievement, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Trophy className={cn(
                      "h-4 w-4",
                      achievement.rarity === 'legendary' ? 'text-yellow-500' :
                      achievement.rarity === 'rare' ? 'text-purple-500' : 'text-blue-500'
                    )} />
                    <div>
                      <h4 className="font-medium text-sm">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge 
                      variant={achievement.rarity === 'legendary' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {achievement.rarity}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(achievement.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Key Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                    <Badge 
                      variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Expected: {rec.expectedOutcome}</span>
                    <span className="text-muted-foreground">{rec.timeframe}</span>
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