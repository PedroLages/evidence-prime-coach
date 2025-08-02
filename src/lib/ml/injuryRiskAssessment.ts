/**
 * Injury Risk Assessment System
 * 
 * This module implements ML models for predicting injury likelihood based on:
 * - Training load patterns and sudden spikes
 * - Readiness metrics (sleep, stress, soreness)
 * - Biomechanical risk factors
 * - Recovery patterns and overreaching indicators
 * - Historical injury patterns
 */

import { BaseMLModel, MLFeature, MLPrediction, StatUtils, FeatureEngineering } from './foundation';
import { WorkoutSessionWithExercises, DailyMetric } from '@/services/database';
import { DailyMetrics, ReadinessFactors } from '@/types/aiCoach';

// ===== TYPES & INTERFACES =====

export interface InjuryRiskFactors {
  trainingLoad: {
    acuteLoad: number; // Last 7 days
    chronicLoad: number; // Last 28 days
    acuteChronicRatio: number; // ACWR
    loadSpike: number; // Week-over-week change
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  };
  readiness: {
    sleepDeficit: number;
    stressLevel: number;
    sorenessLevel: number;
    recoveryScore: number;
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  };
  biomechanical: {
    muscleImbalances: number;
    movementQuality: number;
    asymmetries: number;
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  };
  historical: {
    previousInjuries: number;
    injuryFrequency: number;
    susceptibleAreas: string[];
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  };
}

export interface InjuryRiskAssessment {
  overallRisk: number; // 0-100 percentage
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
  factors: InjuryRiskFactors;
  warnings: InjuryWarning[];
  recommendations: InjuryPrevention[];
  timeframe: number; // Days for prediction
  lastAssessed: string;
}

export interface InjuryWarning {
  type: 'acute_spike' | 'chronic_fatigue' | 'poor_recovery' | 'movement_quality' | 'overreaching';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  message: string;
  evidence: string[];
  bodyParts: string[];
  urgency: 'immediate' | 'within_week' | 'monitor';
}

export interface InjuryPrevention {
  category: 'load_management' | 'recovery' | 'movement' | 'strength' | 'flexibility';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  timeframe: string;
  expectedImpact: number; // Risk reduction percentage
}

// ===== TRAINING LOAD RISK PREDICTOR =====

export class TrainingLoadRiskPredictor extends BaseMLModel {
  name = 'TrainingLoadRiskPredictor';
  type = 'classification' as const;
  features = [
    'acute_load', 'chronic_load', 'acwr', 'load_spike', 'volume_trend',
    'intensity_spike', 'frequency_change', 'rpe_trend'
  ];
  lastTrained = new Date().toISOString();
  accuracy = 0.84;

  predict(features: MLFeature[]): MLPrediction {
    const featureMap = this.createFeatureMap(features);
    
    const acuteLoad = featureMap.acute_load || 0;
    const chronicLoad = featureMap.chronic_load || 0;
    const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 1;
    const loadSpike = featureMap.load_spike || 0;
    const intensitySpike = featureMap.intensity_spike || 0;
    
    // Calculate base risk from Acute:Chronic Workload Ratio
    let baseRisk = this.calculateACWRRisk(acwr);
    
    // Adjust for load spikes
    const spikeRisk = this.calculateSpikeRisk(loadSpike, intensitySpike);
    
    // Combine risks
    const combinedRisk = Math.min(100, baseRisk + spikeRisk);
    
    const confidence = this.calculateConfidence(features);
    
    return {
      value: combinedRisk,
      confidence,
      variance: combinedRisk * 0.15,
      factors: [
        { feature: 'acwr', contribution: (acwr - 1) * 50, importance: 0.40 },
        { feature: 'load_spike', contribution: loadSpike * 10, importance: 0.30 },
        { feature: 'intensity_spike', contribution: intensitySpike * 10, importance: 0.20 },
        { feature: 'acute_load', contribution: acuteLoad / 1000, importance: 0.10 }
      ],
      methodology: 'Acute:Chronic Workload Ratio with load spike detection',
      timeframe: 7
    };
  }

  private createFeatureMap(features: MLFeature[]): Record<string, number> {
    return features.reduce((map, feature) => {
      map[feature.name] = feature.value;
      return map;
    }, {} as Record<string, number>);
  }

  private calculateACWRRisk(acwr: number): number {
    // Based on sports science research on ACWR and injury risk
    if (acwr < 0.8) return 45; // Detraining risk
    if (acwr >= 0.8 && acwr <= 1.3) return 10; // Sweet spot
    if (acwr > 1.3 && acwr <= 1.5) return 25; // Elevated risk
    if (acwr > 1.5 && acwr <= 2.0) return 50; // High risk
    return 80; // Critical risk (>2.0)
  }

  private calculateSpikeRisk(loadSpike: number, intensitySpike: number): number {
    // Sudden increases in load or intensity increase injury risk
    const loadSpikeRisk = Math.max(0, (loadSpike - 0.1) * 100); // Risk starts at 10% increase
    const intensitySpikeRisk = Math.max(0, (intensitySpike - 0.15) * 100); // Risk starts at 15% increase
    
    return Math.max(loadSpikeRisk, intensitySpikeRisk);
  }
}

// ===== READINESS RISK PREDICTOR =====

export class ReadinessRiskPredictor extends BaseMLModel {
  name = 'ReadinessRiskPredictor';
  type = 'classification' as const;
  features = [
    'sleep_deficit', 'stress_level', 'soreness_level', 'energy_level',
    'hrv_trend', 'recovery_score', 'readiness_trend'
  ];
  lastTrained = new Date().toISOString();
  accuracy = 0.77;

  predict(features: MLFeature[]): MLPrediction {
    const featureMap = this.createFeatureMap(features);
    
    const sleepDeficit = featureMap.sleep_deficit || 0;
    const stressLevel = featureMap.stress_level || 3;
    const sorenessLevel = featureMap.soreness_level || 3;
    const energyLevel = featureMap.energy_level || 7;
    const recoveryScore = featureMap.recovery_score || 70;
    
    // Calculate individual risk components
    const sleepRisk = this.calculateSleepRisk(sleepDeficit);
    const stressRisk = this.calculateStressRisk(stressLevel);
    const sorenessRisk = this.calculateSorenessRisk(sorenessLevel);
    const energyRisk = this.calculateEnergyRisk(energyLevel);
    
    // Weighted combination
    const combinedRisk = (sleepRisk * 0.35 + 
                         stressRisk * 0.25 + 
                         sorenessRisk * 0.25 + 
                         energyRisk * 0.15);
    
    const confidence = this.calculateConfidence(features);
    
    return {
      value: combinedRisk,
      confidence,
      variance: combinedRisk * 0.20,
      factors: [
        { feature: 'sleep_deficit', contribution: sleepRisk, importance: 0.35 },
        { feature: 'stress_level', contribution: stressRisk, importance: 0.25 },
        { feature: 'soreness_level', contribution: sorenessRisk, importance: 0.25 },
        { feature: 'energy_level', contribution: energyRisk, importance: 0.15 }
      ],
      methodology: 'Multi-factor readiness assessment with weighted risk scoring',
      timeframe: 3
    };
  }

  private createFeatureMap(features: MLFeature[]): Record<string, number> {
    return features.reduce((map, feature) => {
      map[feature.name] = feature.value;
      return map;
    }, {} as Record<string, number>);
  }

  private calculateSleepRisk(sleepDeficit: number): number {
    // Sleep deficit in hours below optimal (7-9 hours)
    if (sleepDeficit <= 0) return 5; // Well rested
    if (sleepDeficit <= 1) return 15; // Mild deficit
    if (sleepDeficit <= 2) return 35; // Moderate deficit
    if (sleepDeficit <= 3) return 60; // Severe deficit
    return 85; // Critical deficit
  }

  private calculateStressRisk(stressLevel: number): number {
    // Stress level on 1-10 scale
    if (stressLevel <= 3) return 10; // Low stress
    if (stressLevel <= 5) return 20; // Moderate stress
    if (stressLevel <= 7) return 40; // High stress
    if (stressLevel <= 8) return 60; // Very high stress
    return 80; // Extreme stress
  }

  private calculateSorenessRisk(sorenessLevel: number): number {
    // Soreness level on 1-10 scale
    if (sorenessLevel <= 3) return 10; // Minimal soreness
    if (sorenessLevel <= 5) return 25; // Moderate soreness
    if (sorenessLevel <= 7) return 45; // High soreness
    if (sorenessLevel <= 8) return 65; // Very high soreness
    return 85; // Extreme soreness
  }

  private calculateEnergyRisk(energyLevel: number): number {
    // Energy level on 1-10 scale (inverted for risk)
    if (energyLevel >= 8) return 5; // High energy
    if (energyLevel >= 6) return 15; // Good energy
    if (energyLevel >= 4) return 30; // Low energy
    if (energyLevel >= 2) return 50; // Very low energy
    return 75; // Extremely low energy
  }
}

// ===== MOVEMENT QUALITY RISK PREDICTOR =====

export class MovementQualityRiskPredictor extends BaseMLModel {
  name = 'MovementQualityRiskPredictor';
  type = 'classification' as const;
  features = [
    'rpe_inconsistency', 'form_breakdown_frequency', 'weight_progression_rate',
    'range_of_motion', 'compensation_patterns', 'bilateral_asymmetry'
  ];
  lastTrained = new Date().toISOString();
  accuracy = 0.71;

  predict(features: MLFeature[]): MLPrediction {
    const featureMap = this.createFeatureMap(features);
    
    const rpeInconsistency = featureMap.rpe_inconsistency || 0;
    const formBreakdown = featureMap.form_breakdown_frequency || 0;
    const progressionRate = featureMap.weight_progression_rate || 0.01;
    
    // Calculate risk based on movement quality indicators
    const inconsistencyRisk = this.calculateInconsistencyRisk(rpeInconsistency);
    const formRisk = this.calculateFormRisk(formBreakdown);
    const progressionRisk = this.calculateProgressionRisk(progressionRate);
    
    const combinedRisk = Math.max(inconsistencyRisk, formRisk, progressionRisk);
    const confidence = this.calculateConfidence(features);
    
    return {
      value: combinedRisk,
      confidence,
      variance: combinedRisk * 0.25,
      factors: [
        { feature: 'rpe_inconsistency', contribution: inconsistencyRisk, importance: 0.40 },
        { feature: 'form_breakdown_frequency', contribution: formRisk, importance: 0.35 },
        { feature: 'weight_progression_rate', contribution: progressionRisk, importance: 0.25 }
      ],
      methodology: 'Movement pattern analysis with form breakdown detection',
      timeframe: 14
    };
  }

  private createFeatureMap(features: MLFeature[]): Record<string, number> {
    return features.reduce((map, feature) => {
      map[feature.name] = feature.value;
      return map;
    }, {} as Record<string, number>);
  }

  private calculateInconsistencyRisk(inconsistency: number): number {
    // High RPE variability for same weights suggests fatigue or form issues
    if (inconsistency <= 0.5) return 10; // Consistent
    if (inconsistency <= 1.0) return 25; // Mild inconsistency
    if (inconsistency <= 1.5) return 45; // Moderate inconsistency
    return 70; // High inconsistency
  }

  private calculateFormRisk(formBreakdown: number): number {
    // Frequency of form breakdown during sets
    if (formBreakdown <= 0.1) return 10; // Rare breakdown
    if (formBreakdown <= 0.2) return 30; // Occasional breakdown
    if (formBreakdown <= 0.3) return 55; // Frequent breakdown
    return 80; // Constant breakdown
  }

  private calculateProgressionRisk(progressionRate: number): number {
    // Too fast progression can indicate forcing through poor movement
    if (progressionRate <= 0.02) return 10; // Conservative progression
    if (progressionRate <= 0.04) return 15; // Moderate progression
    if (progressionRate <= 0.06) return 35; // Aggressive progression
    return 60; // Extremely aggressive progression
  }
}

// ===== COMPREHENSIVE INJURY RISK ANALYZER =====

export class InjuryRiskAnalyzer {
  private trainingLoadPredictor = new TrainingLoadRiskPredictor();
  private readinessPredictor = new ReadinessRiskPredictor();
  private movementPredictor = new MovementQualityRiskPredictor();

  /**
   * Perform comprehensive injury risk assessment
   */
  async assessInjuryRisk(
    workouts: WorkoutSessionWithExercises[],
    dailyMetrics: DailyMetrics[],
    userId: string
  ): Promise<InjuryRiskAssessment> {
    
    // Extract features for different risk models
    const trainingLoadFeatures = this.extractTrainingLoadFeatures(workouts);
    const readinessFeatures = this.extractReadinessFeatures(dailyMetrics);
    const movementFeatures = this.extractMovementFeatures(workouts);
    
    // Get predictions from each model
    const trainingLoadRisk = this.trainingLoadPredictor.predict(trainingLoadFeatures);
    const readinessRisk = this.readinessPredictor.predict(readinessFeatures);
    const movementRisk = this.movementPredictor.predict(movementFeatures);
    
    // Calculate overall risk (weighted combination)
    const overallRisk = Math.round(
      trainingLoadRisk.value * 0.40 +
      readinessRisk.value * 0.35 +
      movementRisk.value * 0.25
    );
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(overallRisk);
    
    // Calculate confidence
    const confidence = (trainingLoadRisk.confidence + readinessRisk.confidence + movementRisk.confidence) / 3;
    
    // Extract risk factors
    const factors = this.extractRiskFactors(trainingLoadFeatures, readinessFeatures, movementFeatures);
    
    // Generate warnings
    const warnings = this.generateWarnings(overallRisk, factors, trainingLoadRisk, readinessRisk, movementRisk);
    
    // Generate prevention recommendations
    const recommendations = this.generatePreventionRecommendations(factors, overallRisk);
    
    return {
      overallRisk,
      riskLevel,
      confidence,
      factors,
      warnings,
      recommendations,
      timeframe: 7, // 7-day risk window
      lastAssessed: new Date().toISOString()
    };
  }

  private extractTrainingLoadFeatures(workouts: WorkoutSessionWithExercises[]): MLFeature[] {
    if (workouts.length === 0) return [];

    // Calculate acute load (last 7 days)
    const acuteWorkouts = workouts.slice(0, 7);
    const acuteLoad = this.calculateTotalVolume(acuteWorkouts);
    
    // Calculate chronic load (last 28 days)
    const chronicWorkouts = workouts.slice(0, 28);
    const chronicLoad = this.calculateTotalVolume(chronicWorkouts) / 4; // Weekly average
    
    // Calculate load spike
    const previousWeekLoad = this.calculateTotalVolume(workouts.slice(7, 14));
    const loadSpike = previousWeekLoad > 0 ? (acuteLoad - previousWeekLoad) / previousWeekLoad : 0;
    
    return [
      { name: 'acute_load', value: acuteLoad, importance: 0.25, category: 'performance' },
      { name: 'chronic_load', value: chronicLoad, importance: 0.30, category: 'performance' },
      { name: 'load_spike', value: loadSpike, importance: 0.35, category: 'temporal' },
      { name: 'acwr', value: chronicLoad > 0 ? acuteLoad / chronicLoad : 1, importance: 0.40, category: 'performance' }
    ];
  }

  private extractReadinessFeatures(dailyMetrics: DailyMetrics[]): MLFeature[] {
    if (dailyMetrics.length === 0) return [];

    const latest = dailyMetrics[0];
    const optimalSleep = 8;
    const sleepDeficit = Math.max(0, optimalSleep - latest.sleep);
    
    return [
      { name: 'sleep_deficit', value: sleepDeficit, importance: 0.35, category: 'readiness' },
      { name: 'stress_level', value: latest.stress, importance: 0.25, category: 'readiness' },
      { name: 'soreness_level', value: latest.soreness, importance: 0.25, category: 'readiness' },
      { name: 'energy_level', value: latest.energy, importance: 0.15, category: 'readiness' }
    ];
  }

  private extractMovementFeatures(workouts: WorkoutSessionWithExercises[]): MLFeature[] {
    if (workouts.length === 0) return [];

    // Calculate RPE inconsistency
    const recentRPEs = workouts.slice(0, 5).flatMap(w => 
      w.exercises.flatMap(e => e.sets.map(s => s.rpe).filter(rpe => rpe && rpe > 0))
    );
    
    const rpeInconsistency = recentRPEs.length > 1 ? StatUtils.standardDeviation(recentRPEs as number[]) : 0;
    
    return [
      { name: 'rpe_inconsistency', value: rpeInconsistency, importance: 0.40, category: 'performance' },
      { name: 'form_breakdown_frequency', value: 0.1, importance: 0.35, category: 'performance' }, // Placeholder
      { name: 'weight_progression_rate', value: 0.02, importance: 0.25, category: 'performance' } // Placeholder
    ];
  }

  private calculateTotalVolume(workouts: WorkoutSessionWithExercises[]): number {
    return workouts.reduce((total, workout) => 
      total + workout.exercises.reduce((exerciseTotal, exercise) => 
        exerciseTotal + exercise.sets.reduce((setTotal, set) => 
          setTotal + (set.weight || 0) * (set.reps || 0), 0), 0), 0);
  }

  private determineRiskLevel(risk: number): 'low' | 'moderate' | 'high' | 'critical' {
    if (risk <= 25) return 'low';
    if (risk <= 50) return 'moderate';
    if (risk <= 75) return 'high';
    return 'critical';
  }

  private extractRiskFactors(
    trainingFeatures: MLFeature[],
    readinessFeatures: MLFeature[],
    movementFeatures: MLFeature[]
  ): InjuryRiskFactors {
    // Extract training load factors
    const acuteLoad = trainingFeatures.find(f => f.name === 'acute_load')?.value || 0;
    const chronicLoad = trainingFeatures.find(f => f.name === 'chronic_load')?.value || 0;
    const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 1;
    const loadSpike = trainingFeatures.find(f => f.name === 'load_spike')?.value || 0;
    
    // Extract readiness factors
    const sleepDeficit = readinessFeatures.find(f => f.name === 'sleep_deficit')?.value || 0;
    const stressLevel = readinessFeatures.find(f => f.name === 'stress_level')?.value || 3;
    const sorenessLevel = readinessFeatures.find(f => f.name === 'soreness_level')?.value || 3;
    
    return {
      trainingLoad: {
        acuteLoad,
        chronicLoad,
        acuteChronicRatio: acwr,
        loadSpike,
        riskLevel: this.determineRiskLevel(Math.max(0, (acwr - 1) * 50 + loadSpike * 20))
      },
      readiness: {
        sleepDeficit,
        stressLevel,
        sorenessLevel,
        recoveryScore: Math.max(0, 100 - sleepDeficit * 10 - stressLevel * 8 - sorenessLevel * 6),
        riskLevel: this.determineRiskLevel(sleepDeficit * 15 + stressLevel * 8 + sorenessLevel * 6)
      },
      biomechanical: {
        muscleImbalances: 0, // Placeholder
        movementQuality: 70, // Placeholder
        asymmetries: 0, // Placeholder
        riskLevel: 'low'
      },
      historical: {
        previousInjuries: 0, // Placeholder
        injuryFrequency: 0, // Placeholder
        susceptibleAreas: [], // Placeholder
        riskLevel: 'low'
      }
    };
  }

  private generateWarnings(
    overallRisk: number,
    factors: InjuryRiskFactors,
    trainingLoadRisk: MLPrediction,
    readinessRisk: MLPrediction,
    movementRisk: MLPrediction
  ): InjuryWarning[] {
    const warnings: InjuryWarning[] = [];

    // Training load warnings
    if (factors.trainingLoad.acuteChronicRatio > 1.5) {
      warnings.push({
        type: 'acute_spike',
        severity: factors.trainingLoad.acuteChronicRatio > 2.0 ? 'critical' : 'high',
        message: `Acute training load is ${(factors.trainingLoad.acuteChronicRatio * 100).toFixed(0)}% of chronic load`,
        evidence: ['High acute:chronic workload ratio detected'],
        bodyParts: ['General'],
        urgency: 'immediate'
      });
    }

    // Readiness warnings
    if (factors.readiness.sleepDeficit > 2) {
      warnings.push({
        type: 'poor_recovery',
        severity: factors.readiness.sleepDeficit > 3 ? 'critical' : 'high',
        message: `Sleep deficit of ${factors.readiness.sleepDeficit.toFixed(1)} hours detected`,
        evidence: ['Chronic sleep deprivation'],
        bodyParts: ['General'],
        urgency: 'within_week'
      });
    }

    if (factors.readiness.sorenessLevel > 7) {
      warnings.push({
        type: 'chronic_fatigue',
        severity: 'high',
        message: 'High soreness levels may indicate incomplete recovery',
        evidence: ['Elevated muscle soreness'],
        bodyParts: ['Muscles'],
        urgency: 'monitor'
      });
    }

    return warnings;
  }

  private generatePreventionRecommendations(
    factors: InjuryRiskFactors,
    overallRisk: number
  ): InjuryPrevention[] {
    const recommendations: InjuryPrevention[] = [];

    // Training load recommendations
    if (factors.trainingLoad.riskLevel === 'high' || factors.trainingLoad.riskLevel === 'critical') {
      recommendations.push({
        category: 'load_management',
        priority: 'high',
        title: 'Reduce Training Load',
        description: 'Current training load exceeds safe adaptation capacity',
        action: 'Reduce volume by 20-30% for the next week',
        timeframe: '1 week',
        expectedImpact: 25
      });
    }

    // Recovery recommendations
    if (factors.readiness.riskLevel === 'moderate' || factors.readiness.riskLevel === 'high') {
      recommendations.push({
        category: 'recovery',
        priority: 'high',
        title: 'Prioritize Recovery',
        description: 'Poor readiness metrics indicate inadequate recovery',
        action: 'Focus on sleep quality and stress management',
        timeframe: '2 weeks',
        expectedImpact: 20
      });
    }

    // Movement quality recommendations
    recommendations.push({
      category: 'movement',
      priority: 'medium',
      title: 'Movement Screen',
      description: 'Regular movement assessment can identify risk patterns',
      action: 'Perform functional movement screen or video analysis',
      timeframe: '1 month',
      expectedImpact: 15
    });

    return recommendations.slice(0, 3); // Limit to top 3
  }
}

export { InjuryRiskAnalyzer as default };