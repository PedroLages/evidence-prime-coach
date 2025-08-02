/**
 * ML Service Integration Layer
 * 
 * This service provides a clean interface between the frontend and ML systems.
 * It handles data transformation, caching, and error recovery.
 */

import { mlOrchestrator, MLInsights, MLSystemStatus } from '@/lib/ml';
import { supabase } from '@/integrations/supabase/client';
import { DailyMetrics } from '@/types/aiCoach';
import { WorkoutSessionWithExercises, Exercise, getWorkoutSessionsWithExercises, getDailyMetrics } from '@/services/database';

// ===== CACHE INTERFACE =====

interface MLCache {
  insights: Map<string, { data: MLInsights; timestamp: number }>;
  systemStatus: { data: MLSystemStatus; timestamp: number } | null;
}

// Simple in-memory cache (in production, consider Redis or similar)
const cache: MLCache = {
  insights: new Map(),
  systemStatus: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const INSIGHTS_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for insights

// ===== PUBLIC API =====

/**
 * Get comprehensive ML insights for a user
 */
export async function getUserMLInsights(userId: string, forceRefresh = false): Promise<MLInsights> {
  console.log(`🔍 Getting ML insights for user: ${userId}`);
  
  // Check cache first
  if (!forceRefresh) {
    const cached = cache.insights.get(userId);
    if (cached && Date.now() - cached.timestamp < INSIGHTS_CACHE_DURATION) {
      console.log('📦 Returning cached ML insights');
      return cached.data;
    }
  }

  try {
    // Fetch required data
    const [workouts, dailyMetrics, exercises] = await Promise.all([
      fetchUserWorkouts(userId),
      fetchUserDailyMetrics(userId),
      fetchAvailableExercises()
    ]);

    console.log(`📊 Fetched data: ${workouts.length} workouts, ${dailyMetrics.length} metrics, ${exercises.length} exercises`);

    // Run ML analysis
    const insights = await mlOrchestrator.analyzeUser(userId, workouts, dailyMetrics, exercises);

    // Cache the results
    cache.insights.set(userId, {
      data: insights,
      timestamp: Date.now()
    });

    console.log('✅ ML insights generated and cached');
    return insights;

  } catch (error) {
    console.error('❌ Failed to get ML insights:', error);
    
    // Return cached data if available, otherwise return defaults
    const cached = cache.insights.get(userId);
    if (cached) {
      console.log('🔄 Returning stale cached data due to error');
      return cached.data;
    }

    // Return default insights as fallback
    return getDefaultInsights(userId);
  }
}

/**
 * Generate AI-powered workout
 */
export async function generateAIWorkout(
  userId: string,
  workoutType: 'strength' | 'hypertrophy' | 'power' | 'endurance' | 'recovery',
  targetDuration: number,
  availableEquipment: string[],
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
  preferences?: {
    workoutName?: string;
    targetMuscleGroups?: string[];
    excludeExercises?: string[];
    intensityPreference?: 'low' | 'moderate' | 'high';
  }
): Promise<any> {
  console.log(`🏋️ Generating AI workout for user: ${userId}, type: ${workoutType}`);

  try {
    // Fetch required data
    const [dailyMetrics, workoutHistory, exercises] = await Promise.all([
      fetchUserDailyMetrics(userId, 7), // Last 7 days
      fetchUserWorkouts(userId, 30), // Last 30 days
      fetchAvailableExercises()
    ]);

    // Get current readiness
    const insights = await getUserMLInsights(userId);
    const currentReadiness = insights.injuryRisk.overallRisk < 50 ? 
      100 - insights.injuryRisk.overallRisk : 
      50; // Simple readiness calculation

    // Create workout request
    const request = {
      userId,
      workoutType,
      targetDuration,
      availableEquipment,
      fitnessLevel,
      currentReadiness,
      targetMuscleGroups: preferences?.targetMuscleGroups,
      excludeExercises: preferences?.excludeExercises,
      preferences: {
        intensityPreference: preferences?.intensityPreference || 'moderate',
        volumePreference: 'moderate' as const,
        exerciseVariety: 'moderate' as const
      }
    };

    // Generate workout
    const workout = await mlOrchestrator.generateWorkout(
      request,
      exercises,
      dailyMetrics,
      workoutHistory
    );

    // Apply custom workout name if provided
    if (preferences?.workoutName && preferences.workoutName.trim()) {
      workout.name = preferences.workoutName.trim();
    }

    console.log('✅ AI workout generated successfully');
    return workout;

  } catch (error) {
    console.error('❌ Failed to generate AI workout:', error);
    throw new Error(`Failed to generate workout: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get ML system health status
 */
export async function getMLSystemStatus(forceRefresh = false): Promise<MLSystemStatus> {
  console.log('🔍 Checking ML system status');

  // Check cache first
  if (!forceRefresh && cache.systemStatus) {
    if (Date.now() - cache.systemStatus.timestamp < CACHE_DURATION) {
      console.log('📦 Returning cached system status');
      return cache.systemStatus.data;
    }
  }

  try {
    const status = await mlOrchestrator.healthCheck();
    
    // Cache the results
    cache.systemStatus = {
      data: status,
      timestamp: Date.now()
    };

    console.log('✅ ML system status checked and cached');
    return status;

  } catch (error) {
    console.error('❌ Failed to check ML system status:', error);
    
    // Return cached data if available
    if (cache.systemStatus) {
      console.log('🔄 Returning stale cached status due to error');
      return cache.systemStatus.data;
    }

    // Return degraded status as fallback
    return {
      progress: 'error',
      injuryRisk: 'error',
      trainingWindows: 'error',
      plateauDetection: 'error',
      workoutGeneration: 'error',
      lastHealthCheck: new Date().toISOString()
    };
  }
}

/**
 * Get quick insights summary (for dashboard widgets)
 */
export async function getQuickInsights(userId: string): Promise<{
  injuryRisk: { level: string; score: number };
  plateauRisk: { level: string; score: number };
  readinessScore: number;
  nextOptimalWorkout: string;
  recommendations: string[];
}> {
  try {
    const insights = await getUserMLInsights(userId);
    
    return {
      injuryRisk: {
        level: insights.injuryRisk.riskLevel,
        score: insights.injuryRisk.overallRisk
      },
      plateauRisk: {
        level: insights.plateaus.risk > 60 ? 'high' : insights.plateaus.risk > 30 ? 'moderate' : 'low',
        score: insights.plateaus.risk
      },
      readinessScore: Math.max(0, 100 - insights.injuryRisk.overallRisk),
      nextOptimalWorkout: insights.trainingWindows.primary ? 
        `${insights.trainingWindows.primary.timeOfDay}:00` : 
        '18:00',
      recommendations: insights.recommendations.immediate.slice(0, 3)
    };

  } catch (error) {
    console.error('❌ Failed to get quick insights:', error);
    
    return {
      injuryRisk: { level: 'low', score: 25 },
      plateauRisk: { level: 'low', score: 20 },
      readinessScore: 70,
      nextOptimalWorkout: '18:00',
      recommendations: ['Start tracking daily metrics for personalized insights']
    };
  }
}

/**
 * Clear ML cache for a user (useful after significant data updates)
 */
export function clearMLCache(userId?: string): void {
  if (userId) {
    cache.insights.delete(userId);
    console.log(`🗑️ Cleared ML cache for user: ${userId}`);
  } else {
    cache.insights.clear();
    cache.systemStatus = null;
    console.log('🗑️ Cleared all ML cache');
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): {
  insightsCacheSize: number;
  hasSystemStatusCache: boolean;
  oldestInsightCache: number | null;
  newestInsightCache: number | null;
} {
  const timestamps = Array.from(cache.insights.values()).map(item => item.timestamp);
  
  return {
    insightsCacheSize: cache.insights.size,
    hasSystemStatusCache: cache.systemStatus !== null,
    oldestInsightCache: timestamps.length > 0 ? Math.min(...timestamps) : null,
    newestInsightCache: timestamps.length > 0 ? Math.max(...timestamps) : null
  };
}

// ===== PRIVATE HELPER FUNCTIONS =====

async function fetchUserWorkouts(userId: string, limit = 50): Promise<WorkoutSessionWithExercises[]> {
  try {
    const workouts = await getWorkoutSessionsWithExercises(userId, limit);
    return workouts || [];
  } catch (error) {
    console.error('Error fetching user workouts:', error);
    return [];
  }
}

async function fetchUserDailyMetrics(userId: string, days = 30): Promise<DailyMetrics[]> {
  try {
    const metrics = await getDailyMetrics(userId, days);
    
    // Transform database format to ML format
    return metrics.map(metric => ({
      id: metric.id,
      date: metric.date,
      sleep: metric.sleep_hours || 8,
      energy: metric.energy_level || 7,
      soreness: metric.soreness_level || 3,
      stress: metric.stress_level || 3,
      hrv: metric.hrv_score || undefined,
      restingHR: metric.resting_hr || undefined,
      bodyWeight: undefined, // Would need to fetch from body measurements
      notes: metric.notes || undefined
    }));
  } catch (error) {
    console.error('Error fetching daily metrics:', error);
    return [];
  }
}

async function fetchAvailableExercises(): Promise<Exercise[]> {
  try {
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('*')
      .limit(100); // Limit for performance

    if (error) throw error;

    // Transform database format to ML format
    return exercises?.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category as 'compound' | 'isolation' | 'cardio',
      muscle_groups: exercise.muscle_groups || [],
      equipment: exercise.equipment || [],
      instructions: exercise.instructions || '',
      difficulty_level: exercise.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
      video_url: exercise.video_url,
      image_url: exercise.image_url
    })) || [];
  } catch (error) {
    console.error('Error fetching exercises:', error);
    
    // Return minimal exercise set as fallback
    return [
      {
        id: 'pushup',
        name: 'Push Up',
        category: 'compound',
        muscle_groups: ['chest', 'triceps', 'shoulders'],
        equipment: ['bodyweight'],
        instructions: 'Start in plank position, lower to chest, push up.',
        difficulty_level: 'beginner'
      },
      {
        id: 'squat',
        name: 'Bodyweight Squat',
        category: 'compound',
        muscle_groups: ['quads', 'glutes'],
        equipment: ['bodyweight'],
        instructions: 'Stand with feet shoulder-width apart, squat down, stand up.',
        difficulty_level: 'beginner'
      }
    ];
  }
}

function getDefaultInsights(userId: string): MLInsights {
  return {
    userId,
    progress: {
      confidence: 0.3
    },
    injuryRisk: {
      overallRisk: 25,
      riskLevel: 'low',
      warnings: [],
      recommendations: []
    },
    trainingWindows: {
      primary: {
        timeOfDay: 18,
        dayOfWeek: 2,
        optimalityScore: 70,
        confidence: 0.5,
        duration: 60,
        reasoning: ['Default evening window for general population']
      },
      avoid: [],
      personalizedFactors: {
        chronotype: 'neutral',
        optimalSleepWindow: { bedtime: 22, wakeup: 6 },
        peakPerformanceTime: 18,
        recoveryPattern: 'moderate'
      }
    },
    plateaus: {
      detected: [],
      risk: 20,
      preventiveActions: []
    },
    recommendations: {
      immediate: ['Start tracking daily metrics for personalized insights'],
      shortTerm: ['Maintain consistent training schedule'],
      longTerm: ['Focus on progressive overload'],
      priority: 'low'
    },
    confidence: 0.3,
    lastAnalyzed: new Date().toISOString()
  };
}