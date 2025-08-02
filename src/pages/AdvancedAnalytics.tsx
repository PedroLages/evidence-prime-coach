import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Brain, 
  Target, 
  AlertTriangle, 
  Calendar,
  BarChart3,
  Activity,
  Zap,
  Award,
  Users,
  Download,
  RefreshCw,
  Eye,
  Lightbulb,
  Scale,
  Timer,
  TrendingDown,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PredictiveModelingEngine } from '@/lib/analytics/predictiveModeling';
import { ComparativeAnalyticsEngine } from '@/lib/analytics/comparativeAnalytics';
import { MLInsightsEngine } from '@/lib/analytics/mlInsights';
import { AdvancedReportingService } from '@/services/advancedReporting';
import type { AdvancedReport } from '@/services/advancedReporting';
import type { TrainingPattern, AnomalyDetection, AdaptiveRecommendation } from '@/lib/analytics/mlInsights';
import type { CompetitiveAnalysis } from '@/lib/analytics/comparativeAnalytics';
import type { PredictionModel, InjuryRiskAssessment, WeightLossPrediction } from '@/lib/analytics/predictiveModeling';

interface AnalyticsState {
  report: AdvancedReport | null;
  patterns: TrainingPattern[];
  anomalies: AnomalyDetection[];
  recommendations: AdaptiveRecommendation[];
  competitiveAnalysis: CompetitiveAnalysis | null;
  predictions: PredictionModel[];
  injuryRisk: InjuryRiskAssessment | null;
  weightLossPrediction: WeightLossPrediction | null;
  peakWindows: any[];
  loading: boolean;
  error: string | null;
}

export default function AdvancedAnalytics() {
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('90');
  const [selectedReportType, setSelectedReportType] = useState('comprehensive');
  const [analyticsState, setAnalyticsState] = useState<AnalyticsState>({
    report: null,
    patterns: [],
    anomalies: [],
    recommendations: [],
    competitiveAnalysis: null,
    predictions: [],
    injuryRisk: null,
    weightLossPrediction: null,
    peakWindows: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (user) {
      loadAdvancedAnalytics();
    }
  }, [user, selectedTimeframe]);

  const loadAdvancedAnalytics = async () => {
    if (!user) return;

    try {
      setAnalyticsState(prev => ({ ...prev, loading: true, error: null }));

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedTimeframe));

      const config = {
        userId: user.id,
        reportType: selectedReportType as any,
        timeframe: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        includeCharts: true,
        includePredictions: true,
        includeComparisons: true
      };

      // Generate comprehensive report
      const report = await AdvancedReportingService.generateAdvancedReport(config);

      // Generate mock weight loss prediction
      const weightLossPrediction: WeightLossPrediction = {
        currentWeight: 75,
        targetWeight: 70,
        predictedLossRate: 0.4,
        estimatedCompletion: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        milestones: [
          { date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), weight: 73, percentage: 40 },
          { date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), weight: 71.5, percentage: 70 },
          { date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), weight: 70, percentage: 100 }
        ],
        plateauRisk: {
          probability: 0.25,
          estimatedDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          preventionStrategies: [
            'Increase cardio intensity by 10%',
            'Add one extra training session per week',
            'Consider carb cycling approach'
          ]
        },
        metabolicAdaptation: {
          currentBMR: 1680,
          predictedBMR: 1620,
          adaptationPercentage: -3.6
        },
        sustainabilityScore: 87,
        recommendations: {
          calorieAdjustments: ['Reduce daily intake by 50 calories in week 6', 'Consider refeed day every 14 days'],
          exerciseModifications: ['Add 2 HIIT sessions per week', 'Increase strength training volume'],
          timingOptimizations: ['Train in morning for better fat oxidation', 'Time carbs around workouts']
        }
      };

      // Generate mock peak performance windows
      const peakWindows = [
        {
          exercise: 'Bench Press',
          nextPeakDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          peakProbability: 0.85,
          currentValue: 185,
          predictedPeak: 195,
          daysUntilPeak: 14,
          preparationPhase: {
            startTaper: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            peakIntensity: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
            restDay: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString()
          }
        },
        {
          exercise: 'Squat',
          nextPeakDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          peakProbability: 0.78,
          currentValue: 225,
          predictedPeak: 240,
          daysUntilPeak: 21,
          preparationPhase: {
            startTaper: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(),
            peakIntensity: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000).toISOString(),
            restDay: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      ];

      setAnalyticsState({
        report,
        patterns: [], // Would be populated from ML analysis
        anomalies: [], // Would be populated from anomaly detection
        recommendations: [], // Would be populated from adaptive recommendations
        competitiveAnalysis: report.sections.comparisons.competitiveAnalysis,
        predictions: report.sections.predictions.models,
        injuryRisk: report.sections.predictions.injuryRisk,
        weightLossPrediction,
        peakWindows,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error loading advanced analytics:', error);
      setAnalyticsState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to load analytics data' 
      }));
    }
  };

  const handleExportReport = async (format: 'json' | 'csv' | 'pdf') => {
    if (!analyticsState.report) return;

    try {
      const blob = await AdvancedReportingService.exportReport(analyticsState.report, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (analyticsState.loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Generating advanced analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (analyticsState.error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>{analyticsState.error}</p>
              <Button onClick={loadAdvancedAnalytics} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { report, competitiveAnalysis, predictions, injuryRisk } = analyticsState;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights and predictive analytics for your training
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
              <SelectItem value="180">6 Months</SelectItem>
              <SelectItem value="365">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAdvancedAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                  <p className="text-2xl font-bold">{Math.round(report.summary.overallScore)}%</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <Progress value={report.summary.overallScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confidence Level</p>
                  <p className="text-2xl font-bold">{report.metadata.confidenceLevel}%</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <Progress value={report.metadata.confidenceLevel} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data Points</p>
                  <p className="text-2xl font-bold">{report.metadata.dataPoints}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
                  <p className="text-2xl font-bold capitalize">
                    {injuryRisk?.riskLevel || 'Low'}
                  </p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${
                  injuryRisk?.riskLevel === 'high' || injuryRisk?.riskLevel === 'critical' 
                    ? 'text-red-600' 
                    : injuryRisk?.riskLevel === 'moderate' 
                    ? 'text-yellow-600' 
                    : 'text-green-600'
                }`} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="weight-loss">Weight Loss</TabsTrigger>
          <TabsTrigger value="peak-windows">Peak Windows</TabsTrigger>
          <TabsTrigger value="comparisons">Rankings</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="recommendations">AI Coach</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {report && (
            <>
              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.summary.keyInsights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Key Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.sections.performance.keyMetrics.map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{metric.metric}</h4>
                          <p className="text-2xl font-bold">{typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'secondary'}>
                            {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            Rank: {metric.rank}th percentile
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Factors */}
              {report.summary.riskFactors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.summary.riskFactors.map((risk, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-800">{risk}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          {/* Injury Risk Assessment */}
          {injuryRisk && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Injury Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Risk Level</span>
                      <Badge variant={
                        injuryRisk.riskLevel === 'critical' ? 'destructive' :
                        injuryRisk.riskLevel === 'high' ? 'destructive' :
                        injuryRisk.riskLevel === 'moderate' ? 'secondary' : 'default'
                      }>
                        {injuryRisk.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <Progress value={injuryRisk.riskScore} className="mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Risk Score: {Math.round(injuryRisk.riskScore)}/100
                    </p>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Risk Factors:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Training Load: {Math.round(injuryRisk.factors.trainingLoad)}</div>
                        <div>Volume Increase: {Math.round(injuryRisk.factors.volumeIncrease)}</div>
                        <div>Intensity Spike: {Math.round(injuryRisk.factors.intensitySpike)}</div>
                        <div>Recovery: {Math.round(injuryRisk.factors.recoveryTime)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Recommendations:</h4>
                    <div className="space-y-2">
                      {injuryRisk.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-foreground">{rec}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm">
                        <strong>Recommended deload in:</strong> {injuryRisk.timeToRecommendedDeload} days
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Predictions */}
          {predictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictions.slice(0, 3).map((model, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{model.name}</h4>
                        <Badge variant="outline">
                          R² = {(model.rSquared * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">1 Week</p>
                          <p className="font-medium">{model.predictions.oneWeek.value.toFixed(1)} lbs</p>
                          <p className="text-xs text-muted-foreground">
                            {(model.predictions.oneWeek.confidence * 100).toFixed(0)}% confidence
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">1 Month</p>
                          <p className="font-medium">{model.predictions.oneMonth.value.toFixed(1)} lbs</p>
                          <p className="text-xs text-muted-foreground">
                            {(model.predictions.oneMonth.confidence * 100).toFixed(0)}% confidence
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">3 Months</p>
                          <p className="font-medium">{model.predictions.threeMonths.value.toFixed(1)} lbs</p>
                          <p className="text-xs text-muted-foreground">
                            {(model.predictions.threeMonths.confidence * 100).toFixed(0)}% confidence
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">6 Months</p>
                          <p className="font-medium">{model.predictions.sixMonths.value.toFixed(1)} lbs</p>
                          <p className="text-xs text-muted-foreground">
                            {(model.predictions.sixMonths.confidence * 100).toFixed(0)}% confidence
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparisons" className="space-y-6">
          {competitiveAnalysis && (
            <>
              {/* Overall Ranking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Overall Ranking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {Math.round(competitiveAnalysis.overallRank.percentile)}th
                      </div>
                      <p className="text-sm text-muted-foreground">Percentile</p>
                      <Badge className="mt-2">
                        {competitiveAnalysis.overallRank.description}
                      </Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Strongest Lifts:</h4>
                      <div className="space-y-1">
                        {competitiveAnalysis.overallRank.strongestLifts.map((lift, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-sm">{lift}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Areas for Growth:</h4>
                      <div className="space-y-1">
                        {competitiveAnalysis.overallRank.weakestLifts.map((lift, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                            <span className="text-sm">{lift}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exercise Rankings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Exercise Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {competitiveAnalysis.exerciseRankings.map((ranking, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{ranking.exercise}</h4>
                          <p className="text-sm text-muted-foreground">
                            Current: {ranking.currentValue} lbs | PR: {ranking.personalBest} lbs
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {Math.round(ranking.percentileRank)}th
                          </div>
                          <p className="text-sm text-muted-foreground">percentile</p>
                          <Badge variant={
                            ranking.progressVelocity.relativePace === 'faster' ? 'default' :
                            ranking.progressVelocity.relativePace === 'slower' ? 'destructive' : 'secondary'
                          }>
                            {ranking.progressVelocity.relativePace} pace
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Improvement Opportunities */}
              {competitiveAnalysis.improvementOpportunities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Improvement Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {competitiveAnalysis.improvementOpportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{opportunity.exercise}</h4>
                            <p className="text-sm text-muted-foreground">
                              Current: {Math.round(opportunity.currentPercentile)}th percentile
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              +{opportunity.potentialGain.toFixed(1)} lbs
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {Math.round(opportunity.timeToAchieve)} days
                            </p>
                            <Badge variant={
                              opportunity.difficulty === 'easy' ? 'default' :
                              opportunity.difficulty === 'moderate' ? 'secondary' : 'destructive'
                            }>
                              {opportunity.difficulty}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="weight-loss" className="space-y-6">
          {analyticsState.weightLossPrediction && (
            <>
              {/* Weight Loss Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Weight Loss Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {analyticsState.weightLossPrediction.currentWeight}kg
                      </div>
                      <p className="text-sm text-muted-foreground">Current Weight</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {analyticsState.weightLossPrediction.targetWeight}kg
                      </div>
                      <p className="text-sm text-muted-foreground">Target Weight</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {analyticsState.weightLossPrediction.predictedLossRate}kg/wk
                      </div>
                      <p className="text-sm text-muted-foreground">Predicted Rate</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progress to Goal</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(((analyticsState.weightLossPrediction.currentWeight - analyticsState.weightLossPrediction.targetWeight) / (analyticsState.weightLossPrediction.currentWeight - analyticsState.weightLossPrediction.targetWeight)) * 100)}% Complete
                      </span>
                    </div>
                    <Progress value={20} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Estimated completion: {new Date(analyticsState.weightLossPrediction.estimatedCompletion).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Weight Loss Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsState.weightLossPrediction.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{milestone.weight}kg</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(milestone.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {milestone.percentage}%
                          </div>
                          <p className="text-sm text-muted-foreground">Complete</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Metabolic Adaptation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Metabolic Adaptation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">BMR Changes</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Current BMR:</span>
                          <span className="font-medium">{analyticsState.weightLossPrediction.metabolicAdaptation.currentBMR} cal/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Predicted BMR:</span>
                          <span className="font-medium">{analyticsState.weightLossPrediction.metabolicAdaptation.predictedBMR} cal/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Adaptation:</span>
                          <span className={`font-medium ${analyticsState.weightLossPrediction.metabolicAdaptation.adaptationPercentage < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {analyticsState.weightLossPrediction.metabolicAdaptation.adaptationPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Sustainability Score</h4>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-2">
                          {analyticsState.weightLossPrediction.sustainabilityScore}%
                        </div>
                        <Progress value={analyticsState.weightLossPrediction.sustainabilityScore} className="h-3" />
                        <p className="text-sm text-muted-foreground mt-2">
                          {analyticsState.weightLossPrediction.sustainabilityScore > 80 ? 'Highly Sustainable' :
                           analyticsState.weightLossPrediction.sustainabilityScore > 60 ? 'Moderately Sustainable' : 'Low Sustainability'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plateau Risk */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Plateau Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-yellow-600 mb-2">
                          {Math.round(analyticsState.weightLossPrediction.plateauRisk.probability * 100)}%
                        </div>
                        <p className="text-sm text-muted-foreground">Plateau Risk</p>
                        {analyticsState.weightLossPrediction.plateauRisk.estimatedDate && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Estimated: {new Date(analyticsState.weightLossPrediction.plateauRisk.estimatedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Prevention Strategies:</h4>
                      <div className="space-y-2">
                        {analyticsState.weightLossPrediction.plateauRisk.preventionStrategies.map((strategy, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm">{strategy}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="peak-windows" className="space-y-6">
          {analyticsState.peakWindows.length > 0 && (
            <>
              {/* Peak Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analyticsState.peakWindows.map((window, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Timer className="h-5 w-5" />
                        {window.exercise} Peak Window
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Countdown */}
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                          <div className="text-3xl font-bold text-primary mb-2">
                            {window.daysUntilPeak}
                          </div>
                          <p className="text-sm text-muted-foreground">Days Until Peak</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(window.nextPeakDate).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Current vs Predicted */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-xl font-bold">{window.currentValue} lbs</div>
                            <p className="text-sm text-muted-foreground">Current Max</p>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-green-600">{window.predictedPeak} lbs</div>
                            <p className="text-sm text-muted-foreground">Predicted Peak</p>
                          </div>
                        </div>

                        {/* Probability */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Success Probability</span>
                            <span className="font-medium">{Math.round(window.peakProbability * 100)}%</span>
                          </div>
                          <Progress value={window.peakProbability * 100} className="h-2" />
                        </div>

                        {/* Preparation Timeline */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Preparation Timeline:</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span>Start Taper: {new Date(window.preparationPhase.startTaper).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-orange-600" />
                              <span>Peak Intensity: {new Date(window.preparationPhase.peakIntensity).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-green-600" />
                              <span>Rest Day: {new Date(window.preparationPhase.restDay).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button className="w-full" variant="outline">
                          Schedule Peak Attempt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Peak Performance Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Peak Performance Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Preparation Tips:</h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">Gradually reduce training volume by 20-30%</span>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">Maintain intensity at 90-95% of current max</span>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">Ensure 48-72 hours complete rest before attempt</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Success Factors:</h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">Optimal sleep: 7-9 hours for 3 nights prior</span>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">Nutrition: High carb meal 3-4 hours before</span>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">Timing: Schedule during your natural peak hours</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Pattern Analysis</h3>
                <p className="text-muted-foreground mb-4">
                  Advanced pattern recognition and ML insights will appear here as you build more training history.
                </p>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {report && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.summary.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-1">Recommendation {index + 1}</p>
                        <p className="text-sm text-muted-foreground">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('json')}
                  className="h-20 flex-col"
                >
                  <Download className="h-6 w-6 mb-2" />
                  JSON Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('csv')}
                  className="h-20 flex-col"
                >
                  <Download className="h-6 w-6 mb-2" />
                  CSV Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('pdf')}
                  className="h-20 flex-col"
                >
                  <Download className="h-6 w-6 mb-2" />
                  PDF Report
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Report Information</h4>
                {report && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Generated: {new Date(report.generatedAt).toLocaleDateString()}</p>
                    <p>Version: {report.metadata.version}</p>
                    <p>Data Points: {report.metadata.dataPoints}</p>
                    <p>Confidence: {report.metadata.confidenceLevel}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}