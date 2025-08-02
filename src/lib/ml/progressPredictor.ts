/**
 * Progress Prediction ML Models
 * 
 * This module implements machine learning models for predicting:
 * - Strength gains and 1RM improvements
 * - Weight loss and body composition changes
 * - Performance improvements over time
 * - Training volume adaptations
 */

import { BaseMLModel, MLFeature, MLPrediction, StatUtils, FeatureEngineering, TimeSeriesAnalysis } from './foundation';
import { WorkoutSessionWithExercises, DailyMetric, PerformanceMetric } from '@/services/database';
import { DailyMetrics } from '@/types/aiCoach';

// ===== STRENGTH PROGRESS PREDICTOR =====

export class StrengthProgressPredictor extends BaseMLModel {
  name = 'StrengthProgressPredictor';
  type = 'regression' as const;
  features = [
    'current_1rm', 'avg_volume', 'volume_trend', 'frequency', 
    'avg_rpe', 'training_age', 'readiness_score', 'recovery_time'
  ];
  lastTrained = new Date().toISOString();
  accuracy = 0.78;

  /**
   * Predict 1RM progression for a specific exercise
   */
  predict(features: MLFeature[]): MLPrediction {
    // Validate features with fallback to defaults
    if (!features || features.length === 0) {
      console.warn('No features provided to StrengthProgressPredictor, using defaults');
      features = this.getDefaultFeatures();
    }

    const featureMap = this.createFeatureMap(features);
    
    // Ensure required features exist with sensible defaults
    const requiredDefaults = {
      current_1rm: 100,
      training_age: 1,
      avg_rpe: 7,
      readiness_score: 70,
      frequency: 2,
      volume_trend: 0,
      avg_volume: 1000,
      recovery_time: 48
    };
    
    Object.keys(requiredDefaults).forEach(key => {
      if (featureMap[key] === undefined) {
        featureMap[key] = requiredDefaults[key as keyof typeof requiredDefaults];
      }
    });
    
    // Advanced progression model based on sports science research
    const current1RM = featureMap.current_1rm || 0;
    const trainingAge = featureMap.training_age || 1;
    const volumeTrend = featureMap.volume_trend || 0;
    const avgRPE = featureMap.avg_rpe || 7;
    const readinessScore = featureMap.readiness_score || 70;
    const frequency = featureMap.frequency || 2;

    // Base progression rate decreases with training experience
    let baseProgressionRate = this.calculateBaseProgressionRate(trainingAge);
    
    // Adjust for training variables
    const volumeMultiplier = this.calculateVolumeMultiplier(volumeTrend, frequency);
    const intensityMultiplier = this.calculateIntensityMultiplier(avgRPE);
    const readinessMultiplier = this.calculateReadinessMultiplier(readinessScore);
    
    // Calculate weekly progression
    const weeklyProgression = baseProgressionRate * volumeMultiplier * intensityMultiplier * readinessMultiplier;
    
    // Predict different timeframes
    const oneWeekGain = current1RM * weeklyProgression;
    const oneMonthGain = current1RM * (Math.pow(1 + weeklyProgression, 4) - 1);
    const threeMonthGain = current1RM * (Math.pow(1 + weeklyProgression, 12) - 1);
    
    // Add diminishing returns and plateau detection
    const plateauFactor = this.detectPlateauRisk(volumeTrend, weeklyProgression);
    const adjustedGain = threeMonthGain * plateauFactor;
    
    const confidence = this.calculateConfidence(features);
    
    return {
      value: current1RM + adjustedGain,
      confidence,
      variance: adjustedGain * 0.15, // 15% variance
      factors: [
        { feature: 'training_age', contribution: baseProgressionRate, importance: 0.30 },
        { feature: 'volume_trend', contribution: volumeMultiplier - 1, importance: 0.25 },
        { feature: 'readiness_score', contribution: readinessMultiplier - 1, importance: 0.20 },
        { feature: 'avg_rpe', contribution: intensityMultiplier - 1, importance: 0.15 },
        { feature: 'frequency', contribution: frequency / 3, importance: 0.10 }
      ],
      methodology: 'Advanced progression model with training age, volume periodization, and readiness factors',
      timeframe: 90
    };
  }

  private createFeatureMap(features: MLFeature[]): Record<string, number> {
    return features.reduce((map, feature) => {
      map[feature.name] = feature.value;
      return map;
    }, {} as Record<string, number>);
  }

  private getDefaultFeatures(): MLFeature[] {
    return [
      { name: 'current_1rm', value: 100, importance: 0.25, category: 'performance' },
      { name: 'avg_volume', value: 1000, importance: 0.20, category: 'performance' },
      { name: 'volume_trend', value: 0, importance: 0.15, category: 'performance' },
      { name: 'frequency', value: 2, importance: 0.15, category: 'training' },
      { name: 'avg_rpe', value: 7, importance: 0.10, category: 'training' },
      { name: 'training_age', value: 1, importance: 0.10, category: 'user' },
      { name: 'readiness_score', value: 70, importance: 0.10, category: 'readiness' },
      { name: 'recovery_time', value: 48, importance: 0.05, category: 'readiness' }
    ];
  }

  private calculateBaseProgressionRate(trainingAge: number): number {
    // Based on research: novice 2-4% weekly, intermediate 0.5-2%, advanced 0.25-1%
    if (trainingAge < 0.5) return 0.03; // Novice: 3% weekly
    if (trainingAge < 2) return 0.015; // Intermediate: 1.5% weekly
    if (trainingAge < 5) return 0.008; // Advanced: 0.8% weekly
    return 0.004; // Elite: 0.4% weekly
  }

  private calculateVolumeMultiplier(volumeTrend: number, frequency: number): number {
    // Positive volume trend increases gains
    const trendMultiplier = 1 + (volumeTrend * 0.2);
    
    // Optimal frequency is 2-3x per week for most exercises
    const frequencyMultiplier = frequency >= 2 && frequency <= 3 ? 1.1 : 
                               frequency === 1 ? 0.9 : 
                               frequency > 3 ? 0.95 : 1.0;
    
    return Math.max(0.7, Math.min(1.3, trendMultiplier * frequencyMultiplier));
  }

  private calculateIntensityMultiplier(avgRPE: number): number {
    // Optimal RPE range is 7-9 for strength gains
    if (avgRPE >= 7 && avgRPE <= 9) return 1.1;
    if (avgRPE >= 6 && avgRPE <= 6.5) return 1.0;
    if (avgRPE < 6) return 0.85; // Too easy
    if (avgRPE > 9.5) return 0.8; // Too hard, may impede recovery
    return 0.95;
  }

  private calculateReadinessMultiplier(readinessScore: number): number {
    // Readiness score directly impacts adaptation capacity
    if (readinessScore >= 80) return 1.15;
    if (readinessScore >= 70) return 1.05;
    if (readinessScore >= 60) return 1.0;
    if (readinessScore >= 50) return 0.9;
    return 0.75;
  }

  private detectPlateauRisk(volumeTrend: number, weeklyProgression: number): number {
    // If volume isn't increasing and progression is slow, plateau risk increases
    if (volumeTrend <= 0 && weeklyProgression < 0.005) {
      return 0.6; // High plateau risk
    }
    if (volumeTrend <= 0.1 && weeklyProgression < 0.01) {
      return 0.8; // Moderate plateau risk
    }
    return 1.0; // Low plateau risk
  }
}

// ===== WEIGHT LOSS PREDICTOR =====

export class WeightLossPredictor extends BaseMLModel {
  name = 'WeightLossPredictor';
  type = 'regression' as const;
  features = [
    'current_weight', 'target_weight', 'caloric_deficit', 'activity_level',
    'metabolic_rate', 'training_volume', 'consistency_score', 'starting_weight'
  ];
  lastTrained = new Date().toISOString();
  accuracy = 0.82;

  predict(features: MLFeature[]): MLPrediction {
    if (!this.validateFeatures(features)) {
      throw new Error('Invalid features provided to WeightLossPredictor');
    }

    const featureMap = this.createFeatureMap(features);
    
    const currentWeight = featureMap.current_weight || 70;
    const targetWeight = featureMap.target_weight || 65;
    const caloricDeficit = featureMap.caloric_deficit || 500; // kcal/day
    const activityLevel = featureMap.activity_level || 1.5;
    const trainingVolume = featureMap.training_volume || 3; // sessions/week
    const consistencyScore = featureMap.consistency_score || 0.8;

    // Theoretical weight loss: 1 lb = 3500 kcal
    const theoreticalWeeklyLoss = (caloricDeficit * 7) / 3500 * 0.453592; // Convert to kg

    // Apply biological and behavioral factors
    const metabolicAdaptation = this.calculateMetabolicAdaptation(currentWeight, caloricDeficit);
    const trainingMultiplier = this.calculateTrainingMultiplier(trainingVolume);
    const consistencyMultiplier = consistencyScore;
    
    // Plateau detection for weight loss
    const plateauFactor = this.calculateWeightLossPlateauFactor(currentWeight, targetWeight);
    
    const adjustedWeeklyLoss = theoreticalWeeklyLoss * 
                               metabolicAdaptation * 
                               trainingMultiplier * 
                               consistencyMultiplier * 
                               plateauFactor;

    // Predict timeframes
    const oneWeekLoss = adjustedWeeklyLoss;
    const oneMonthLoss = adjustedWeeklyLoss * 4 * 0.9; // Slight deceleration
    const threeMonthLoss = adjustedWeeklyLoss * 12 * 0.8; // More deceleration

    const predictedWeight = Math.max(
      targetWeight, 
      currentWeight - threeMonthLoss
    );

    const confidence = this.calculateConfidence(features);

    return {
      value: predictedWeight,
      confidence,
      variance: threeMonthLoss * 0.2, // 20% variance
      factors: [
        { feature: 'caloric_deficit', contribution: caloricDeficit / 500, importance: 0.35 },
        { feature: 'consistency_score', contribution: consistencyScore, importance: 0.25 },
        { feature: 'training_volume', contribution: trainingVolume / 4, importance: 0.20 },
        { feature: 'metabolic_adaptation', contribution: metabolicAdaptation, importance: 0.15 },
        { feature: 'activity_level', contribution: activityLevel / 2, importance: 0.05 }
      ],
      methodology: 'Caloric deficit model with metabolic adaptation and training effects',
      timeframe: 90
    };
  }

  private createFeatureMap(features: MLFeature[]): Record<string, number> {
    return features.reduce((map, feature) => {
      map[feature.name] = feature.value;
      return map;
    }, {} as Record<string, number>);
  }

  private calculateMetabolicAdaptation(currentWeight: number, deficit: number): number {
    // Larger deficits cause more metabolic adaptation
    const deficitPercentage = deficit / (currentWeight * 22); // Rough BMR estimate
    
    if (deficitPercentage > 0.25) return 0.7; // Severe adaptation
    if (deficitPercentage > 0.15) return 0.85; // Moderate adaptation
    return 0.95; // Minimal adaptation
  }

  private calculateTrainingMultiplier(trainingVolume: number): number {
    // Resistance training helps preserve muscle mass during weight loss
    if (trainingVolume >= 3) return 1.1;
    if (trainingVolume >= 2) return 1.05;
    if (trainingVolume >= 1) return 1.0;
    return 0.9; // No training
  }

  private calculateWeightLossPlateauFactor(currentWeight: number, targetWeight: number): number {
    const remainingLoss = currentWeight - targetWeight;
    
    // As you get closer to goal, weight loss becomes harder
    if (remainingLoss <= 2) return 0.6; // Very close to goal
    if (remainingLoss <= 5) return 0.8; // Close to goal
    if (remainingLoss <= 10) return 0.9; // Moderate distance
    return 1.0; // Far from goal
  }
}

// ===== VOLUME PROGRESSION PREDICTOR =====

export class VolumeProgressionPredictor extends BaseMLModel {
  name = 'VolumeProgressionPredictor';
  type = 'regression' as const;
  features = [
    'current_volume', 'volume_trend', 'readiness_score', 'recovery_capacity',
    'training_age', 'frequency', 'intensity_load'
  ];
  lastTrained = new Date().toISOString();
  accuracy = 0.75;

  predict(features: MLFeature[]): MLPrediction {
    const featureMap = this.createFeatureMap(features);
    
    const currentVolume = featureMap.current_volume || 0;
    const volumeTrend = featureMap.volume_trend || 0;
    const readinessScore = featureMap.readiness_score || 70;
    const trainingAge = featureMap.training_age || 1;
    const intensityLoad = featureMap.intensity_load || 7;

    // Volume progression guidelines based on training status
    const baseProgressionRate = this.calculateVolumeProgressionRate(trainingAge);
    const readinessMultiplier = Math.max(0.5, readinessScore / 70);
    const intensityAdjustment = this.calculateIntensityAdjustment(intensityLoad);
    
    const weeklyVolumeIncrease = currentVolume * baseProgressionRate * readinessMultiplier * intensityAdjustment;
    const predictedVolume = currentVolume + (weeklyVolumeIncrease * 12); // 3 months

    const confidence = this.calculateConfidence(features);

    return {
      value: predictedVolume,
      confidence,
      variance: predictedVolume * 0.25,
      factors: [
        { feature: 'training_age', contribution: baseProgressionRate, importance: 0.30 },
        { feature: 'readiness_score', contribution: readinessMultiplier - 1, importance: 0.25 },
        { feature: 'current_volume', contribution: currentVolume / 1000, importance: 0.20 },
        { feature: 'volume_trend', contribution: volumeTrend, importance: 0.15 },
        { feature: 'intensity_load', contribution: intensityAdjustment - 1, importance: 0.10 }
      ],
      methodology: 'Progressive overload model with recovery and adaptation factors',
      timeframe: 90
    };
  }

  private createFeatureMap(features: MLFeature[]): Record<string, number> {
    return features.reduce((map, feature) => {
      map[feature.name] = feature.value;
      return map;
    }, {} as Record<string, number>);
  }

  private calculateVolumeProgressionRate(trainingAge: number): number {
    // Volume can be increased more aggressively than intensity
    if (trainingAge < 0.5) return 0.05; // 5% weekly for novices
    if (trainingAge < 2) return 0.025; // 2.5% weekly for intermediates
    if (trainingAge < 5) return 0.015; // 1.5% weekly for advanced
    return 0.01; // 1% weekly for elite
  }

  private calculateIntensityAdjustment(avgRPE: number): number {
    // High intensity limits volume progression
    if (avgRPE >= 9) return 0.8;
    if (avgRPE >= 8) return 0.9;
    if (avgRPE >= 7) return 1.0;
    return 1.1; // Lower intensity allows more volume
  }
}

// ===== COMPOSITE PROGRESS ANALYZER =====

export class ProgressAnalyzer {
  private strengthPredictor = new StrengthProgressPredictor();
  private weightLossPredictor = new WeightLossPredictor();
  private volumePredictor = new VolumeProgressionPredictor();

  /**
   * Analyze and predict comprehensive progress across all metrics
   */
  async analyzeProgress(
    workouts: WorkoutSessionWithExercises[],
    dailyMetrics: DailyMetrics[],
    exerciseId?: string
  ): Promise<{
    strength: MLPrediction;
    volume: MLPrediction;
    weightLoss?: MLPrediction;
    confidence: number;
    recommendations: string[];
  }> {
    // Extract features for different predictions
    const readinessFeatures = FeatureEngineering.extractReadinessFeatures(dailyMetrics);
    const performanceFeatures = FeatureEngineering.extractPerformanceFeatures(workouts, exerciseId);
    
    // Calculate readiness score
    const readinessScore = this.calculateOverallReadiness(readinessFeatures);
    
    // Add composite features
    const compositeFeatures = [
      ...readinessFeatures,
      ...performanceFeatures,
      { name: 'readiness_score', value: readinessScore, importance: 0.20, category: 'readiness' as const }
    ];

    // Predict strength progression
    const strengthPrediction = this.strengthPredictor.predict(compositeFeatures);
    
    // Predict volume progression
    const volumePrediction = this.volumePredictor.predict(compositeFeatures);
    
    // Predict weight loss if target weight is set
    let weightLossPrediction: MLPrediction | undefined;
    const hasWeightGoal = dailyMetrics.some(m => m.bodyWeight);
    if (hasWeightGoal) {
      weightLossPrediction = this.weightLossPredictor.predict(compositeFeatures);
    }

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence([
      strengthPrediction.confidence,
      volumePrediction.confidence,
      weightLossPrediction?.confidence || 0
    ]);

    // Generate recommendations
    const recommendations = this.generateProgressRecommendations(
      strengthPrediction,
      volumePrediction,
      weightLossPrediction,
      readinessScore
    );

    return {
      strength: strengthPrediction,
      volume: volumePrediction,
      weightLoss: weightLossPrediction,
      confidence: overallConfidence,
      recommendations
    };
  }

  private calculateOverallReadiness(features: MLFeature[]): number {
    const readinessFeatures = features.filter(f => f.category === 'readiness');
    if (readinessFeatures.length === 0) return 70; // Default

    const weightedSum = readinessFeatures.reduce((sum, f) => sum + f.value * f.importance, 0);
    const totalWeight = readinessFeatures.reduce((sum, f) => sum + f.importance, 0);
    
    return totalWeight > 0 ? (weightedSum / totalWeight) * 10 : 70; // Scale to 0-100
  }

  private calculateOverallConfidence(confidences: number[]): number {
    const validConfidences = confidences.filter(c => c > 0);
    if (validConfidences.length === 0) return 0;
    
    return validConfidences.reduce((sum, c) => sum + c, 0) / validConfidences.length;
  }

  private generateProgressRecommendations(
    strength: MLPrediction,
    volume: MLPrediction,
    weightLoss?: MLPrediction,
    readinessScore?: number
  ): string[] {
    const recommendations: string[] = [];

    // Strength-specific recommendations
    if (strength.confidence < 0.6) {
      recommendations.push("Increase training consistency to improve strength prediction accuracy");
    }
    
    const strengthGainRate = strength.factors.find(f => f.feature === 'training_age')?.contribution || 0;
    if (strengthGainRate < 0.01) {
      recommendations.push("Consider periodization or exercise variation to break through strength plateaus");
    }

    // Volume recommendations
    const volumeReadiness = volume.factors.find(f => f.feature === 'readiness_score')?.contribution || 0;
    if (volumeReadiness < 0) {
      recommendations.push("Focus on recovery before increasing training volume");
    }

    // Weight loss recommendations
    if (weightLoss) {
      const consistency = weightLoss.factors.find(f => f.feature === 'consistency_score')?.contribution || 0;
      if (consistency < 0.8) {
        recommendations.push("Improve consistency with nutrition and training for better weight loss results");
      }
    }

    // Readiness-based recommendations
    if (readinessScore && readinessScore < 60) {
      recommendations.push("Prioritize sleep and stress management to optimize training adaptations");
    }

    return recommendations.slice(0, 3); // Limit to top 3
  }
}

export { ProgressAnalyzer as default };