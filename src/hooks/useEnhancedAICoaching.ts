import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DataAnalyzer } from '@/lib/aiCoach/dataAnalyzer';
import type {
  CoachingInsight,
  PerformancePattern,
  ReadinessAnalysis,
  WorkoutModification,
  ProgressPrediction,
} from '@/types/aiCoach';

export interface EnhancedCoachingState {
  insights: CoachingInsight[];
  readinessAnalysis: ReadinessAnalysis | null;
  performancePatterns: PerformancePattern[];
  predictions: ProgressPrediction[];
  workoutModifications: WorkoutModification[];
  loading: boolean;
  error: string | null;
}

export const useEnhancedAICoaching = () => {
  const { user } = useAuth();
  const [state, setState] = useState<EnhancedCoachingState>({
    insights: [],
    readinessAnalysis: null,
    performancePatterns: [],
    predictions: [],
    workoutModifications: [],
    loading: true,
    error: null,
  });

  const analyzeReadiness =
    useCallback(async (): Promise<ReadinessAnalysis | null> => {
      if (!user) return null;

      try {
        // Fetch recent readiness metrics
        const { data: metrics } = await supabase
          .from('readiness_metrics')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(14);

        if (!metrics || metrics.length === 0) return null;

        // Convert to DailyMetrics format
        const dailyMetrics = metrics.map((m) => ({
          id: m.id,
          date: m.date,
          sleep: m.sleep_hours || 0,
          energy: m.energy_level || 0,
          soreness: m.soreness_level || 0,
          stress: m.stress_level || 0,
          hrv: m.hrv_score || undefined,
          restingHR: m.resting_hr || undefined,
          bodyWeight: undefined,
          notes: m.notes || undefined,
        }));

        // Analyze readiness factors
        const factors = DataAnalyzer.analyzeReadinessFactors(dailyMetrics);

        // Calculate overall readiness score
        const overallScore = Object.values(factors).reduce((total, factor) => {
          return total + factor.score * factor.weight;
        }, 0);

        // Determine readiness level
        let level: 'poor' | 'fair' | 'good' | 'excellent';
        if (overallScore >= 85) level = 'excellent';
        else if (overallScore >= 70) level = 'good';
        else if (overallScore >= 55) level = 'fair';
        else level = 'poor';

        // Generate recommendations
        const recommendations: string[] = [];
        if (factors.sleep.score < 60) {
          recommendations.push('Focus on improving sleep quality and duration');
        }
        if (factors.energy.score < 60) {
          recommendations.push(
            'Consider reducing training intensity or adding recovery days'
          );
        }
        if (factors.soreness.score < 60) {
          recommendations.push(
            'Incorporate more recovery activities and mobility work'
          );
        }
        if (factors.stress.score < 60) {
          recommendations.push('Implement stress management techniques');
        }

        return {
          overallScore: Math.round(overallScore * 10) / 10,
          level,
          factors,
          recommendations,
          confidence: 0.8,
          baseline: 75, // This would be calculated from historical data
          deviation: overallScore - 75,
          lastUpdated: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Error analyzing readiness:', error);
        return null;
      }
    }, [user]);

  const detectPerformancePatterns = useCallback(async (): Promise<
    PerformancePattern[]
  > => {
    if (!user) return [];

    try {
      // Fetch recent workout data
      const { data: workouts } = await supabase
        .from('workout_sessions')
        .select(
          `
          *,
          workout_session_exercises(
            *,
            exercises(*),
            sets(*)
          )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!workouts) return [];

      const patterns: PerformancePattern[] = [];

      // Analyze volume trends
      const volumeData = workouts
        .filter((w) => w.total_volume)
        .map((w) => w.total_volume!)
        .reverse();

      if (volumeData.length >= 7) {
        const volumeTrend = DataAnalyzer.analyzeTrend(volumeData, 7);
        patterns.push({
          metric: 'workout_volume',
          trend: volumeTrend.trend,
          direction: volumeTrend.direction,
          confidence: volumeTrend.confidence,
          timeframe: 7,
          significance: volumeTrend.confidence > 0.7 ? 'high' : 'medium',
          dataPoints: volumeData.length,
        });
      }

      // Analyze frequency trends
      const frequencyData = workouts
        .map((w) => new Date(w.created_at).getTime())
        .sort((a, b) => a - b);

      if (frequencyData.length >= 7) {
        // Calculate days between workouts
        const daysBetween: number[] = [];
        for (let i = 1; i < frequencyData.length; i++) {
          const days =
            (frequencyData[i] - frequencyData[i - 1]) / (1000 * 60 * 60 * 24);
          daysBetween.push(days);
        }

        if (daysBetween.length >= 5) {
          const frequencyTrend = DataAnalyzer.analyzeTrend(daysBetween, 5);
          patterns.push({
            metric: 'workout_frequency',
            trend: frequencyTrend.trend,
            direction: frequencyTrend.direction,
            confidence: frequencyTrend.confidence,
            timeframe: 5,
            significance: frequencyTrend.confidence > 0.7 ? 'high' : 'medium',
            dataPoints: daysBetween.length,
          });
        }
      }

      return patterns;
    } catch (error) {
      console.error('Error detecting performance patterns:', error);
      return [];
    }
  }, [user]);

  const generatePredictions = useCallback(async (): Promise<
    ProgressPrediction[]
  > => {
    if (!user) return [];

    try {
      // Fetch exercise-specific performance data
      const { data: exerciseData } = await supabase
        .from('workout_session_exercises')
        .select(
          `
          *,
          exercises(name),
          sets(weight, reps)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!exerciseData) return [];

      const predictions: ProgressPrediction[] = [];

      // Group by exercise
      const exerciseGroups = exerciseData.reduce((acc, item) => {
        const exerciseName = item.exercises?.name || 'Unknown';
        if (!acc[exerciseName]) {
          acc[exerciseName] = [];
        }
        acc[exerciseName].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      // Generate predictions for each exercise
      Object.entries(exerciseGroups).forEach(([exerciseName, data]) => {
        if (data.length < 5) return; // Need minimum data points

        // Calculate estimated 1RM progression
        const oneRMData = data
          .filter((item) => item.sets && item.sets.length > 0)
          .map((item) => {
            const maxSet = item.sets.reduce((max, set) => {
              const estimated1RM = set.weight * (1 + set.reps / 30); // Brzycki formula
              return estimated1RM > max ? estimated1RM : max;
            }, 0);
            return maxSet;
          })
          .filter((oneRM) => oneRM > 0)
          .reverse();

        if (oneRMData.length >= 5) {
          const trend = DataAnalyzer.analyzeTrend(oneRMData, 5);
          const current1RM = oneRMData[oneRMData.length - 1];
          const predictedGain = trend.slope * 30; // 30 days projection

          predictions.push({
            metric: `${exerciseName}_1RM`,
            currentValue: Math.round(current1RM),
            predictedValue: Math.round(current1RM + predictedGain),
            timeframe: 30,
            confidence: trend.confidence,
            factors: ['training_consistency', 'progressive_overload'],
            methodology: 'Linear regression on estimated 1RM progression',
          });
        }
      });

      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      return [];
    }
  }, [user]);

  const generateWorkoutModifications = useCallback(async (): Promise<
    WorkoutModification[]
  > => {
    if (!user) return [];

    try {
      const readinessAnalysis = await analyzeReadiness();
      const patterns = await detectPerformancePatterns();

      const modifications: WorkoutModification[] = [];

      // Readiness-based modifications
      if (readinessAnalysis) {
        if (readinessAnalysis.overallScore < 60) {
          modifications.push({
            type: 'intensity',
            severity: 'moderate',
            reason: 'Low readiness score detected',
            original: { intensity: 'normal' },
            suggested: { intensity: 'reduced' },
            confidence: 0.8,
            explanation:
              'Reduce training intensity by 20-30% to allow for better recovery',
          });
        }

        if (readinessAnalysis.factors.soreness.score < 50) {
          modifications.push({
            type: 'exercise',
            severity: 'minor',
            reason: 'High muscle soreness detected',
            original: { focus: 'strength' },
            suggested: { focus: 'mobility_recovery' },
            confidence: 0.7,
            explanation:
              'Consider adding mobility work and foam rolling to your routine',
          });
        }
      }

      // Pattern-based modifications
      const volumePattern = patterns.find((p) => p.metric === 'workout_volume');
      if (volumePattern && volumePattern.trend === 'decreasing') {
        modifications.push({
          type: 'volume',
          severity: 'minor',
          reason: 'Declining workout volume detected',
          original: { volume: 'current' },
          suggested: { volume: 'increased' },
          confidence: 0.6,
          explanation: 'Gradually increase workout volume to maintain progress',
        });
      }

      return modifications;
    } catch (error) {
      console.error('Error generating workout modifications:', error);
      return [];
    }
  }, [user, analyzeReadiness, detectPerformancePatterns]);

  const refreshAllAnalytics = useCallback(async () => {
    if (!user) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [
        readinessAnalysis,
        performancePatterns,
        predictions,
        workoutModifications,
      ] = await Promise.all([
        analyzeReadiness(),
        detectPerformancePatterns(),
        generatePredictions(),
        generateWorkoutModifications(),
      ]);

      // Generate insights from all analyses
      const insights: CoachingInsight[] = [];

      // Readiness insights
      if (readinessAnalysis) {
        if (readinessAnalysis.overallScore < 60) {
          insights.push({
            id: `readiness-low-${Date.now()}`,
            type: 'recovery',
            priority: 'high',
            title: 'Low Readiness Detected',
            message: `Your readiness score (${readinessAnalysis.overallScore}/100) suggests you need more recovery. Consider reducing training intensity.`,
            evidence: [
              `Readiness score: ${readinessAnalysis.overallScore}/100`,
            ],
            timestamp: new Date().toISOString(),
            confidence: 0.8,
            category: 'warning',
          });
        }
      }

      // Performance pattern insights
      performancePatterns.forEach((pattern) => {
        if (pattern.significance === 'high') {
          insights.push({
            id: `pattern-${pattern.metric}-${Date.now()}`,
            type: 'progress',
            priority: pattern.direction === 'negative' ? 'medium' : 'low',
            title: `${pattern.metric.replace('_', ' ').toUpperCase()} Trend`,
            message: `Your ${pattern.metric.replace('_', ' ')} is ${
              pattern.trend
            }. ${
              pattern.direction === 'positive'
                ? 'Great work!'
                : 'Consider adjusting your approach.'
            }`,
            evidence: [
              `Trend: ${pattern.trend}`,
              `Confidence: ${Math.round(pattern.confidence * 100)}%`,
            ],
            timestamp: new Date().toISOString(),
            confidence: pattern.confidence,
            category:
              pattern.direction === 'positive' ? 'celebration' : 'suggestion',
          });
        }
      });

      // Prediction insights
      predictions.forEach((prediction) => {
        if (prediction.confidence > 0.7) {
          insights.push({
            id: `prediction-${prediction.metric}-${Date.now()}`,
            type: 'progress',
            priority: 'low',
            title: 'Progress Prediction',
            message: `You're on track to reach ${prediction.predictedValue} ${
              prediction.metric.split('_')[1]
            } in ${prediction.timeframe} days.`,
            evidence: [
              `Current: ${prediction.currentValue}`,
              `Predicted: ${prediction.predictedValue}`,
            ],
            timestamp: new Date().toISOString(),
            confidence: prediction.confidence,
            category: 'information',
          });
        }
      });

      setState({
        insights: insights.slice(0, 5), // Limit to 5 most important insights
        readinessAnalysis,
        performancePatterns,
        predictions,
        workoutModifications,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to analyze training data',
        loading: false,
      }));
    }
  }, [
    user,
    analyzeReadiness,
    detectPerformancePatterns,
    generatePredictions,
    generateWorkoutModifications,
  ]);

  const dismissInsight = useCallback((insightId: string) => {
    setState((prev) => ({
      ...prev,
      insights: prev.insights.filter((insight) => insight.id !== insightId),
    }));
  }, []);

  useEffect(() => {
    if (user) {
      refreshAllAnalytics();
    }
  }, [user, refreshAllAnalytics]);

  return {
    ...state,
    refreshAllAnalytics,
    dismissInsight,
  };
};
