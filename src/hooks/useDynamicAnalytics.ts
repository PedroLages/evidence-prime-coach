import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DynamicAnalyticsService, 
  WorkoutStatistics, 
  ExercisePerformance, 
  ProgressOverview 
} from '@/services/dynamicAnalytics';

interface UseDynamicAnalyticsReturn {
  workoutStatistics: WorkoutStatistics | null;
  exercisePerformance: ExercisePerformance[];
  progressOverview: ProgressOverview | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDynamicAnalytics(): UseDynamicAnalyticsReturn {
  const { user } = useAuth();
  const [workoutStatistics, setWorkoutStatistics] = useState<WorkoutStatistics | null>(null);
  const [exercisePerformance, setExercisePerformance] = useState<ExercisePerformance[]>([]);
  const [progressOverview, setProgressOverview] = useState<ProgressOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    } else {
      setWorkoutStatistics(null);
      setExercisePerformance([]);
      setProgressOverview(null);
      setLoading(false);
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const [statistics, performance, overview] = await Promise.all([
        DynamicAnalyticsService.getWorkoutStatistics(user.id),
        DynamicAnalyticsService.getExercisePerformance(user.id),
        DynamicAnalyticsService.getProgressOverview(user.id)
      ]);

      setWorkoutStatistics(statistics);
      setExercisePerformance(performance);
      setProgressOverview(overview);
    } catch (err) {
      console.error('Error loading dynamic analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  return {
    workoutStatistics,
    exercisePerformance,
    progressOverview,
    loading,
    error,
    refetch: loadAnalytics
  };
}