import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Calendar, 
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';
import { AnalyticsOverview } from '@/components/AnalyticsOverview';
import { PerformanceChart } from '@/components/PerformanceChart';
import { ProgressPatternCard } from '@/components/ProgressPatternCard';
import { AutoProgressionCard } from '@/components/AutoProgressionCard';
import { PlateauAlert } from '@/components/PlateauAlert';
import { WorkoutModificationAlert } from '@/components/WorkoutModificationAlert';
import { useToast } from '@/hooks/use-toast';

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState<number>(90);
  const [progressPeriod, setProgressPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const mockAnalysis = {
    overallScore: 78,
    trends: [
      {
        exercise: 'Bench Press',
        direction: 'improving' as const,
        slope: 2.5,
        confidence: 0.85,
        dataPoints: 12,
        timeframe: '6 weeks',
        projectedGains: { oneWeek: 185, oneMonth: 195, threeMonths: 210 }
      },
      {
        exercise: 'Squat',
        direction: 'stable' as const,
        slope: 0.3,
        confidence: 0.72,
        dataPoints: 15,
        timeframe: '8 weeks',
        projectedGains: { oneWeek: 225, oneMonth: 230, threeMonths: 240 }
      },
      {
        exercise: 'Deadlift',
        direction: 'declining' as const,
        slope: -1.2,
        confidence: 0.79,
        dataPoints: 10,
        timeframe: '5 weeks',
        projectedGains: { oneWeek: 265, oneMonth: 260, threeMonths: 250 }
      }
    ],
    achievements: [
      {
        id: 'pr-bench-2024',
        type: 'pr' as const,
        title: 'New Bench Press PR',
        description: 'Hit a new personal record of 185lbs',
        date: '2024-01-20',
        exercise: 'Bench Press',
        value: 185,
        unit: 'lbs',
        rarity: 'rare' as const
      }
    ],
    recommendations: [
      {
        id: 'deadlift-plateau',
        category: 'strength' as const,
        priority: 'high' as const,
        title: 'Address declining deadlift performance',
        description: 'Your deadlift has been declining for 5 weeks',
        action: 'Consider form check or program variation',
        expectedOutcome: 'Restore upward progress trend',
        timeframe: '2-3 weeks',
        confidence: 0.79
      }
    ],
    comparisons: [],
    projections: []
  };

  const mockMetrics = [
    {
      date: '2024-01-15',
      exercise: 'Bench Press',
      weight: 175,
      reps: 5,
      sets: 3,
      rpe: 8,
      volume: 2625,
      oneRM: 185,
      intensity: 85
    },
    {
      date: '2024-01-17',
      exercise: 'Squat',
      weight: 205,
      reps: 5,
      sets: 3,
      rpe: 8.5,
      volume: 3075,
      oneRM: 225,
      intensity: 87
    }
  ];

  const mockProgressionMetrics = [
    {
      exercise: 'Bench Press',
      period: 'month' as const,
      metrics: {
        oneRMProgress: {
          start: 175,
          current: 185,
          change: 10,
          changePercent: 5.7
        },
        volumeProgress: {
          start: 2400,
          current: 2625,
          change: 225,
          changePercent: 9.4
        },
        consistencyScore: 0.87,
        plateauCount: 0,
        deloadCount: 0,
        prCount: 2,
        averageRPE: 8.2,
        progressionRate: 2.5
      },
      projections: {
        oneRM: {
          oneMonth: 190,
          threeMonths: 200,
          sixMonths: 210,
          confidence: 0.82
        },
        milestones: [
          {
            target: 200,
            estimatedDate: '2024-03-15',
            probability: 0.85
          },
          {
            target: 225,
            estimatedDate: '2024-06-15',
            probability: 0.72
          }
        ]
      }
    }
  ];

  const mockProgressionSuggestions = [
    {
      id: 'bench-increase-1',
      exercise: 'Bench Press',
      type: 'weight_increase' as const,
      current: {
        weight: 175,
        reps: 5,
        sets: 3,
        rpe: 7.5
      },
      suggested: {
        weight: 180,
        reps: 5,
        sets: 3,
        reasoning: 'Based on consistent RPE <8 performance'
      },
      confidence: 0.85,
      reasoning: 'You\'ve been hitting your target RPE consistently with room to spare',
      evidence: [
        'Last 3 sessions completed at RPE 7-7.5',
        'Strong bar speed on recent sets',
        'No technical breakdown observed'
      ],
      timeframe: 'next_session' as const,
      priority: 'medium' as const,
      lastPerformance: [
        {
          date: '2024-01-20',
          weight: 175,
          reps: 5,
          rpe: 7.5,
          completed: true
        }
      ]
    }
  ];

  const mockPlateauAnalysis = {
    exercise: 'Deadlift',
    isDetected: true,
    duration: 4,
    severity: 'moderate' as const,
    type: 'weight_stall' as const,
    confidence: 0.78,
    trend: {
      direction: 'stable' as const,
      significance: 0.85,
      dataPoints: 8
    },
    recommendations: [
      {
        type: 'deload' as const,
        description: 'Implement a deload week',
        implementation: 'Reduce weight by 10% for 1 week, maintain reps and sets',
        expectedDuration: 1,
        successMetrics: ['Return to previous weights', 'Improved bar speed', 'Lower RPE']
      }
    ],
    nextReviewDate: '2024-02-01'
  };

  const mockWorkoutModifications = [
    {
      type: 'intensity' as const,
      severity: 'moderate' as const,
      reason: 'High fatigue detected',
      explanation: 'Your recent RPE scores suggest you might benefit from a slight intensity reduction to optimize recovery.',
      original: { intensity: '85%', rpe: 8.5 },
      suggested: { intensity: '80%', rpe: 7.5 },
      confidence: 0.75
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
    toast({
      title: "Analytics Updated",
      description: "Latest performance data has been analyzed.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your analytics report will be downloaded shortly.",
    });
  };

  const handleAcceptSuggestion = (suggestion: any) => {
    toast({
      title: "Suggestion Applied",
      description: `${suggestion.exercise} progression updated.`,
    });
  };

  const handleModifySuggestion = (suggestion: any) => {
    toast({
      title: "Modify Suggestion",
      description: "Opening suggestion editor...",
    });
  };

  const handleRejectSuggestion = (suggestion: any) => {
    toast({
      title: "Suggestion Rejected",
      description: `${suggestion.exercise} suggestion dismissed.`,
    });
  };

  const handleAcceptRecommendation = (recommendation: any) => {
    toast({
      title: "Recommendation Applied",
      description: recommendation.description,
    });
  };

  const handleDismissAlert = () => {
    toast({
      title: "Alert Dismissed",
      description: "Plateau alert has been dismissed.",
    });
  };

  const handleAcceptModification = (modification: any) => {
    toast({
      title: "Modification Applied",
      description: "Workout intensity has been adjusted.",
    });
  };

  const handleDismissModification = (modification: any) => {
    toast({
      title: "Modification Dismissed",
      description: "Workout modification suggestion dismissed.",
    });
  };

  const handleModifyModification = (modification: any) => {
    toast({
      title: "Modify Suggestion",
      description: "Opening modification editor...",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your training progress
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeframe.toString()} onValueChange={(value) => setTimeframe(Number(value))}>
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
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        <PlateauAlert
          analysis={mockPlateauAnalysis}
          onAcceptRecommendation={handleAcceptRecommendation}
          onDismiss={handleDismissAlert}
        />
        
        <WorkoutModificationAlert
          modifications={mockWorkoutModifications}
          onAccept={handleAcceptModification}
          onDismiss={handleDismissModification}
          onModify={handleModifyModification}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="progression" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Progression
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Patterns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnalyticsOverview analysis={mockAnalysis} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceChart
            metrics={mockMetrics}
            trends={mockAnalysis.trends}
          />
        </TabsContent>

        <TabsContent value="progression" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AutoProgressionCard
              suggestions={mockProgressionSuggestions}
              onAcceptSuggestion={handleAcceptSuggestion}
              onModifySuggestion={handleModifySuggestion}
              onRejectSuggestion={handleRejectSuggestion}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Progression Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Aggressiveness</label>
                    <Select defaultValue="moderate">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Plateau Sensitivity</label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target RPE</label>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">Strength</div>
                      <div className="text-muted-foreground">8-9 RPE</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">Hypertrophy</div>
                      <div className="text-muted-foreground">7-8 RPE</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">Technique</div>
                      <div className="text-muted-foreground">6-7 RPE</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <ProgressPatternCard
            metrics={mockProgressionMetrics}
            period={progressPeriod}
            onPeriodChange={setProgressPeriod}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}