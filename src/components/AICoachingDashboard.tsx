import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Activity,
  Lightbulb
} from 'lucide-react';
import { useEnhancedAICoaching } from '@/hooks/useEnhancedAICoaching';
import { AICoachPanel } from './AICoachPanel';
import { AIGuidancePanel } from './AIGuidancePanel';
import { cn } from '@/lib/utils';

export const AICoachingDashboard: React.FC = () => {
  const {
    insights,
    readinessAnalysis,
    performancePatterns,
    predictions,
    workoutModifications,
    loading,
    error,
    refreshAllAnalytics,
    dismissInsight
  } = useEnhancedAICoaching();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <h3 className="text-lg font-medium mb-2">Analysis Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refreshAllAnalytics}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getReadinessColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50 dark:bg-green-950/20';
    if (score >= 70) return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';
    if (score >= 55) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
    return 'text-red-600 bg-red-50 dark:bg-red-950/20';
  };

  const getTrendIcon = (direction: string) => {
    return direction === 'positive' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Coaching Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Personalized insights and recommendations based on your training data
          </p>
        </div>
        <Button onClick={refreshAllAnalytics} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Readiness Score</p>
                <p className="text-2xl font-bold">
                  {readinessAnalysis?.overallScore || 'N/A'}
                </p>
              </div>
              <div className={cn(
                "p-2 rounded-full",
                getReadinessColor(readinessAnalysis?.overallScore || 0)
              )}>
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Insights</p>
                <p className="text-2xl font-bold">{insights.length}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950/20">
                <Lightbulb className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Patterns Detected</p>
                <p className="text-2xl font-bold">{performancePatterns.length}</p>
              </div>
              <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-950/20">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Predictions</p>
                <p className="text-2xl font-bold">{predictions.length}</p>
              </div>
              <div className="p-2 rounded-full bg-green-50 dark:bg-green-950/20">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="guidance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="guidance">AI Guidance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="guidance" className="space-y-4">
          <AIGuidancePanel />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <AICoachPanel
            insights={insights}
            onDismissInsight={dismissInsight}
          />
        </TabsContent>

        <TabsContent value="readiness" className="space-y-4">
          {readinessAnalysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overall Readiness */}
              <Card className={cn("border-2", getReadinessColor(readinessAnalysis.overallScore))}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Overall Readiness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold mb-2">
                      {readinessAnalysis.overallScore}/100
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {readinessAnalysis.level}
                    </Badge>
                    <Progress 
                      value={readinessAnalysis.overallScore} 
                      className="mt-4 h-3" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Baseline: {readinessAnalysis.baseline}/100
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Deviation: {readinessAnalysis.deviation > 0 ? '+' : ''}{readinessAnalysis.deviation.toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {Math.round(readinessAnalysis.confidence * 100)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Readiness Factors */}
              <Card>
                <CardHeader>
                  <CardTitle>Readiness Factors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(readinessAnalysis.factors).map(([factor, data]) => (
                      <div key={factor} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {factor.replace('_', ' ')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{data.value}</span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                data.trend === 'improving' ? 'text-green-600' : 
                                data.trend === 'declining' ? 'text-red-600' : 'text-yellow-600'
                              )}
                            >
                              {data.trend}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={data.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {readinessAnalysis.recommendations.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {readinessAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No readiness data available</p>
                <p className="text-sm text-muted-foreground">
                  Log your daily readiness metrics to see personalized insights
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {performancePatterns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performancePatterns.map((pattern) => (
                <Card key={pattern.metric}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">
                        {pattern.metric.replace('_', ' ')}
                      </span>
                      {getTrendIcon(pattern.direction)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Trend:</span>
                        <Badge variant="outline" className="capitalize">
                          {pattern.trend}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Confidence:</span>
                        <span className="font-medium">
                          {Math.round(pattern.confidence * 100)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Significance:</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "capitalize",
                            pattern.significance === 'high' ? 'text-green-600' : 'text-yellow-600'
                          )}
                        >
                          {pattern.significance}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Data Points:</span>
                        <span className="font-medium">{pattern.dataPoints}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No performance patterns detected</p>
                <p className="text-sm text-muted-foreground">
                  Continue logging workouts to identify trends and patterns
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {predictions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictions.map((prediction) => (
                <Card key={prediction.metric}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {prediction.metric.split('_')[0]} Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {prediction.predictedValue}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Predicted in {prediction.timeframe} days
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Current:</span>
                          <span className="font-medium">{prediction.currentValue}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span>Confidence:</span>
                          <span className="font-medium">
                            {Math.round(prediction.confidence * 100)}%
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span>Methodology:</span>
                          <span className="text-xs text-muted-foreground text-right">
                            {prediction.methodology}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Factors: {prediction.factors.join(', ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No predictions available</p>
                <p className="text-sm text-muted-foreground">
                  Need more training data to generate accurate predictions
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Workout Modifications */}
      {workoutModifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Suggested Workout Modifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workoutModifications.map((mod, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium capitalize">
                        {mod.type} Modification
                      </h4>
                      <p className="text-sm text-muted-foreground">{mod.reason}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "capitalize",
                        mod.severity === 'major' ? 'text-red-600' :
                        mod.severity === 'moderate' ? 'text-yellow-600' : 'text-blue-600'
                      )}
                    >
                      {mod.severity}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Current</p>
                      <p className="text-sm">{JSON.stringify(mod.original)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Suggested</p>
                      <p className="text-sm">{JSON.stringify(mod.suggested)}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {mod.explanation}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Confidence: {Math.round(mod.confidence * 100)}%
                    </span>
                    <Button size="sm" variant="outline">
                      Apply Modification
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 