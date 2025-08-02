/**
 * AI Coaching Service
 * 
 * Provides real-time coaching suggestions during workouts based on
 * performance data, readiness scores, and AI workout context.
 */

interface CoachingSuggestion {
  id: string;
  type: 'weight' | 'rest' | 'form' | 'motivation' | 'recovery' | 'intensity' | 'phase_transition';
  message: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    value: any;
  };
  reasoning: string;
  metadata?: {
    exerciseSpecific?: boolean;
    phaseSpecific?: boolean;
    readinessAdjusted?: boolean;
  };
}

interface WorkoutContext {
  currentExercise: string;
  currentSet: number;
  totalSets: number;
  lastSetData?: {
    weight: number;
    reps: number;
    rpe: number;
  };
  readinessScore: number;
  workoutProgress: number;
  isAIGenerated?: boolean;
  workoutType?: string;
  targetIntensity?: number;
  currentPhase?: 'warmup' | 'main' | 'cooldown';
  estimatedDuration?: number;
  aiMetadata?: {
    confidence_score?: number;
    reasoning?: string;
    adaptations?: {
      readinessAdjustments?: string[];
      equipmentSubstitutions?: string[];
      progressiveOverload?: string[];
    };
  };
}

export class AICoachingService {
  private static instance: AICoachingService;
  private suggestionHistory: Map<string, CoachingSuggestion[]> = new Map();

  static getInstance(): AICoachingService {
    if (!AICoachingService.instance) {
      AICoachingService.instance = new AICoachingService();
    }
    return AICoachingService.instance;
  }

  /**
   * Generate real-time coaching suggestions based on workout context
   */
  async generateSuggestions(context: WorkoutContext): Promise<CoachingSuggestion[]> {
    const suggestions: CoachingSuggestion[] = [];
    
    // AI Workout-specific suggestions
    if (context.isAIGenerated) {
      suggestions.push(...this.generateAIWorkoutSuggestions(context));
    }
    
    // Performance-based suggestions
    suggestions.push(...this.generatePerformanceSuggestions(context));
    
    // Readiness-based suggestions
    suggestions.push(...this.generateReadinessSuggestions(context));
    
    // Exercise-specific form cues
    suggestions.push(...this.generateFormSuggestions(context));
    
    // Motivational coaching
    suggestions.push(...this.generateMotivationalSuggestions(context));
    
    // Store suggestions in history
    const sessionKey = `${Date.now()}-${context.currentExercise}`;
    this.suggestionHistory.set(sessionKey, suggestions);
    
    // Prioritize and filter suggestions
    return this.prioritizeSuggestions(suggestions);
  }

  private generateAIWorkoutSuggestions(context: WorkoutContext): CoachingSuggestion[] {
    const suggestions: CoachingSuggestion[] = [];
    
    // Phase-specific coaching
    if (context.currentPhase === 'warmup') {
      suggestions.push({
        id: 'ai-warmup-guidance',
        type: 'form',
        message: 'Focus on movement quality and activation - this warmup prepares you for your main workout',
        confidence: 0.95,
        urgency: 'low',
        reasoning: 'AI-designed warmup based on your upcoming exercises',
        metadata: { phaseSpecific: true }
      });
    } else if (context.currentPhase === 'cooldown') {
      suggestions.push({
        id: 'ai-cooldown-guidance',
        type: 'recovery',
        message: 'Emphasize deep breathing and gentle stretching for optimal recovery',
        confidence: 0.9,
        urgency: 'low',
        reasoning: 'AI-optimized cooldown sequence for your workout type',
        metadata: { phaseSpecific: true }
      });
    }

    // AI confidence feedback
    if (context.aiMetadata?.confidence_score && context.aiMetadata.confidence_score > 0.9) {
      suggestions.push({
        id: 'ai-confidence-boost',
        type: 'motivation',
        message: `This workout was specifically designed for you with ${Math.round(context.aiMetadata.confidence_score * 100)}% AI confidence`,
        confidence: context.aiMetadata.confidence_score,
        urgency: 'low',
        reasoning: 'High AI confidence indicates optimal workout design for your profile',
        metadata: { readinessAdjusted: true }
      });
    }

    // Target intensity alignment
    if (context.targetIntensity && context.lastSetData) {
      const targetRPE = Math.round(context.targetIntensity);
      const actualRPE = context.lastSetData.rpe;
      const rpeDifference = Math.abs(actualRPE - targetRPE);
      
      if (rpeDifference > 1.5) {
        const direction = actualRPE > targetRPE ? 'reduce' : 'increase';
        const intensityAdjustment = actualRPE > targetRPE ? 'lighter' : 'heavier';
        
        suggestions.push({
          id: 'ai-intensity-adjustment',
          type: 'intensity',
          message: `AI recommends ${direction} intensity - try going ${intensityAdjustment} to hit target RPE ${targetRPE}`,
          confidence: 0.85,
          urgency: rpeDifference > 2.5 ? 'high' : 'medium',
          reasoning: `Current RPE (${actualRPE}) vs AI target (${targetRPE})`,
          metadata: { exerciseSpecific: true }
        });
      }
    }

    // AI adaptations insights
    if (context.aiMetadata?.adaptations?.readinessAdjustments) {
      context.aiMetadata.adaptations.readinessAdjustments.forEach((adjustment, index) => {
        suggestions.push({
          id: `ai-readiness-adaptation-${index}`,
          type: 'recovery',
          message: adjustment,
          confidence: 0.8,
          urgency: 'medium',
          reasoning: 'AI adaptation based on your current readiness assessment',
          metadata: { readinessAdjusted: true }
        });
      });
    }

    return suggestions;
  }

  private generatePerformanceSuggestions(context: WorkoutContext): CoachingSuggestion[] {
    const suggestions: CoachingSuggestion[] = [];
    
    if (!context.lastSetData) return suggestions;
    
    const { weight, reps, rpe } = context.lastSetData;
    
    // Weight progression recommendations
    if (rpe <= 6 && reps >= 8) {
      suggestions.push({
        id: 'weight-increase',
        type: 'weight',
        message: `Consider increasing weight to ${weight + 5}lbs for the next set`,
        confidence: 0.85,
        urgency: 'medium',
        action: {
          label: 'Apply Weight',
          value: weight + 5
        },
        reasoning: `RPE ${rpe}/10 with ${reps} reps suggests you can handle more weight`,
        metadata: { exerciseSpecific: true }
      });
    } else if (rpe >= 9 && reps < 6) {
      suggestions.push({
        id: 'weight-decrease',
        type: 'weight',
        message: `Consider reducing weight to ${Math.max(weight - 10, weight * 0.9)}lbs`,
        confidence: 0.75,
        urgency: 'high',
        action: {
          label: 'Reduce Weight',
          value: Math.max(weight - 10, weight * 0.9)
        },
        reasoning: `High RPE (${rpe}/10) with low reps indicates weight may be too heavy`,
        metadata: { exerciseSpecific: true }
      });
    }

    return suggestions;
  }

  private generateReadinessSuggestions(context: WorkoutContext): CoachingSuggestion[] {
    const suggestions: CoachingSuggestion[] = [];
    
    // Extended rest for low readiness
    if (context.readinessScore < 7) {
      suggestions.push({
        id: 'extended-rest',
        type: 'rest',
        message: 'Take an extra 30-60 seconds rest due to lower readiness',
        confidence: 0.8,
        urgency: 'medium',
        reasoning: `Readiness score ${context.readinessScore}/10 suggests you need more recovery time`,
        metadata: { readinessAdjusted: true }
      });
    }

    // Intensity adjustment for readiness
    if (context.readinessScore < 6 && context.lastSetData?.rpe && context.lastSetData.rpe > 8) {
      suggestions.push({
        id: 'readiness-intensity-adjustment',
        type: 'intensity',
        message: 'Consider reducing intensity due to low readiness score',
        confidence: 0.85,
        urgency: 'high',
        reasoning: `Low readiness (${context.readinessScore}/10) with high effort (RPE ${context.lastSetData.rpe}) may lead to poor recovery`,
        metadata: { readinessAdjusted: true }
      });
    }

    return suggestions;
  }

  private generateFormSuggestions(context: WorkoutContext): CoachingSuggestion[] {
    const suggestions: CoachingSuggestion[] = [];
    
    const formCues: Record<string, string> = {
      'squat': 'Keep chest up, knees tracking over toes, drive through heels',
      'deadlift': 'Maintain neutral spine, bar close to shins, engage lats',
      'bench press': 'Retract shoulder blades, feet planted, controlled descent',
      'overhead press': 'Brace core, vertical bar path, drive through heels',
      'pull-up': 'Full range of motion, controlled negative, engage lats',
      'row': 'Squeeze shoulder blades, pull elbows back, control the weight'
    };

    const exerciseLower = context.currentExercise.toLowerCase();
    
    for (const [exercise, cue] of Object.entries(formCues)) {
      if (exerciseLower.includes(exercise)) {
        suggestions.push({
          id: 'form-cue',
          type: 'form',
          message: cue,
          confidence: 0.9,
          urgency: 'low',
          reasoning: 'Exercise-specific form reminder for optimal performance and safety',
          metadata: { exerciseSpecific: true }
        });
        break;
      }
    }

    return suggestions;
  }

  private generateMotivationalSuggestions(context: WorkoutContext): CoachingSuggestion[] {
    const suggestions: CoachingSuggestion[] = [];
    
    // Progress-based motivation
    if (context.workoutProgress > 0.75) {
      suggestions.push({
        id: 'final-push',
        type: 'motivation',
        message: 'You\'re in the home stretch! Finish strong!',
        confidence: 0.95,
        urgency: 'low',
        reasoning: 'High workout completion rate - time for final motivation',
        metadata: { phaseSpecific: true }
      });
    } else if (context.workoutProgress > 0.5) {
      suggestions.push({
        id: 'midpoint-motivation',
        type: 'motivation',
        message: 'Great work so far! Keep the momentum going',
        confidence: 0.9,
        urgency: 'low',
        reasoning: 'Midpoint motivation to maintain engagement',
        metadata: { phaseSpecific: true }
      });
    }

    // High effort recognition
    if (context.lastSetData?.rpe && context.lastSetData.rpe >= 9) {
      suggestions.push({
        id: 'effort-recognition',
        type: 'motivation',
        message: 'Excellent effort on that set! Focus on recovery for the next one',
        confidence: 0.85,
        urgency: 'low',
        reasoning: 'High RPE indicates maximum effort - positive reinforcement',
        metadata: { exerciseSpecific: true }
      });
    }

    return suggestions;
  }

  private prioritizeSuggestions(suggestions: CoachingSuggestion[]): CoachingSuggestion[] {
    // Sort by urgency and confidence
    const prioritized = suggestions.sort((a, b) => {
      const urgencyWeight = { high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
      
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.confidence - a.confidence;
    });

    // Limit to top 3-4 suggestions to avoid overwhelming the user
    return prioritized.slice(0, 4);
  }

  /**
   * Get suggestion history for analysis
   */
  getSuggestionHistory(): Map<string, CoachingSuggestion[]> {
    return this.suggestionHistory;
  }

  /**
   * Clear suggestion history (useful for new workout sessions)
   */
  clearHistory(): void {
    this.suggestionHistory.clear();
  }
}

// Singleton instance export
export const aiCoachingService = AICoachingService.getInstance();