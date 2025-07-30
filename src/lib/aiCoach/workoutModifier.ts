import { 
  WorkoutModification, 
  RealTimeCoaching, 
  ExerciseCoaching, 
  ReadinessAnalysis 
} from '@/types/aiCoach';

export class WorkoutModifier {
  /**
   * Analyzes current readiness and suggests workout modifications
   */
  static suggestWorkoutModifications(
    plannedWorkout: any,
    readiness: ReadinessAnalysis,
    recentRPE: number[] = []
  ): WorkoutModification[] {
    const modifications: WorkoutModification[] = [];
    const { overallScore, factors, deviation } = readiness;

    // Critical readiness - major modifications
    if (overallScore < 40) {
      modifications.push({
        type: 'deload',
        severity: 'major',
        reason: 'Critical readiness detected',
        original: plannedWorkout,
        suggested: this.createDeloadWorkout(plannedWorkout),
        confidence: 0.9,
        explanation: 'Your body needs recovery. Consider a light movement session instead.'
      });
    }

    // Poor readiness - moderate modifications
    else if (overallScore < 60) {
      modifications.push({
        type: 'intensity',
        severity: 'moderate',
        reason: 'Below baseline readiness',
        original: { intensity: '100%' },
        suggested: { intensity: '75-85%' },
        confidence: 0.8,
        explanation: 'Reduce intensity by 15-25% to match current readiness level.'
      });

      modifications.push({
        type: 'volume',
        severity: 'moderate',
        reason: 'Elevated fatigue indicators',
        original: { sets: plannedWorkout.sets },
        suggested: { sets: Math.max(1, Math.floor(plannedWorkout.sets * 0.8)) },
        confidence: 0.7,
        explanation: 'Reduce training volume to accommodate lower energy levels.'
      });
    }

    // Factor-specific modifications
    if (factors.sleep.score < 50) {
      modifications.push({
        type: 'rest',
        severity: 'moderate',
        reason: 'Poor sleep quality',
        original: { restBetweenSets: '2-3 minutes' },
        suggested: { restBetweenSets: '3-5 minutes' },
        confidence: 0.8,
        explanation: 'Extend rest periods due to insufficient recovery sleep.'
      });
    }

    if (factors.soreness.score < 50) {
      modifications.push({
        type: 'exercise',
        severity: 'minor',
        reason: 'High muscle soreness',
        original: { warmup: 'standard' },
        suggested: { warmup: 'extended', mobility: 'emphasize' },
        confidence: 0.9,
        explanation: 'Add 10 minutes of mobility work and extend warm-up.'
      });
    }

    // Excellent readiness - opportunity modifications
    if (overallScore > 85 && deviation > 15) {
      modifications.push({
        type: 'intensity',
        severity: 'minor',
        reason: 'Excellent readiness',
        original: { intensity: '100%' },
        suggested: { intensity: '105-110%' },
        confidence: 0.7,
        explanation: 'Consider progressive overload - you\'re primed for growth!'
      });
    }

    return modifications;
  }

  /**
   * Provides real-time coaching based on current workout state
   */
  static provideRealTimeCoaching(
    currentSet: number,
    exercise: string,
    lastRPE?: number,
    timeElapsed?: number,
    readiness?: ReadinessAnalysis
  ): RealTimeCoaching {
    const suggestions: RealTimeCoaching['suggestions'] = [];

    // RPE-based adjustments
    if (lastRPE !== undefined) {
      if (lastRPE >= 9) {
        suggestions.push({
          type: 'intensity',
          message: 'That was very challenging! Consider reducing weight by 5-10% for the next set.',
          urgency: 'high',
          timing: 'next-set'
        });
      } else if (lastRPE <= 6) {
        suggestions.push({
          type: 'intensity',
          message: 'You have more in the tank! Consider adding 2.5-5kg for the next set.',
          urgency: 'medium',
          timing: 'next-set'
        });
      }
    }

    // Set progression guidance
    if (currentSet >= 3) {
      suggestions.push({
        type: 'form',
        message: 'Focus on form quality over speed. Control the eccentric phase.',
        urgency: 'medium',
        timing: 'immediate'
      });
    }

    // Fatigue monitoring
    if (timeElapsed && timeElapsed > 60) {
      const estimatedFatigue = Math.min(10, timeElapsed / 360); // Rough estimate
      if (estimatedFatigue > 6) {
        suggestions.push({
          type: 'rest',
          message: 'Take an extra 30-60 seconds between sets to maintain quality.',
          urgency: 'medium',
          timing: 'next-set'
        });
      }
    }

    // Readiness-based coaching
    if (readiness && readiness.overallScore < 70) {
      suggestions.push({
        type: 'motivation',
        message: 'Listen to your body today. Quality over quantity.',
        urgency: 'low',
        timing: 'immediate'
      });
    }

    return {
      phase: currentSet === 1 ? 'during-workout' : 'between-sets',
      suggestions,
      context: {
        currentExercise: exercise,
        setNumber: currentSet,
        rpe: lastRPE,
        timeElapsed,
        fatigue: timeElapsed ? Math.min(10, timeElapsed / 360) : undefined
      }
    };
  }

  /**
   * Generates exercise-specific coaching
   */
  static getExerciseCoaching(exerciseName: string, userLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): ExerciseCoaching {
    const commonExercises: Record<string, any> = {
      'squat': {
        formCues: [
          'Keep chest up and core braced',
          'Track knees over toes',
          'Hip hinge first, then knee bend',
          'Drive through whole foot'
        ],
        technique: [
          'Descend until hip crease below knee cap',
          'Pause briefly at bottom position',
          'Explode up through heels'
        ],
        safety: [
          'Maintain neutral spine throughout',
          'Don\'t let knees cave inward',
          'Use safety bars at appropriate height'
        ]
      },
      'deadlift': {
        formCues: [
          'Bar stays close to body',
          'Shoulders over the bar at start',
          'Engage lats to protect spine',
          'Hip hinge movement pattern'
        ],
        technique: [
          'Set up with bar over mid-foot',
          'Drive floor away with legs',
          'Finish with full hip extension'
        ],
        safety: [
          'Never round lower back',
          'Don\'t look up during the lift',
          'Control the descent'
        ]
      },
      'bench press': {
        formCues: [
          'Retract shoulder blades',
          'Slight arch in lower back',
          'Bar touches chest at nipple line',
          'Drive feet into floor'
        ],
        technique: [
          'Lower bar with control',
          'Brief pause on chest',
          'Press up and slightly back'
        ],
        safety: [
          'Always use safety bars or spotter',
          'Don\'t bounce bar off chest',
          'Maintain wrist alignment'
        ]
      }
    };

    const exercise = commonExercises[exerciseName.toLowerCase()] || {
      formCues: ['Focus on proper form', 'Control the movement', 'Full range of motion'],
      technique: ['Quality over quantity', 'Feel the target muscles'],
      safety: ['Stay within your limits', 'Stop if form breaks down']
    };

    return {
      exerciseId: exerciseName,
      exerciseName,
      suggestions: {
        formCues: exercise.formCues,
        intensityAdjustments: {
          reason: 'Standard progression'
        },
        technique: exercise.technique,
        safety: exercise.safety
      },
      realTimeGuidance: {
        preSet: [
          'Set your position and breathing',
          'Visualize perfect form',
          'Engage core muscles'
        ],
        duringSet: [
          'Maintain consistent tempo',
          'Breathe with the movement',
          'Focus on target muscles'
        ],
        postSet: [
          'Rate your effort (RPE 1-10)',
          'Note any form breakdown',
          'Hydrate and prepare for next set'
        ],
        betweenSets: [
          'Active rest - light movement',
          'Review form cues mentally',
          'Adjust weight if needed'
        ]
      }
    };
  }

  /**
   * Creates a deload workout version
   */
  private static createDeloadWorkout(originalWorkout: any): any {
    return {
      ...originalWorkout,
      intensity: '50-60%',
      sets: Math.max(1, Math.floor(originalWorkout.sets * 0.5)),
      reps: Math.max(5, Math.floor(originalWorkout.reps * 0.7)),
      type: 'active_recovery',
      focus: 'movement_quality'
    };
  }

  /**
   * Calculates optimal rest time based on exercise and intensity
   */
  static calculateOptimalRest(
    exerciseType: 'compound' | 'isolation',
    intensity: number,
    lastRPE?: number
  ): { min: number; max: number; reasoning: string } {
    let baseRest = exerciseType === 'compound' ? 180 : 120; // Base seconds
    
    // Adjust for intensity
    if (intensity > 85) baseRest += 60;
    if (intensity < 70) baseRest -= 30;
    
    // Adjust for RPE
    if (lastRPE && lastRPE >= 8) baseRest += 60;
    if (lastRPE && lastRPE <= 6) baseRest -= 30;
    
    const min = Math.max(60, baseRest - 30);
    const max = baseRest + 60;
    
    return {
      min,
      max,
      reasoning: `Based on ${exerciseType} exercise at ${intensity}% intensity${lastRPE ? ` with RPE ${lastRPE}` : ''}`
    };
  }
}