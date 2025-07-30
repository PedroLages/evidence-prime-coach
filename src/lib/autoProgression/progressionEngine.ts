import { 
  ProgressionSuggestion, 
  ProgressionRule, 
  AutoProgressionSettings,
  OneRMEstimate,
  PlateauAnalysis,
  LoadAdjustment
} from '@/types/autoProgression';
import { DataAnalyzer } from '@/lib/aiCoach/dataAnalyzer';

export class ProgressionEngine {
  /**
   * Generates progression suggestions based on user data and settings
   */
  static generateProgressionSuggestions(
    exercise: string,
    recentPerformance: any[],
    oneRMEstimate: OneRMEstimate,
    settings: AutoProgressionSettings,
    plateauAnalysis?: PlateauAnalysis
  ): ProgressionSuggestion[] {
    const suggestions: ProgressionSuggestion[] = [];

    if (recentPerformance.length === 0) {
      return suggestions;
    }

    // Get the most recent performance
    const lastPerformance = recentPerformance[recentPerformance.length - 1];
    
    // Check for plateau first
    if (plateauAnalysis?.isDetected) {
      suggestions.push(...this.generatePlateauBreakingSuggestions(
        exercise, 
        lastPerformance, 
        plateauAnalysis, 
        settings
      ));
      return suggestions;
    }

    // Check if deload is needed
    const deloadSuggestion = this.checkDeloadNeed(exercise, recentPerformance, settings);
    if (deloadSuggestion) {
      suggestions.push(deloadSuggestion);
      return suggestions;
    }

    // Generate normal progression suggestions
    const progressionRule = this.getProgressionRule(exercise, settings);
    
    // Weight progression
    const weightSuggestion = this.generateWeightProgression(
      exercise,
      lastPerformance,
      oneRMEstimate,
      progressionRule,
      settings
    );
    if (weightSuggestion) suggestions.push(weightSuggestion);

    // Volume progression if weight can't increase
    if (!weightSuggestion || weightSuggestion.confidence < 0.7) {
      const volumeSuggestion = this.generateVolumeProgression(
        exercise,
        lastPerformance,
        progressionRule,
        settings
      );
      if (volumeSuggestion) suggestions.push(volumeSuggestion);
    }

    return suggestions;
  }

  /**
   * Gets progression rules based on exercise and user settings
   */
  private static getProgressionRule(exercise: string, settings: AutoProgressionSettings): ProgressionRule {
    const exerciseType = this.categorizeExercise(exercise);
    
    const baseRules = {
      beginner: {
        squat: { weeklyIncrease: { weight: 2.5, percentage: 2.5 }, plateauThreshold: 2 },
        bench: { weeklyIncrease: { weight: 1.25, percentage: 2.0 }, plateauThreshold: 2 },
        deadlift: { weeklyIncrease: { weight: 2.5, percentage: 2.5 }, plateauThreshold: 2 },
        ohp: { weeklyIncrease: { weight: 1.25, percentage: 1.5 }, plateauThreshold: 2 },
        accessory: { weeklyIncrease: { weight: 1.25, percentage: 2.0 }, plateauThreshold: 3 }
      },
      intermediate: {
        squat: { weeklyIncrease: { weight: 1.25, percentage: 1.5 }, plateauThreshold: 3 },
        bench: { weeklyIncrease: { weight: 1.25, percentage: 1.0 }, plateauThreshold: 3 },
        deadlift: { weeklyIncrease: { weight: 2.5, percentage: 1.5 }, plateauThreshold: 3 },
        ohp: { weeklyIncrease: { weight: 1.25, percentage: 1.0 }, plateauThreshold: 3 },
        accessory: { weeklyIncrease: { weight: 1.25, percentage: 1.5 }, plateauThreshold: 4 }
      },
      advanced: {
        squat: { weeklyIncrease: { weight: 1.25, percentage: 0.5 }, plateauThreshold: 4 },
        bench: { weeklyIncrease: { weight: 1.25, percentage: 0.5 }, plateauThreshold: 4 },
        deadlift: { weeklyIncrease: { weight: 1.25, percentage: 0.75 }, plateauThreshold: 4 },
        ohp: { weeklyIncrease: { weight: 1.25, percentage: 0.5 }, plateauThreshold: 4 },
        accessory: { weeklyIncrease: { weight: 1.25, percentage: 1.0 }, plateauThreshold: 5 }
      }
    };

    const levelRules = baseRules[settings.userLevel];
    const rule = levelRules[exerciseType] || levelRules.accessory;

    return {
      userLevel: settings.userLevel,
      exerciseType,
      phaseType: settings.primaryGoal === 'strength' ? 'strength' : 'hypertrophy',
      weeklyIncrease: rule.weeklyIncrease,
      plateauThreshold: rule.plateauThreshold,
      deloadTrigger: {
        failedSessions: settings.userLevel === 'beginner' ? 2 : 3,
        rpeThreshold: 9.5,
        volumeDropPercent: 15
      }
    };
  }

  /**
   * Categorizes exercise type for progression rules
   */
  private static categorizeExercise(exercise: string): 'squat' | 'bench' | 'deadlift' | 'ohp' | 'accessory' {
    const exerciseLower = exercise.toLowerCase();
    
    if (exerciseLower.includes('squat')) return 'squat';
    if (exerciseLower.includes('bench') || exerciseLower.includes('press') && exerciseLower.includes('chest')) return 'bench';
    if (exerciseLower.includes('deadlift')) return 'deadlift';
    if (exerciseLower.includes('overhead') || exerciseLower.includes('shoulder press') || exerciseLower.includes('ohp')) return 'ohp';
    
    return 'accessory';
  }

  /**
   * Generates weight progression suggestion
   */
  private static generateWeightProgression(
    exercise: string,
    lastPerformance: any,
    oneRM: OneRMEstimate,
    rule: ProgressionRule,
    settings: AutoProgressionSettings
  ): ProgressionSuggestion | null {
    const currentWeight = lastPerformance.weight;
    const currentReps = lastPerformance.reps;
    const lastRPE = lastPerformance.rpe || 8;

    // Check if weight increase is appropriate based on RPE
    if (lastRPE > settings.rpeTarget[rule.phaseType]) {
      return null; // Too hard, don't increase weight
    }

    // Calculate suggested weight increase
    let weightIncrease = rule.weeklyIncrease.weight;
    
    // Adjust based on aggressiveness setting
    const aggressivenessMultiplier = {
      conservative: 0.5,
      moderate: 1.0,
      aggressive: 1.5
    };
    
    weightIncrease *= aggressivenessMultiplier[settings.aggressiveness];

    // Ensure minimum increment (usually 1.25kg or 2.5kg)
    const minIncrement = rule.exerciseType === 'ohp' || rule.exerciseType === 'bench' ? 1.25 : 2.5;
    weightIncrease = Math.max(minIncrement, weightIncrease);

    const suggestedWeight = currentWeight + weightIncrease;

    // Check if suggested weight is reasonable (not too high percentage of 1RM)
    const percentageOfOneRM = (suggestedWeight / oneRM.estimate) * 100;
    const maxReasonablePercentage = {
      strength: 95,
      hypertrophy: 85,
      power: 90,
      endurance: 75
    };

    if (percentageOfOneRM > maxReasonablePercentage[rule.phaseType]) {
      return null; // Suggested weight is too high
    }

    // Calculate confidence based on recent performance and RPE consistency
    const rpeVariation = this.calculateRPEVariation(lastPerformance);
    const confidence = Math.max(0.3, Math.min(0.9, 
      1 - (lastRPE - 7) / 10 - rpeVariation / 10 + oneRM.confidence / 2
    ));

    return {
      id: `weight_prog_${exercise}_${Date.now()}`,
      exercise,
      type: 'weight_increase',
      current: {
        weight: currentWeight,
        reps: currentReps,
        sets: lastPerformance.sets || 3,
        rpe: lastRPE
      },
      suggested: {
        weight: Math.round(suggestedWeight * 4) / 4, // Round to nearest 0.25kg
        reps: currentReps,
        sets: lastPerformance.sets || 3,
        reasoning: `Increase weight by ${weightIncrease}kg based on ${rule.userLevel} progression and RPE ${lastRPE}`
      },
      confidence,
      reasoning: `Last session RPE was ${lastRPE}, indicating room for progression. Following ${rule.userLevel} ${rule.phaseType} progression pattern.`,
      evidence: [
        `RPE ${lastRPE} below target of ${settings.rpeTarget[rule.phaseType]}`,
        `Current weight is ${Math.round(percentageOfOneRM)}% of estimated 1RM`,
        `${rule.userLevel} progression rate: ${rule.weeklyIncrease.weight}kg/week`
      ],
      timeframe: 'next_session',
      priority: confidence > 0.7 ? 'high' : 'medium',
      lastPerformance: [lastPerformance]
    };
  }

  /**
   * Generates volume progression suggestion
   */
  private static generateVolumeProgression(
    exercise: string,
    lastPerformance: any,
    rule: ProgressionRule,
    settings: AutoProgressionSettings
  ): ProgressionSuggestion | null {
    const currentReps = lastPerformance.reps;
    const currentSets = lastPerformance.sets || 3;
    const lastRPE = lastPerformance.rpe || 8;

    // Only suggest volume increase if RPE allows
    if (lastRPE > settings.rpeTarget[rule.phaseType] + 0.5) {
      return null;
    }

    let suggestedReps = currentReps;
    let suggestedSets = currentSets;

    // Increase reps first, then sets
    if (currentReps < 12 && rule.phaseType === 'hypertrophy') {
      suggestedReps = currentReps + 1;
    } else if (currentSets < 5) {
      suggestedSets = currentSets + 1;
      suggestedReps = Math.max(1, currentReps - 1); // Slightly reduce reps when adding set
    } else {
      return null; // Volume is already high
    }

    const confidence = Math.max(0.4, Math.min(0.8, 1 - (lastRPE - 6) / 8));

    return {
      id: `volume_prog_${exercise}_${Date.now()}`,
      exercise,
      type: 'volume_increase',
      current: {
        weight: lastPerformance.weight,
        reps: currentReps,
        sets: currentSets,
        rpe: lastRPE
      },
      suggested: {
        weight: lastPerformance.weight,
        reps: suggestedReps,
        sets: suggestedSets,
        reasoning: `Increase volume: ${suggestedSets} sets × ${suggestedReps} reps (was ${currentSets} × ${currentReps})`
      },
      confidence,
      reasoning: `Weight progression not suitable, increasing volume to continue overload`,
      evidence: [
        `RPE ${lastRPE} allows for volume increase`,
        `Current volume: ${currentSets * currentReps} total reps`,
        `Suggested volume: ${suggestedSets * suggestedReps} total reps`
      ],
      timeframe: 'next_session',
      priority: 'medium',
      lastPerformance: [lastPerformance]
    };
  }

  /**
   * Checks if deload is needed
   */
  private static checkDeloadNeed(
    exercise: string,
    recentPerformance: any[],
    settings: AutoProgressionSettings
  ): ProgressionSuggestion | null {
    if (recentPerformance.length < 3) return null;

    const last3Sessions = recentPerformance.slice(-3);
    const avgRPE = last3Sessions.reduce((sum, p) => sum + (p.rpe || 8), 0) / last3Sessions.length;
    
    // Check for consistently high RPE
    const highRPESessions = last3Sessions.filter(p => (p.rpe || 8) >= 9).length;
    
    // Check for failed reps
    const failedSessions = last3Sessions.filter(p => p.completed === false).length;

    if (highRPESessions >= 2 || failedSessions >= 2 || avgRPE >= 9.2) {
      const deloadWeight = Math.round(last3Sessions[0].weight * 0.85 * 4) / 4;
      
      return {
        id: `deload_${exercise}_${Date.now()}`,
        exercise,
        type: 'deload',
        current: {
          weight: last3Sessions[last3Sessions.length - 1].weight,
          reps: last3Sessions[last3Sessions.length - 1].reps,
          sets: last3Sessions[last3Sessions.length - 1].sets || 3,
          rpe: last3Sessions[last3Sessions.length - 1].rpe || 8
        },
        suggested: {
          weight: deloadWeight,
          reps: last3Sessions[last3Sessions.length - 1].reps,
          sets: Math.max(2, (last3Sessions[last3Sessions.length - 1].sets || 3) - 1),
          reasoning: `Deload to 85% of current weight (${deloadWeight}kg) for recovery`
        },
        confidence: 0.85,
        reasoning: `High fatigue detected: average RPE ${avgRPE.toFixed(1)}, ${failedSessions} failed sessions`,
        evidence: [
          `Average RPE over last 3 sessions: ${avgRPE.toFixed(1)}`,
          `Failed sessions: ${failedSessions}/3`,
          `Deload recommended for recovery and technique refinement`
        ],
        timeframe: 'next_session',
        priority: 'high',
        lastPerformance: last3Sessions
      };
    }

    return null;
  }

  /**
   * Generates plateau-breaking suggestions
   */
  private static generatePlateauBreakingSuggestions(
    exercise: string,
    lastPerformance: any,
    plateau: PlateauAnalysis,
    settings: AutoProgressionSettings
  ): ProgressionSuggestion[] {
    const suggestions: ProgressionSuggestion[] = [];

    plateau.recommendations.forEach((rec, index) => {
      let suggested = { ...lastPerformance };
      let reasoning = rec.description;

      switch (rec.type) {
        case 'deload':
          suggested.weight = Math.round(lastPerformance.weight * 0.8 * 4) / 4;
          suggested.sets = Math.max(2, lastPerformance.sets - 1);
          break;
        case 'volume_adjustment':
          suggested.reps = Math.max(1, lastPerformance.reps - 2);
          suggested.sets = lastPerformance.sets + 1;
          break;
        case 'technique_focus':
          suggested.weight = Math.round(lastPerformance.weight * 0.9 * 4) / 4;
          reasoning += ' - Focus on perfect form and mind-muscle connection';
          break;
      }

      suggestions.push({
        id: `plateau_break_${rec.type}_${exercise}_${Date.now() + index}`,
        exercise,
        type: 'plateau_break',
        current: {
          weight: lastPerformance.weight,
          reps: lastPerformance.reps,
          sets: lastPerformance.sets || 3,
          rpe: lastPerformance.rpe || 8
        },
        suggested: {
          weight: suggested.weight,
          reps: suggested.reps,
          sets: suggested.sets,
          reasoning
        },
        confidence: plateau.confidence,
        reasoning: `Plateau detected for ${plateau.duration} sessions. ${rec.implementation}`,
        evidence: [
          `Plateau type: ${plateau.type}`,
          `Duration: ${plateau.duration} sessions`,
          `Severity: ${plateau.severity}`
        ],
        timeframe: 'next_week',
        priority: plateau.severity === 'severe' ? 'critical' : 'high',
        lastPerformance: [lastPerformance]
      });
    });

    return suggestions;
  }

  /**
   * Calculates RPE variation for confidence scoring
   */
  private static calculateRPEVariation(performances: any[]): number {
    if (!Array.isArray(performances)) return 0;
    
    const rpes = performances.map(p => p.rpe || 8);
    if (rpes.length < 2) return 0;
    
    const mean = rpes.reduce((a, b) => a + b) / rpes.length;
    const variance = rpes.reduce((sum, rpe) => sum + Math.pow(rpe - mean, 2), 0) / rpes.length;
    return Math.sqrt(variance);
  }
}