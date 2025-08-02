/**
 * ML Insights Dashboard Component
 * 
 * Displays comprehensive ML-powered insights including:
 * - Progress predictions and trends
 * - Injury risk assessment
 * - Optimal training windows
 * - Plateau detection and interventions
 * - Quick coaching recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown,
  Shield, 
  Clock, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Target,
  Brain,
  Calendar,
  Activity,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserMLInsights, getQuickInsights, getMLSystemStatus } from '@/services/mlService';
import type { MLInsights, MLSystemStatus } from '@/lib/ml';

interface QuickInsights {
  injuryRisk: { level: string; score: number };
  plateauRisk: { level: string; score: number };
  readinessScore: number;
  nextOptimalWorkout: string;
  recommendations: string[];
}

export function MLInsightsDashboard() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<MLInsights | null>(null);
  const [quickInsights, setQuickInsights] = useState<QuickInsights | null>(null);
  const [systemStatus, setSystemStatus] = useState<MLSystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchMLData = async (forceRefresh = false) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [mlInsights, quickData, status] = await Promise.all([
        getUserMLInsights(user.id, forceRefresh),
        getQuickInsights(user.id),
        getMLSystemStatus(forceRefresh)
      ]);

      setInsights(mlInsights);
      setQuickInsights(quickData);
      setSystemStatus(status);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch ML insights:', err);
      setError('Failed to load ML insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMLData();
  }, [user?.id]);

  const handleRefresh = () => {
    fetchMLData(true);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level.toLowerCase()) {
      case 'low': return 'outline';
      case 'moderate': return 'secondary';
      case 'high': return 'default';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  if (loading && !insights) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading ML insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Coaching Insights
          </h2>
          <p className="text-muted-foreground">
            ML-powered analysis of your training data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Overview Cards */}
      {quickInsights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Injury Risk</p>
                  <p className="text-2xl font-bold">{quickInsights.injuryRisk.score}%</p>
                </div>
                <Shield className={`h-8 w-8 ${getRiskLevelColor(quickInsights.injuryRisk.level)}`} />
              </div>
              <Badge variant={getRiskBadgeVariant(quickInsights.injuryRisk.level)} className="mt-2">
                {quickInsights.injuryRisk.level}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plateau Risk</p>
                  <p className="text-2xl font-bold">{quickInsights.plateauRisk.score}%</p>
                </div>
                <Target className={`h-8 w-8 ${getRiskLevelColor(quickInsights.plateauRisk.level)}`} />
              </div>
              <Badge variant={getRiskBadgeVariant(quickInsights.plateauRisk.level)} className="mt-2">
                {quickInsights.plateauRisk.level}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Readiness</p>
                  <p className="text-2xl font-bold">{quickInsights.readinessScore}%</p>
                </div>
                <Zap className={`h-8 w-8 ${getConfidenceColor(quickInsights.readinessScore / 100)}`} />
              </div>
              <Progress value={quickInsights.readinessScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Optimal Training</p>
                  <p className="text-2xl font-bold">{quickInsights.nextOptimalWorkout}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <Badge variant="outline" className="mt-2">
                Today
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Insights Tabs */}
      {insights && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="system">System Status</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Immediate Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Immediate Recommendations
                  <Badge variant="outline" className={getConfidenceColor(insights.confidence)}>
                    {Math.round(insights.confidence * 100)}% confidence
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.recommendations.immediate.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                  {insights.recommendations.immediate.length === 0 && (
                    <p className="text-muted-foreground">No immediate actions needed. Keep up the great work!</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Priority Alert */}
            {insights.recommendations.priority !== 'low' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Priority Level: {insights.recommendations.priority}</strong>
                  <br />
                  Your AI coach has detected patterns that require attention. Review the detailed insights below.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progress Predictions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Progress Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.progress.strengthPrediction && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Strength Gains</span>
                          <Badge variant="outline" className={getConfidenceColor(insights.progress.strengthPrediction.confidence)}>
                            {Math.round(insights.progress.strengthPrediction.confidence * 100)}%
                          </Badge>
                        </div>
                        <Progress value={insights.progress.strengthPrediction.confidence * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Expected improvement over next 3 months
                        </p>
                      </div>
                    )}
                    
                    {insights.progress.volumePrediction && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Volume Capacity</span>
                          <Badge variant="outline" className={getConfidenceColor(insights.progress.volumePrediction.confidence)}>
                            {Math.round(insights.progress.volumePrediction.confidence * 100)}%
                          </Badge>
                        </div>
                        <Progress value={insights.progress.volumePrediction.confidence * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Training volume progression potential
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Long-term Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Long-term Outlook
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.recommendations.longTerm.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Injury Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Injury Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getRiskLevelColor(insights.injuryRisk.riskLevel)}`}>
                        {insights.injuryRisk.overallRisk}%
                      </div>
                      <Badge variant={getRiskBadgeVariant(insights.injuryRisk.riskLevel)} className="mt-2">
                        {insights.injuryRisk.riskLevel} Risk
                      </Badge>
                    </div>
                    
                    {insights.injuryRisk.warnings.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Warnings:</h4>
                        {insights.injuryRisk.warnings.map((warning, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {insights.injuryRisk.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Recommendations:</h4>
                        {insights.injuryRisk.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Plateau Detection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Plateau Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getRiskLevelColor(insights.plateaus.risk > 60 ? 'high' : insights.plateaus.risk > 30 ? 'moderate' : 'low')}`}>
                        {insights.plateaus.risk}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Plateau Risk</p>
                    </div>
                    
                    {insights.plateaus.detected.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Detected Plateaus:</h4>
                        {insights.plateaus.detected.map((plateau, index) => (
                          <div key={index} className="p-2 bg-muted rounded text-sm">
                            {plateau.exercise || 'General training'}: {plateau.weeks || 'Unknown'} weeks
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {insights.plateaus.preventiveActions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Preventive Actions:</h4>
                        {insights.plateaus.preventiveActions.map((action, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            {/* Training Windows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Optimal Training Windows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {insights.trainingWindows.primary && (
                    <div>
                      <h4 className="font-medium mb-3">Primary Window</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Optimal Time</span>
                          <Badge variant="outline">
                            {insights.trainingWindows.primary.timeOfDay}:00 - {insights.trainingWindows.primary.timeOfDay + 2}:00
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Optimality Score</span>
                          <span className="font-medium">{insights.trainingWindows.primary.optimalityScore}%</span>
                        </div>
                        <Progress value={insights.trainingWindows.primary.optimalityScore} className="h-2" />
                        <div className="text-xs text-muted-foreground space-y-1">
                          {insights.trainingWindows.primary.reasoning?.map((reason, index) => (
                            <div key={index}>• {reason}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {insights.trainingWindows.personalizedFactors && (
                    <div>
                      <h4 className="font-medium mb-3">Personal Factors</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Chronotype</span>
                          <span className="capitalize">{insights.trainingWindows.personalizedFactors.chronotype}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Peak Performance</span>
                          <span>{insights.trainingWindows.personalizedFactors.peakPerformanceTime}:00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recovery Pattern</span>
                          <span className="capitalize">{insights.trainingWindows.personalizedFactors.recoveryPattern}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Short-term Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.recommendations.shortTerm.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            {systemStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    ML System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(systemStatus).map(([key, status]) => {
                      if (key === 'lastHealthCheck') return null;
                      
                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'operational': return 'text-green-600';
                          case 'degraded': return 'text-yellow-600';
                          case 'error': return 'text-red-600';
                          default: return 'text-gray-600';
                        }
                      };

                      const getStatusIcon = (status: string) => {
                        switch (status) {
                          case 'operational': return <CheckCircle className="h-4 w-4" />;
                          case 'degraded': return <AlertTriangle className="h-4 w-4" />;
                          case 'error': return <TrendingDown className="h-4 w-4" />;
                          default: return <Activity className="h-4 w-4" />;
                        }
                      };

                      return (
                        <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <div className={`flex items-center gap-2 ${getStatusColor(status as string)}`}>
                            {getStatusIcon(status as string)}
                            <span className="text-sm capitalize">{status as string}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Last health check: {new Date(systemStatus.lastHealthCheck).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default MLInsightsDashboard;