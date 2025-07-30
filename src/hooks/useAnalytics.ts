import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProgressAnalyzer } from '@/lib/analytics/progressAnalyzer';
import type { ProgressAnalysis } from '@/types/analytics';

export interface AnalyticsState {
  analysis: ProgressAnalysis | null;
  loading: boolean;
  error: string | null;
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AnalyticsState>({
    analysis: null,
    loading: true,
    error: null
  });

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Fetch workout sessions with exercises and sets
      const { data: workoutSessions, error: workoutError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          workout_session_exercises (
            *,
            exercises (*),
            sets (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (workoutError) throw workoutError;

      // Fetch daily metrics
      const { data: dailyMetrics, error: metricsError } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(90);

      if (metricsError) throw metricsError;

      // Fetch performance metrics
      const { data: performanceMetrics, error: perfError } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(200);

      if (perfError) throw perfError;

      // Fetch readiness metrics
      const { data: readinessMetrics, error: readinessError } = await supabase
        .from('readiness_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(90);

      if (readinessError) throw readinessError;

      // Convert data to PerformanceMetric format
      const performanceData = convertToPerformanceMetrics(
        workoutSessions || [],
        performanceMetrics || []
      );

      // Analyze progress using the collected data
      const analysis = ProgressAnalyzer.analyzeProgress(performanceData, 90);

      setState({
        analysis,
        loading: false,
        error: null
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics data',
        loading: false
      }));
    }
  };

  const refreshAnalytics = () => {
    fetchUserData();
  };

  // Convert workout sessions to performance metrics
  const convertToPerformanceMetrics = (workoutSessions: any[], performanceMetrics: any[]) => {
    const converted = [];
    
    // Convert workout sessions
    for (const session of workoutSessions) {
      if (session.workout_session_exercises) {
        for (const sessionExercise of session.workout_session_exercises) {
          if (sessionExercise.sets && sessionExercise.exercises) {
            for (const set of sessionExercise.sets) {
              if (set.weight && set.reps) {
                const oneRM = set.weight * (1 + set.reps / 30); // Epley formula
                converted.push({
                  date: session.created_at.split('T')[0],
                  exercise: sessionExercise.exercises.name,
                  weight: set.weight,
                  reps: set.reps,
                  sets: 1,
                  rpe: set.rpe || 7,
                  volume: set.weight * set.reps,
                  oneRM,
                  intensity: (set.weight / oneRM) * 100
                });
              }
            }
          }
        }
      }
    }
    
    // Add stored performance metrics
    for (const metric of performanceMetrics) {
      converted.push({
        date: metric.date,
        exercise: metric.exercise_id, // This might need to be resolved to exercise name
        weight: 0,
        reps: 0,
        sets: 1,
        rpe: 7,
        volume: metric.value,
        oneRM: metric.value,
        intensity: 80
      });
    }
    
    return converted;
  };

  // Calculate specific metrics
  const getWorkoutFrequency = () => {
    if (!state.analysis) return 0;
    return state.analysis.trends.length || 0;
  };

  const getOverallProgress = () => {
    if (!state.analysis) return 0;
    return state.analysis.overallScore || 0;
  };

  const getTrendingMetrics = () => {
    if (!state.analysis) return [];
    return state.analysis.trends || [];
  };

  const getRecentAchievements = () => {
    if (!state.analysis) return [];
    return state.analysis.achievements || [];
  };

  const getKeyRecommendations = () => {
    if (!state.analysis) return [];
    return state.analysis.recommendations || [];
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  return {
    ...state,
    refreshAnalytics,
    getWorkoutFrequency,
    getOverallProgress,
    getTrendingMetrics,
    getRecentAchievements,
    getKeyRecommendations
  };
};