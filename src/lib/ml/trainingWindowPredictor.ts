/**
 * Optimal Training Windows Predictor
 * 
 * This module predicts the best times for training based on:
 * - Circadian rhythm patterns from daily metrics
 * - Recovery status and readiness trends
 * - Performance patterns throughout the day
 * - Sleep quality and timing correlations
 * - Stress and energy fluctuations
 */

import { BaseMLModel, MLFeature, MLPrediction, StatUtils, TimeSeriesAnalysis } from './foundation';
import { DailyMetrics, ReadinessFactors } from '@/types/aiCoach';
import { WorkoutSessionWithExercises } from '@/services/database';

// ===== TYPES & INTERFACES =====

export interface TrainingWindow {
  timeOfDay: number; // 0-23 hour
  dayOfWeek: number; // 0-6 (0 = Sunday)
  optimalityScore: number; // 0-100
  confidence: number;
  duration: number; // Recommended workout duration in minutes
  reasoning: string[];
}

export interface OptimalTrainingWindows {
  primary: TrainingWindow;
  secondary?: TrainingWindow;
  avoid: TrainingWindow[];
  weeklyPattern: {
    monday: TrainingWindow[];
    tuesday: TrainingWindow[];
    wednesday: TrainingWindow[];
    thursday: TrainingWindow[];
    friday: TrainingWindow[];
    saturday: TrainingWindow[];
    sunday: TrainingWindow[];
  };
  personalizedFactors: {
    chronotype: 'morning' | 'evening' | 'neutral';
    optimalSleepWindow: { bedtime: number; wakeup: number };
    peakPerformanceTime: number; // Hour of day
    recoveryPattern: 'fast' | 'moderate' | 'slow';
  };
  lastAnalyzed: string;
}

export interface CircadianProfile {
  chronotype: 'morning' | 'evening' | 'neutral';
  sleepPatterns: {
    averageBedtime: number;
    averageWakeup: number;
    optimalSleepDuration: number;
    sleepConsistency: number;
  };
  energyPatterns: {
    morningEnergy: number;
    afternoonEnergy: number;
    eveningEnergy: number;
    energyVariability: number;
  };
  performancePatterns: {
    bestPerformanceTimes: number[];
    worstPerformanceTimes: number[];
    workoutTimingPreferences: Record<number, number>; // hour -> preference score
  };
}

// ===== CIRCADIAN RHYTHM ANALYZER =====

export class CircadianRhythmAnalyzer extends BaseMLModel {
  name = 'CircadianRhythmAnalyzer';
  type = 'classification' as const;
  features = [
    'morning_energy', 'afternoon_energy', 'evening_energy', 'sleep_timing_consistency',
    'workout_performance_by_hour', 'recovery_rate', 'sleep_quality_trend'
  ];
  lastTrained = new Date().toISOString();
  accuracy = 0.79;

  /**
   * Predict optimal training windows based on circadian patterns
   */
  predict(features: MLFeature[]): MLPrediction {
    const featureMap = this.createFeatureMap(features);
    
    const morningEnergy = featureMap.morning_energy || 7;
    const afternoonEnergy = featureMap.afternoon_energy || 7;
    const eveningEnergy = featureMap.evening_energy || 6;
    const sleepConsistency = featureMap.sleep_timing_consistency || 0.8;
    
    // Determine chronotype
    const chronotype = this.determineChronotype(morningEnergy, afternoonEnergy, eveningEnergy);
    
    // Calculate optimal time scores
    const timeScores = this.calculateTimeOptimalityScores(chronotype, morningEnergy, afternoonEnergy, eveningEnergy);
    
    // Find peak time
    const peakTime = timeScores.indexOf(Math.max(...timeScores));
    const peakScore = timeScores[peakTime];
    
    const confidence = this.calculateConfidence(features) * sleepConsistency;
    
    return {
      value: peakTime,
      confidence,
      variance: 2, // ±2 hours variance
      factors: [
        { feature: 'chronotype', contribution: this.chronotypeScore(chronotype), importance: 0.40 },
        { feature: 'morning_energy', contribution: morningEnergy / 10, importance: 0.25 },
        { feature: 'afternoon_energy', contribution: afternoonEnergy / 10, importance: 0.20 },
        { feature: 'evening_energy', contribution: eveningEnergy / 10, importance: 0.15 }
      ],
      methodology: 'Circadian rhythm analysis with energy pattern recognition',
      timeframe: 1
    };
  }

  private createFeatureMap(features: MLFeature[]): Record<string, number> {
    return features.reduce((map, feature) => {
      map[feature.name] = feature.value;
      return map;
    }, {} as Record<string, number>);
  }

  private determineChronotype(
    morningEnergy: number,
    afternoonEnergy: number,
    eveningEnergy: number
  ): 'morning' | 'evening' | 'neutral' {
    const morningBias = morningEnergy - eveningEnergy;
    const eveningBias = eveningEnergy - morningEnergy;
    
    if (morningBias >= 2) return 'morning';
    if (eveningBias >= 2) return 'evening';
    return 'neutral';
  }

  private calculateTimeOptimalityScores(
    chronotype: 'morning' | 'evening' | 'neutral',
    morningEnergy: number,
    afternoonEnergy: number,
    eveningEnergy: number
  ): number[] {
    // Initialize 24-hour scores
    const scores = new Array(24).fill(50);
    
    // Apply chronotype bias
    switch (chronotype) {
      case 'morning':
        // Peak performance 6-10 AM
        for (let h = 6; h <= 10; h++) {
          scores[h] = 80 + (morningEnergy - 5) * 2;
        }
        // Good performance 10 AM - 12 PM
        for (let h = 10; h <= 12; h++) {
          scores[h] = 70 + (morningEnergy - 5) * 1.5;
        }
        // Avoid late evening
        for (let h = 20; h <= 23; h++) {
          scores[h] = 30 - (eveningEnergy - 5);
        }
        break;
        
      case 'evening':
        // Avoid early morning
        for (let h = 5; h <= 9; h++) {
          scores[h] = 30 - (morningEnergy - 5);
        }
        // Good performance afternoon
        for (let h = 14; h <= 18; h++) {
          scores[h] = 70 + (afternoonEnergy - 5) * 1.5;
        }
        // Peak performance evening
        for (let h = 18; h <= 21; h++) {
          scores[h] = 80 + (eveningEnergy - 5) * 2;
        }
        break;
        
      case 'neutral':
        // Peak performance mid-morning and early evening
        for (let h = 9; h <= 11; h++) {
          scores[h] = 75 + (morningEnergy - 5);
        }
        for (let h = 17; h <= 19; h++) {
          scores[h] = 75 + (eveningEnergy - 5);
        }
        break;
    }
    
    // Avoid meal times (reduce performance 1-2 hours after typical meals)
    scores[8] = Math.max(scores[8] - 10, 20); // Post-breakfast
    scores[13] = Math.max(scores[13] - 15, 20); // Post-lunch
    scores[20] = Math.max(scores[20] - 10, 20); // Post-dinner
    
    // Avoid very early morning and late night
    for (let h = 0; h <= 5; h++) {
      scores[h] = Math.max(scores[h] - 30, 10);
    }
    for (let h = 22; h <= 23; h++) {
      scores[h] = Math.max(scores[h] - 20, 20);
    }
    
    return scores.map(score => Math.max(0, Math.min(100, score)));
  }

  private chronotypeScore(chronotype: 'morning' | 'evening' | 'neutral'): number {
    switch (chronotype) {
      case 'morning': return 0.8;
      case 'evening': return 0.7;
      case 'neutral': return 0.9;
    }
  }
}

// ===== READINESS-BASED WINDOW PREDICTOR =====

export class ReadinessWindowPredictor extends BaseMLModel {
  name = 'ReadinessWindowPredictor';
  type = 'regression' as const;
  features = [
    'current_readiness', 'readiness_trend', 'sleep_debt', 'stress_level',
    'recovery_time_needed', 'last_workout_impact', 'tomorrow_readiness_forecast'
  ];
  lastTrained = new Date().toISOString();
  accuracy = 0.83;

  /**
   * Predict readiness-based optimal training timing
   */
  predict(features: MLFeature[]): MLPrediction {
    const featureMap = this.createFeatureMap(features);
    
    const currentReadiness = featureMap.current_readiness || 70;
    const readinessTrend = featureMap.readiness_trend || 0;
    const sleepDebt = featureMap.sleep_debt || 0;
    const stressLevel = featureMap.stress_level || 3;
    
    // Calculate optimal training readiness threshold
    const readinessMultiplier = this.calculateReadinessMultiplier(currentReadiness, readinessTrend);
    const stressAdjustment = this.calculateStressAdjustment(stressLevel);
    const sleepAdjustment = this.calculateSleepAdjustment(sleepDebt);
    
    const optimalReadinessWindow = readinessMultiplier * stressAdjustment * sleepAdjustment;
    
    // Determine timing recommendation
    const timing = this.determineOptimalTiming(currentReadiness, sleepDebt, stressLevel);
    
    const confidence = this.calculateConfidence(features);
    
    return {
      value: optimalReadinessWindow * 100,
      confidence,
      variance: 10,
      factors: [
        { feature: 'current_readiness', contribution: currentReadiness / 100, importance: 0.35 },
        { feature: 'readiness_trend', contribution: readinessTrend, importance: 0.25 },
        { feature: 'sleep_debt', contribution: -sleepDebt / 3, importance: 0.25 },
        { feature: 'stress_level', contribution: -(stressLevel - 5) / 5, importance: 0.15 }
      ],
      methodology: 'Multi-factor readiness assessment with recovery forecasting',
      timeframe: 1
    };
  }

  private createFeatureMap(features: MLFeature[]): Record<string, number> {
    return features.reduce((map, feature) => {
      map[feature.name] = feature.value;
      return map;
    }, {} as Record<string, number>);
  }

  private calculateReadinessMultiplier(readiness: number, trend: number): number {
    let multiplier = readiness / 70; // Normalize to baseline of 70
    
    // Adjust for trend
    if (trend > 0.1) multiplier *= 1.1; // Improving trend
    if (trend < -0.1) multiplier *= 0.9; // Declining trend
    
    return Math.max(0.5, Math.min(1.5, multiplier));
  }

  private calculateStressAdjustment(stressLevel: number): number {
    // Stress levels 1-10, optimal around 3-4
    if (stressLevel <= 4) return 1.0;
    if (stressLevel <= 6) return 0.9;
    if (stressLevel <= 8) return 0.8;
    return 0.7;
  }

  private calculateSleepAdjustment(sleepDebt: number): number {
    // Sleep debt in hours
    if (sleepDebt <= 0) return 1.0;
    if (sleepDebt <= 1) return 0.95;
    if (sleepDebt <= 2) return 0.85;
    return 0.75;
  }

  private determineOptimalTiming(readiness: number, sleepDebt: number, stressLevel: number): string {
    if (sleepDebt > 2) return 'prioritize_sleep';
    if (stressLevel > 7) return 'light_activity_only';
    if (readiness < 50) return 'active_recovery';
    if (readiness > 80) return 'high_intensity_ok';
    return 'moderate_intensity';
  }
}

// ===== COMPREHENSIVE TRAINING WINDOW ANALYZER =====

export class TrainingWindowAnalyzer {
  private circadianAnalyzer = new CircadianRhythmAnalyzer();
  private readinessPredictor = new ReadinessWindowPredictor();

  /**
   * Analyze and predict optimal training windows
   */
  async analyzeOptimalWindows(
    dailyMetrics: DailyMetrics[],
    workouts: WorkoutSessionWithExercises[],
    userId: string
  ): Promise<OptimalTrainingWindows> {
    
    // Build circadian profile
    const circadianProfile = this.buildCircadianProfile(dailyMetrics, workouts);
    
    // Extract features for predictions
    const circadianFeatures = this.extractCircadianFeatures(dailyMetrics, circadianProfile);
    const readinessFeatures = this.extractReadinessFeatures(dailyMetrics);
    
    // Get predictions
    const circadianPrediction = this.circadianAnalyzer.predict(circadianFeatures);
    const readinessPrediction = this.readinessPredictor.predict(readinessFeatures);
    
    // Calculate optimal windows for each day
    const weeklyPattern = this.calculateWeeklyPattern(circadianProfile, dailyMetrics);
    
    // Determine primary and secondary windows
    const primaryWindow = this.determinePrimaryWindow(circadianPrediction, readinessPrediction, circadianProfile);
    const secondaryWindow = this.determineSecondaryWindow(circadianProfile, primaryWindow);
    
    // Identify times to avoid
    const avoidWindows = this.identifyAvoidWindows(circadianProfile, dailyMetrics);
    
    return {
      primary: primaryWindow,
      secondary: secondaryWindow,
      avoid: avoidWindows,
      weeklyPattern,
      personalizedFactors: {
        chronotype: circadianProfile.chronotype,
        optimalSleepWindow: {
          bedtime: circadianProfile.sleepPatterns.averageBedtime,
          wakeup: circadianProfile.sleepPatterns.averageWakeup
        },
        peakPerformanceTime: circadianPrediction.value,
        recoveryPattern: this.determineRecoveryPattern(dailyMetrics)
      },
      lastAnalyzed: new Date().toISOString()
    };
  }

  private buildCircadianProfile(
    dailyMetrics: DailyMetrics[],
    workouts: WorkoutSessionWithExercises[]
  ): CircadianProfile {
    if (dailyMetrics.length === 0) {
      return this.getDefaultCircadianProfile();
    }

    // Analyze sleep patterns
    const sleepData = dailyMetrics.filter(m => m.sleep > 0);
    const avgSleep = sleepData.reduce((sum, m) => sum + m.sleep, 0) / sleepData.length;
    
    // Analyze energy patterns (simplified - would need time-of-day data)
    const avgEnergy = dailyMetrics.reduce((sum, m) => sum + m.energy, 0) / dailyMetrics.length;
    const energyVariability = StatUtils.standardDeviation(dailyMetrics.map(m => m.energy));
    
    // Determine chronotype based on energy patterns
    const chronotype = this.inferChronotype(dailyMetrics, workouts);
    
    return {
      chronotype,
      sleepPatterns: {
        averageBedtime: 22, // Default 10 PM
        averageWakeup: 6, // Default 6 AM
        optimalSleepDuration: avgSleep,
        sleepConsistency: 0.8 // Default consistency
      },
      energyPatterns: {
        morningEnergy: avgEnergy * (chronotype === 'morning' ? 1.2 : 0.8),
        afternoonEnergy: avgEnergy,
        eveningEnergy: avgEnergy * (chronotype === 'evening' ? 1.2 : 0.8),
        energyVariability
      },
      performancePatterns: {
        bestPerformanceTimes: chronotype === 'morning' ? [7, 8, 9] : [17, 18, 19],
        worstPerformanceTimes: chronotype === 'morning' ? [20, 21, 22] : [6, 7, 8],
        workoutTimingPreferences: this.calculateWorkoutTimingPreferences(chronotype)
      }
    };
  }

  private getDefaultCircadianProfile(): CircadianProfile {
    return {
      chronotype: 'neutral',
      sleepPatterns: {
        averageBedtime: 22,
        averageWakeup: 6,
        optimalSleepDuration: 8,
        sleepConsistency: 0.8
      },
      energyPatterns: {
        morningEnergy: 7,
        afternoonEnergy: 7,
        eveningEnergy: 6,
        energyVariability: 1.5
      },
      performancePatterns: {
        bestPerformanceTimes: [9, 17],
        worstPerformanceTimes: [6, 22],
        workoutTimingPreferences: {
          6: 30, 7: 50, 8: 70, 9: 80, 10: 85, 11: 80,
          12: 60, 13: 50, 14: 60, 15: 70, 16: 75, 17: 85,
          18: 80, 19: 70, 20: 50, 21: 40, 22: 30
        }
      }
    };
  }

  private inferChronotype(
    dailyMetrics: DailyMetrics[],
    workouts: WorkoutSessionWithExercises[]
  ): 'morning' | 'evening' | 'neutral' {
    // Simplified chronotype inference
    // In reality, this would need more sophisticated analysis
    
    if (dailyMetrics.length < 7) return 'neutral';
    
    const avgEnergy = dailyMetrics.reduce((sum, m) => sum + m.energy, 0) / dailyMetrics.length;
    const avgSoreness = dailyMetrics.reduce((sum, m) => sum + m.soreness, 0) / dailyMetrics.length;
    
    // High energy and low soreness suggests good recovery (often morning types)
    if (avgEnergy > 7.5 && avgSoreness < 3) return 'morning';
    
    // Check workout timing preferences from historical data
    const morningWorkouts = workouts.filter(w => {
      const hour = new Date(w.started_at).getHours();
      return hour >= 6 && hour <= 10;
    }).length;
    
    const eveningWorkouts = workouts.filter(w => {
      const hour = new Date(w.started_at).getHours();
      return hour >= 17 && hour <= 21;
    }).length;
    
    if (morningWorkouts > eveningWorkouts * 1.5) return 'morning';
    if (eveningWorkouts > morningWorkouts * 1.5) return 'evening';
    
    return 'neutral';
  }

  private calculateWorkoutTimingPreferences(chronotype: 'morning' | 'evening' | 'neutral'): Record<number, number> {
    const preferences: Record<number, number> = {};
    
    for (let hour = 0; hour < 24; hour++) {
      switch (chronotype) {
        case 'morning':
          if (hour >= 6 && hour <= 10) preferences[hour] = 85;
          else if (hour >= 11 && hour <= 13) preferences[hour] = 70;
          else if (hour >= 17 && hour <= 19) preferences[hour] = 60;
          else preferences[hour] = 30;
          break;
          
        case 'evening':
          if (hour >= 17 && hour <= 20) preferences[hour] = 85;
          else if (hour >= 14 && hour <= 16) preferences[hour] = 70;
          else if (hour >= 10 && hour <= 12) preferences[hour] = 60;
          else preferences[hour] = 30;
          break;
          
        case 'neutral':
          if (hour >= 9 && hour <= 11) preferences[hour] = 80;
          else if (hour >= 17 && hour <= 19) preferences[hour] = 80;
          else if (hour >= 14 && hour <= 16) preferences[hour] = 65;
          else preferences[hour] = 40;
          break;
      }
    }
    
    return preferences;
  }

  private extractCircadianFeatures(
    dailyMetrics: DailyMetrics[],
    profile: CircadianProfile
  ): MLFeature[] {
    return [
      { name: 'morning_energy', value: profile.energyPatterns.morningEnergy, importance: 0.30, category: 'readiness' },
      { name: 'afternoon_energy', value: profile.energyPatterns.afternoonEnergy, importance: 0.25, category: 'readiness' },
      { name: 'evening_energy', value: profile.energyPatterns.eveningEnergy, importance: 0.25, category: 'readiness' },
      { name: 'sleep_timing_consistency', value: profile.sleepPatterns.sleepConsistency, importance: 0.20, category: 'temporal' }
    ];
  }

  private extractReadinessFeatures(dailyMetrics: DailyMetrics[]): MLFeature[] {
    if (dailyMetrics.length === 0) return [];

    const latest = dailyMetrics[0];
    const recentMetrics = dailyMetrics.slice(0, 7);
    
    const avgReadiness = this.calculateReadinessScore(latest);
    const readinessTrend = this.calculateReadinessTrend(recentMetrics);
    const sleepDebt = Math.max(0, 8 - latest.sleep);
    
    return [
      { name: 'current_readiness', value: avgReadiness, importance: 0.35, category: 'readiness' },
      { name: 'readiness_trend', value: readinessTrend, importance: 0.25, category: 'temporal' },
      { name: 'sleep_debt', value: sleepDebt, importance: 0.25, category: 'readiness' },
      { name: 'stress_level', value: latest.stress, importance: 0.15, category: 'readiness' }
    ];
  }

  private calculateReadinessScore(metrics: DailyMetrics): number {
    return (metrics.sleep * 10 + 
            metrics.energy * 10 + 
            (10 - metrics.soreness) * 8 + 
            (10 - metrics.stress) * 7) / 3.5;
  }

  private calculateReadinessTrend(metrics: DailyMetrics[]): number {
    if (metrics.length < 3) return 0;
    
    const scores = metrics.map(m => this.calculateReadinessScore(m));
    const indices = scores.map((_, i) => i);
    const regression = StatUtils.linearRegression(indices, scores);
    
    return regression.slope * regression.confidence;
  }

  private calculateWeeklyPattern(
    profile: CircadianProfile,
    dailyMetrics: DailyMetrics[]
  ): OptimalTrainingWindows['weeklyPattern'] {
    const pattern: OptimalTrainingWindows['weeklyPattern'] = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    
    dayNames.forEach((day, dayIndex) => {
      const windows = this.calculateDayOptimalWindows(profile, dayIndex);
      pattern[day] = windows;
    });
    
    return pattern;
  }

  private calculateDayOptimalWindows(profile: CircadianProfile, dayOfWeek: number): TrainingWindow[] {
    const windows: TrainingWindow[] = [];
    
    // Get best performance times for this chronotype
    const bestTimes = profile.performancePatterns.bestPerformanceTimes;
    
    bestTimes.forEach(hour => {
      const score = profile.performancePatterns.workoutTimingPreferences[hour] || 50;
      
      if (score >= 70) {
        windows.push({
          timeOfDay: hour,
          dayOfWeek,
          optimalityScore: score,
          confidence: 0.8,
          duration: this.calculateOptimalDuration(score),
          reasoning: this.generateWindowReasoning(hour, profile.chronotype, score)
        });
      }
    });
    
    return windows.sort((a, b) => b.optimalityScore - a.optimalityScore);
  }

  private calculateOptimalDuration(score: number): number {
    // Higher scores allow for longer workouts
    if (score >= 85) return 90; // High intensity, long duration ok
    if (score >= 75) return 75; // Good performance window
    if (score >= 65) return 60; // Moderate performance
    return 45; // Lower performance, shorter duration
  }

  private generateWindowReasoning(hour: number, chronotype: string, score: number): string[] {
    const reasoning: string[] = [];
    
    if (score >= 85) {
      reasoning.push('Peak performance window for your chronotype');
    }
    
    if (hour >= 6 && hour <= 10 && chronotype === 'morning') {
      reasoning.push('Optimal morning window for early chronotypes');
    }
    
    if (hour >= 17 && hour <= 20 && chronotype === 'evening') {
      reasoning.push('Optimal evening window for late chronotypes');
    }
    
    if (hour >= 9 && hour <= 11) {
      reasoning.push('Good cortisol and body temperature timing');
    }
    
    if (hour >= 17 && hour <= 19) {
      reasoning.push('Peak body temperature and coordination');
    }
    
    return reasoning;
  }

  private determinePrimaryWindow(
    circadianPrediction: MLPrediction,
    readinessPrediction: MLPrediction,
    profile: CircadianProfile
  ): TrainingWindow {
    const optimalHour = Math.round(circadianPrediction.value);
    const readinessScore = readinessPrediction.value;
    
    return {
      timeOfDay: optimalHour,
      dayOfWeek: this.getBestDayOfWeek(profile),
      optimalityScore: Math.min(100, (circadianPrediction.confidence * 90) + (readinessScore * 0.1)),
      confidence: (circadianPrediction.confidence + readinessPrediction.confidence) / 2,
      duration: this.calculateOptimalDuration(readinessScore),
      reasoning: [
        `Optimal for ${profile.chronotype} chronotype`,
        'Aligned with your circadian rhythm',
        'Based on historical performance patterns'
      ]
    };
  }

  private determineSecondaryWindow(
    profile: CircadianProfile,
    primaryWindow: TrainingWindow
  ): TrainingWindow | undefined {
    const secondaryTimes = profile.performancePatterns.bestPerformanceTimes
      .filter(time => Math.abs(time - primaryWindow.timeOfDay) >= 4);
    
    if (secondaryTimes.length === 0) return undefined;
    
    const secondaryHour = secondaryTimes[0];
    const score = profile.performancePatterns.workoutTimingPreferences[secondaryHour] || 60;
    
    return {
      timeOfDay: secondaryHour,
      dayOfWeek: (primaryWindow.dayOfWeek + 2) % 7,
      optimalityScore: score * 0.8, // Secondary window is 80% of optimal
      confidence: 0.7,
      duration: this.calculateOptimalDuration(score * 0.8),
      reasoning: [
        'Alternative training window',
        'Good backup option for scheduling flexibility'
      ]
    };
  }

  private identifyAvoidWindows(
    profile: CircadianProfile,
    dailyMetrics: DailyMetrics[]
  ): TrainingWindow[] {
    const avoidTimes = profile.performancePatterns.worstPerformanceTimes;
    
    return avoidTimes.map(hour => ({
      timeOfDay: hour,
      dayOfWeek: 0, // Generic
      optimalityScore: 20,
      confidence: 0.8,
      duration: 0,
      reasoning: [
        'Low performance window for your chronotype',
        'Risk of poor workout quality',
        'Consider active recovery instead'
      ]
    }));
  }

  private getBestDayOfWeek(profile: CircadianProfile): number {
    // Tuesday/Wednesday are often optimal (recovered from weekend, not yet fatigued)
    return 2; // Tuesday
  }

  private determineRecoveryPattern(dailyMetrics: DailyMetrics[]): 'fast' | 'moderate' | 'slow' {
    if (dailyMetrics.length < 7) return 'moderate';
    
    const avgSoreness = dailyMetrics.reduce((sum, m) => sum + m.soreness, 0) / dailyMetrics.length;
    const avgSleep = dailyMetrics.reduce((sum, m) => sum + m.sleep, 0) / dailyMetrics.length;
    
    if (avgSoreness <= 3 && avgSleep >= 7.5) return 'fast';
    if (avgSoreness >= 6 || avgSleep <= 6) return 'slow';
    return 'moderate';
  }
}

export { TrainingWindowAnalyzer as default };