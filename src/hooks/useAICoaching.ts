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

export interface GuidanceRequest {
  context: string;
  options?: {
    workoutType?: string;
    currentExercise?: string;
    currentSet?: number;
    userQuestion?: string;
    urgency?: 'low' | 'medium' | 'high';
  };
}

export interface GuidanceResponse {
  id: string;
  context: string;
  timestamp: string;
  confidence: number;
  recommendations: string[];
  actionItems: string[];
  insights: string[];
  priority: 'low' | 'medium' | 'high';
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

  const requestGuidance = async (context: string, options?: {
    workoutType?: string;
    currentExercise?: string;
    currentSet?: number;
    userQuestion?: string;
    urgency?: 'low' | 'medium' | 'high';
  }) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setState(prev => ({ ...prev, loading: true }));

      // Gather comprehensive user context
      const userContext = await gatherUserContext();
      
      // Generate contextual guidance based on the situation
      const guidance = await generateContextualGuidance(context, userContext, options);
      
      setState(prev => ({ ...prev, loading: false }));
      
      return guidance;
    } catch (error) {
      console.error('Error requesting guidance:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: 'Failed to generate guidance. Please try again.'
      }));
      throw error;
    }
  };

  const gatherUserContext = async () => {
    const [readinessData, recentWorkouts, bodyMeasurements, dailyMetrics, goals] = await Promise.all([
      supabase
        .from('readiness_metrics')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .limit(7),
      supabase
        .from('workout_sessions')
        .select(`*, workout_session_exercises(*, exercises(*), sets(*))`)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .limit(5),
      supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .limit(7),
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active')
    ]);

    return {
      readiness: readinessData.data || [],
      workouts: recentWorkouts.data || [],
      measurements: bodyMeasurements.data || [],
      dailyMetrics: dailyMetrics.data || [],
      goals: goals.data || []
    };
  };

  const generateContextualGuidance = async (context: string, userContext: any, options?: any) => {
    const { readiness, workouts, measurements, dailyMetrics, goals } = userContext;
    
    // Calculate current readiness score
    const currentReadiness = readiness.length > 0 
      ? readiness[0].overall_readiness || 7
      : 7;
    
    // Get recent performance trends
    const avgReadiness = readiness.length > 0
      ? readiness.reduce((sum, r) => sum + (r.overall_readiness || 7), 0) / readiness.length
      : 7;
    
    const guidance = {
      id: `guidance-${Date.now()}`,
      context,
      timestamp: new Date().toISOString(),
      confidence: 0.8,
      recommendations: [] as string[],
      actionItems: [] as string[],
      insights: [] as string[],
      priority: options?.urgency || 'medium' as 'low' | 'medium' | 'high'
    };

    // Context-specific guidance generation
    switch (context) {
      case 'user_requested_general_guidance':
        return generateGeneralGuidance(guidance, userContext, currentReadiness, avgReadiness);
      
      case 'pre_workout_guidance':
        return generatePreWorkoutGuidance(guidance, userContext, currentReadiness, options);
      
      case 'during_workout_guidance':
        return generateDuringWorkoutGuidance(guidance, userContext, options);
      
      case 'post_workout_guidance':
        return generatePostWorkoutGuidance(guidance, userContext, workouts);
      
      case 'recovery_guidance':
        return generateRecoveryGuidance(guidance, userContext, currentReadiness, avgReadiness);
      
      case 'plateau_guidance':
        return generatePlateauGuidance(guidance, userContext, workouts);
      
      case 'nutrition_guidance':
        return generateNutritionGuidance(guidance, userContext, goals);
      
      case 'goal_adjustment_guidance':
        return generateGoalGuidance(guidance, userContext, goals);
      
      default:
        guidance.recommendations.push('I need more context about what you\'d like guidance on.');
        guidance.actionItems.push('Please specify your question or concern.');
        return guidance;
    }
  };

  const generateGeneralGuidance = (guidance: any, userContext: any, currentReadiness: number, avgReadiness: number) => {
    const { workouts, goals, measurements } = userContext;
    
    // Overall training status assessment
    if (avgReadiness < 6) {
      guidance.recommendations.push(
        'Your readiness levels suggest you need more recovery time.',
        'Consider reducing training intensity by 20-30% this week.',
        'Focus on sleep quality, nutrition, and stress management.'
      );
      guidance.actionItems.push(
        'Track your sleep for the next 3 days',
        'Plan 2-3 active recovery sessions this week',
        'Review your current training volume'
      );
      guidance.priority = 'high';
    } else if (avgReadiness > 8) {
      guidance.recommendations.push(
        'Your readiness levels are excellent - great time to push harder!',
        'Consider progressive overload in your next workouts.',
        'This is an optimal time for skill development or technique work.'
      );
      guidance.actionItems.push(
        'Plan a challenging workout for tomorrow',
        'Focus on form and technique improvements',
        'Consider adding complexity to current exercises'
      );
    } else {
      guidance.recommendations.push(
        'Your readiness levels are balanced - maintain your current approach.',
        'Continue with your planned training schedule.',
        'Monitor how you feel day-to-day and adjust accordingly.'
      );
    }
    
    // Workout consistency feedback
    if (workouts.length < 2) {
      guidance.insights.push('Consistency is key - try to maintain regular workout schedule.');
      guidance.actionItems.push('Schedule your next 3 workouts in advance');
    } else {
      guidance.insights.push(`Great consistency with ${workouts.length} recent workouts!`);
    }
    
    // Goal progress insights
    if (goals.length === 0) {
      guidance.recommendations.push('Setting specific goals can help focus your training.');
      guidance.actionItems.push('Create 1-2 SMART fitness goals in your profile');
    } else {
      guidance.insights.push(`You have ${goals.length} active goals - stay focused!`);
    }
    
    return guidance;
  };

  const generatePreWorkoutGuidance = (guidance: any, userContext: any, currentReadiness: number, options: any) => {
    const workoutType = options?.workoutType || 'general';
    
    if (currentReadiness < 6) {
      guidance.recommendations.push(
        'Your readiness is low - consider a lighter session today.',
        'Reduce intensity by 20-30% and focus on movement quality.',
        'Extended warm-up (10-15 minutes) will be beneficial.'
      );
      guidance.actionItems.push(
        'Start with 5 minutes of light cardio',
        'Add extra mobility work to your warm-up',
        'Reduce planned weights by 20-30%'
      );
      guidance.priority = 'high';
    } else if (currentReadiness > 8) {
      guidance.recommendations.push(
        'You\'re feeling great - perfect time for a challenging session!',
        'Consider adding intensity or volume to your planned workout.',
        'Focus on progressive overload today.'
      );
      guidance.actionItems.push(
        'Add 5-10% more weight than last session',
        'Consider an extra set on compound movements',
        'Focus on explosive concentric movements'
      );
    }
    
    // Workout-type specific advice
    if (workoutType === 'strength') {
      guidance.insights.push('Prime your nervous system with activation exercises.');
      guidance.actionItems.push('Include plyometric warm-up movements');
    } else if (workoutType === 'cardio') {
      guidance.insights.push('Gradually build heart rate during warm-up.');
      guidance.actionItems.push('Start at 60% max heart rate, build to 70%');
    }
    
    return guidance;
  };

  const generateDuringWorkoutGuidance = (guidance: any, userContext: any, options: any) => {
    const { currentExercise, currentSet } = options || {};
    
    guidance.recommendations.push(
      'Listen to your body and adjust intensity as needed.',
      'Maintain proper form over heavy weights.',
      'Stay hydrated and take adequate rest between sets.'
    );
    
    if (currentExercise) {
      guidance.insights.push(`Focus on quality reps for ${currentExercise}.`);
      
      if (currentSet && currentSet > 3) {
        guidance.recommendations.push('You\'re in the fatigue zone - prioritize form over speed.');
      }
    }
    
    guidance.actionItems.push(
      'Check your form in the mirror',
      'Take 2-3 deep breaths between exercises',
      'Rate your effort level (RPE) after each set'
    );
    
    return guidance;
  };

  const generatePostWorkoutGuidance = (guidance: any, userContext: any, workouts: any[]) => {
    guidance.recommendations.push(
      'Great job completing your workout!',
      'Cool down with 5-10 minutes of light stretching.',
      'Log your workout details while they\'re fresh in memory.'
    );
    
    guidance.actionItems.push(
      'Rate your workout intensity and RPE',
      'Note any exercises that felt particularly challenging',
      'Plan your recovery nutrition within 30 minutes',
      'Schedule tomorrow\'s activities based on today\'s effort'
    );
    
    guidance.insights.push(
      'Recovery starts immediately after your workout.',
      'Protein within 30 minutes helps muscle adaptation.',
      'Quality sleep tonight will maximize training adaptations.'
    );
    
    return guidance;
  };

  const generateRecoveryGuidance = (guidance: any, userContext: any, currentReadiness: number, avgReadiness: number) => {
    if (currentReadiness < 6 || avgReadiness < 6) {
      guidance.recommendations.push(
        'Prioritize recovery - your body needs time to adapt.',
        'Focus on sleep quality (7-9 hours) tonight.',
        'Consider active recovery like walking or gentle yoga.',
        'Manage stress through relaxation techniques.'
      );
      guidance.priority = 'high';
    } else {
      guidance.recommendations.push(
        'Your recovery appears to be on track.',
        'Maintain your current recovery practices.',
        'Consider adding recovery modalities like massage or sauna.'
      );
    }
    
    guidance.actionItems.push(
      'Track your sleep quality tonight',
      'Plan 20 minutes of relaxation time',
      'Stay hydrated throughout the day',
      'Eat nutrient-dense foods to support recovery'
    );
    
    return guidance;
  };

  const generatePlateauGuidance = (guidance: any, userContext: any, workouts: any[]) => {
    guidance.recommendations.push(
      'Plateaus are normal - your body has adapted to current training.',
      'Consider changing training variables: intensity, volume, or exercise selection.',
      'A deload week might help break through the plateau.',
      'Review your nutrition and recovery practices.'
    );
    
    guidance.actionItems.push(
      'Plan new exercise variations for next week',
      'Consider reverse periodization approach',
      'Schedule a deload week in the next 2 weeks',
      'Review and adjust your goal targets'
    );
    
    guidance.insights.push(
      'Plateaus often indicate you need a new stimulus.',
      'Sometimes progress means taking a step back to go forward.',
      'Your body may need time to catch up to your training.'
    );
    
    return guidance;
  };

  const generateNutritionGuidance = (guidance: any, userContext: any, goals: any[]) => {
    const hasWeightGoals = goals.some(g => g.category === 'weight_loss' || g.category === 'muscle_gain');
    
    guidance.recommendations.push(
      'Nutrition supports 70% of your results.',
      'Focus on whole foods and adequate protein intake.',
      'Time your nutrition around your workouts.'
    );
    
    if (hasWeightGoals) {
      const weightLossGoals = goals.filter(g => g.category === 'weight_loss');
      const muscleGainGoals = goals.filter(g => g.category === 'muscle_gain');
      
      if (weightLossGoals.length > 0) {
        guidance.recommendations.push(
          'For weight loss: maintain a moderate caloric deficit.',
          'Keep protein high (0.7-1g per lb body weight) to preserve muscle.'
        );
      }
      
      if (muscleGainGoals.length > 0) {
        guidance.recommendations.push(
          'For muscle gain: slight caloric surplus with adequate protein.',
          'Aim for 0.8-1.2g protein per lb body weight.'
        );
      }
    }
    
    guidance.actionItems.push(
      'Track your food intake for 3 days',
      'Plan your pre and post-workout nutrition',
      'Ensure you\'re getting enough vegetables and fiber',
      'Stay hydrated (half your body weight in ounces of water)'
    );
    
    return guidance;
  };

  const generateGoalGuidance = (guidance: any, userContext: any, goals: any[]) => {
    if (goals.length === 0) {
      guidance.recommendations.push(
        'Setting specific goals will help focus your training.',
        'Start with 1-2 SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound).',
        'Consider both performance and body composition goals.'
      );
      guidance.actionItems.push(
        'Create your first goal in the Goals section',
        'Choose a target date within 3-6 months',
        'Break down your main goal into smaller milestones'
      );
    } else {
      const overduedGoals = goals.filter(g => {
        if (!g.target_date) return false;
        return new Date(g.target_date) < new Date() && g.status !== 'completed';
      });
      
      if (overduedGoals.length > 0) {
        guidance.recommendations.push(
          'Some goals may need timeline adjustments.',
          'Consider if your targets are still realistic.',
          'Break down large goals into smaller, achievable steps.'
        );
        guidance.actionItems.push(
          'Review and update goal timelines',
          'Celebrate progress made so far',
          'Adjust targets if needed to maintain motivation'
        );
      } else {
        guidance.recommendations.push(
          'Your goals look well-structured - stay consistent!',
          'Regular progress tracking will keep you motivated.',
          'Consider adding process goals alongside outcome goals.'
        );
      }
    }
    
    return guidance;
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