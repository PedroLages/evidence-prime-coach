import { TrendingUp, TrendingDown, Minus, Activity, Moon, Zap, Dumbbell, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ReadinessAnalysis } from '@/types/aiCoach';
import { cn } from '@/lib/utils';

interface ReadinessInsightProps {
  analysis: ReadinessAnalysis;
  className?: string;
  showDetails?: boolean;
}

export function ReadinessInsight({ analysis, className, showDetails = true }: ReadinessInsightProps) {
  const { overallScore, level, factors, deviation, confidence } = analysis;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-muted-foreground bg-muted border-muted';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getFactorIcon = (factor: string) => {
    switch (factor) {
      case 'sleep':
        return <Moon className="h-4 w-4" />;
      case 'energy':
        return <Zap className="h-4 w-4" />;
      case 'soreness':
        return <Dumbbell className="h-4 w-4" />;
      case 'stress':
        return <Brain className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getFactorName = (factor: string) => {
    switch (factor) {
      case 'sleep':
        return 'Sleep Quality';
      case 'energy':
        return 'Energy Level';
      case 'soreness':
        return 'Muscle Recovery';
      case 'stress':
        return 'Stress Level';
      case 'hrv':
        return 'Heart Rate Variability';
      default:
        return factor.charAt(0).toUpperCase() + factor.slice(1);
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Readiness Analysis
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border", getLevelColor(level))}>
              {level.toUpperCase()}
            </Badge>
            <span className={cn("text-2xl font-bold", getScoreColor(overallScore))}>
              {overallScore}
            </span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Readiness</span>
            <span className="font-medium">{overallScore}/100</span>
          </div>
          <Progress value={overallScore} className="h-2" />
        </div>

        {/* Deviation from Baseline */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <span className="text-sm text-muted-foreground">Baseline Comparison</span>
          <div className="flex items-center gap-2">
            {deviation > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : deviation < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={cn(
              "font-medium",
              deviation > 0 ? "text-green-600" : deviation < 0 ? "text-red-600" : "text-muted-foreground"
            )}>
              {deviation > 0 ? '+' : ''}{deviation} points
            </span>
          </div>
        </div>

        {/* Individual Factors */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Factor Breakdown</h4>
            {Object.entries(factors).map(([key, factor]) => {
              if (!factor) return null;
              
              return (
                <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2 flex-1">
                    {getFactorIcon(key)}
                    <span className="text-sm font-medium">{getFactorName(key)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getTrendIcon(factor.trend)}
                    <span className="text-sm text-muted-foreground w-12">
                      {factor.value}{key === 'sleep' ? 'h' : key === 'hrv' ? 'ms' : '/10'}
                    </span>
                    <div className="w-16">
                      <Progress value={factor.score} className="h-1.5" />
                    </div>
                    <span className={cn("text-xs font-medium w-8", getScoreColor(factor.score))}>
                      {Math.round(factor.score)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Top Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Top Recommendations</h4>
            <div className="space-y-2">
              {analysis.recommendations.slice(0, 3).map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-primary/5 rounded-lg border-l-2 border-primary">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Indicator */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">Analysis Confidence</span>
          <div className="flex items-center gap-2">
            <Progress value={confidence * 100} className="w-16 h-1.5" />
            <span className="text-xs font-medium">{Math.round(confidence * 100)}%</span>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(analysis.lastUpdated).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}