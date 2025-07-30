import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { CoachingInsight } from '@/types/aiCoach';

export interface AICoachingState {
  insights: CoachingInsight[];
  loading: boolean;
  error: string | null;
  currentCoaching: any | null;
  readinessScore: number;
}

export const useAICoaching = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AICoachingState>({
    insights: [],
    loading: true,
    error: null,
    currentCoaching: null,
    readinessScore: 0
  });

  const generateInsights = async (): Promise<CoachingInsight[]> => {
    if (!user) return [];

    const insights: CoachingInsight[] = [];

    try {
      // Fetch readiness metrics
      const { data: readinessData } = await supabase
        .from('readiness_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(7);

      // Generate readiness-based insights
      if (readinessData && readinessData.length > 0) {
        const avgReadiness = readinessData.reduce((sum, r) => sum + (r.overall_readiness || 5), 0) / readinessData.length;
        
        if (avgReadiness < 6) {
          insights.push({
            id: `readiness-low-${Date.now()}`,
            type: 'recovery',
            priority: 'high',
            title: 'Low Readiness Detected',
            message: `Your average readiness (${avgReadiness.toFixed(1)}/10) suggests you need more recovery. Consider reducing training intensity.`,
            evidence: [`Average readiness: ${avgReadiness.toFixed(1)}/10`],
            timestamp: new Date().toISOString(),
            confidence: 0.8,
            category: 'warning'
          });
        } else if (avgReadiness > 8) {
          insights.push({
            id: `readiness-high-${Date.now()}`,
            type: 'progress',
            priority: 'medium',
            title: 'Excellent Readiness',
            message: `Your readiness levels (${avgReadiness.toFixed(1)}/10) are excellent! Perfect time for intense training.`,
            evidence: [`Average readiness: ${avgReadiness.toFixed(1)}/10`],
            timestamp: new Date().toISOString(),
            confidence: 0.9,
            category: 'celebration'
          });
        }
      }

      // Fetch recent workouts for plateau detection
      const { data: workouts } = await supabase
        .from('workout_sessions')
        .select(`*, workout_session_exercises(*, exercises(*), sets(*))`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (workouts && workouts.length > 0) {
        insights.push({
          id: `workout-progress-${Date.now()}`,
          type: 'progress',
          priority: 'low',
          title: 'Training Consistency',
          message: `Great job staying consistent! You've completed ${workouts.length} workouts recently.`,
          evidence: [`${workouts.length} recent workouts`],
          timestamp: new Date().toISOString(),
          confidence: 0.7,
          category: 'celebration'
        });
      }

    } catch (error) {
      console.error('Error generating insights:', error);
    }

    return insights.slice(0, 3);
  };

  const refreshInsights = async () => {
    if (!user) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const insights = await generateInsights();
      setState({ 
        insights, 
        loading: false, 
        error: null, 
        currentCoaching: null, 
        readinessScore: 7 
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch AI insights',
        loading: false
      }));
    }
  };

  const dismissInsight = (insightId: string) => {
    setState(prev => ({
      ...prev,
      insights: prev.insights.map(insight =>
        insight.id === insightId ? { ...insight, dismissed: true } : insight
      )
    }));
  };

  const requestGuidance = async (context: string) => {
    // Placeholder implementation
    return null;
  };

  useEffect(() => {
    if (user) {
      refreshInsights();
    }
  }, [user]);

  return {
    ...state,
    refreshInsights,
    dismissInsight,
    requestGuidance
  };
};