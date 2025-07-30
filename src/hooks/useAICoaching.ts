import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { InsightGenerator } from '@/lib/aiCoach/insightGenerator';
import { ReadinessAnalyzer } from '@/lib/aiCoach/readinessAnalyzer';
import { WorkoutModifier } from '@/lib/aiCoach/workoutModifier';
import type { CoachingInsight, DailyMetrics, RealTimeCoaching, UserLearningProfile } from '@/types/aiCoach';

export interface AICoachingState {
  insights: CoachingInsight[];
  currentCoaching: RealTimeCoaching | null;
  readinessScore: number;
  loading: boolean;
  error: string | null;
}

export const useAICoaching = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AICoachingState>({
    insights: [],
    currentCoaching: null,
    readinessScore: 0,
    loading: true,
    error: null
  });

  const fetchDailyMetrics = async (): Promise<DailyMetrics[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    if (error) throw error;
    
    // Map database fields to DailyMetrics interface
    return (data || []).map(row => ({
      id: row.id,
      date: row.date,
      sleep: row.sleep_hours || 0,
      energy: row.energy_level || 5,
      soreness: row.soreness_level || 1,
      stress: row.stress_level || 1,
      hrv: row.hrv_score,
      restingHR: row.resting_hr,
      notes: row.notes
    }));
  };

  const fetchWorkoutData = async (): Promise<any[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
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
      .limit(10);

    if (error) throw error;
    return data || [];
  };

  const generateCoachingInsights = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [dailyMetrics, workoutData] = await Promise.all([
        fetchDailyMetrics(),
        fetchWorkoutData()
      ]);

      // Analyze readiness
      const readinessAnalysis = ReadinessAnalyzer.analyzeReadiness(dailyMetrics);
      
      // Generate AI insights
      const defaultProfile: UserLearningProfile = {
        preferences: {
          coachingStyle: 'supportive',
          feedbackFrequency: 'moderate',
          insightComplexity: 'simple'
        },
        responsiveness: {},
        adaptations: {
          messageStyle: 'supportive',
          preferredMetrics: ['strength', 'endurance'],
          warningThresholds: {}
        }
      };

      const insights = InsightGenerator.generateInsights(
        readinessAnalysis,
        [], // patterns - to be implemented later
        dailyMetrics,
        defaultProfile,
        workoutData
      );

      // Store insights in database
      if (insights.length > 0) {
        const insightsToStore = insights.map(insight => ({
          user_id: user!.id,
          title: insight.title,
          description: insight.message,
          insight_type: insight.category,
          confidence_score: insight.confidence,
          data: insight.evidence || {},
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }));

        await supabase.from('ai_insights').insert(insightsToStore);
      }

      setState(prev => ({
        ...prev,
        insights,
        readinessScore: readinessAnalysis.overallScore,
        loading: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate insights',
        loading: false
      }));
    }
  };

  const generateWorkoutCoaching = async (workoutId: string) => {
    try {
      const [dailyMetrics, workoutData] = await Promise.all([
        fetchDailyMetrics(),
        fetchWorkoutData()
      ]);

      const readinessAnalysis = ReadinessAnalyzer.analyzeReadiness(dailyMetrics);
      
      const coaching = WorkoutModifier.provideRealTimeCoaching(
        1, // currentSet
        'Current Exercise', // exercise name
        undefined, // lastRPE
        undefined, // timeElapsed
        readinessAnalysis
      );

      setState(prev => ({ ...prev, currentCoaching: coaching }));
      return coaching;

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate coaching'
      }));
      return null;
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', insightId);

      setState(prev => ({
        ...prev,
        insights: prev.insights.filter(insight => insight.id !== insightId)
      }));
    } catch (error) {
      console.error('Failed to dismiss insight:', error);
    }
  };

  const requestGuidance = async (context: string) => {
    try {
      const [dailyMetrics, workoutData] = await Promise.all([
        fetchDailyMetrics(),
        fetchWorkoutData()
      ]);

      const defaultProfile: UserLearningProfile = {
        preferences: {
          coachingStyle: 'supportive',
          feedbackFrequency: 'moderate',
          insightComplexity: 'simple'
        },
        responsiveness: {},
        adaptations: {
          messageStyle: 'supportive',
          preferredMetrics: ['strength', 'endurance'],
          warningThresholds: {}
        }
      };

      const readinessAnalysis = ReadinessAnalyzer.analyzeReadiness(dailyMetrics);
      
      const guidance = InsightGenerator.generateInsights(
        readinessAnalysis,
        [], // patterns
        dailyMetrics,
        defaultProfile,
        workoutData
      );

      return guidance[0] || null;
    } catch (error) {
      console.error('Failed to request guidance:', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      generateCoachingInsights();
    }
  }, [user]);

  return {
    ...state,
    generateCoachingInsights,
    generateWorkoutCoaching,
    dismissInsight,
    requestGuidance,
    refreshInsights: generateCoachingInsights
  };
};