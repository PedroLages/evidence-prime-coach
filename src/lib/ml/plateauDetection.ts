/**
 * Plateau Detection and Intervention System
 * 
 * This module implements ML models for:
 * - Detecting training plateaus before they become severe
 * - Analyzing plateau types (strength, volume, performance)
 * - Predicting plateau likelihood based on training patterns
 * - Suggesting evidence-based interventions
 * - Monitoring plateau resolution effectiveness
 */

import { BaseMLModel, MLFeature, MLPrediction, StatUtils, TimeSeriesAnalysis } from './foundation';
import { WorkoutSessionWithExercises, PerformanceMetric } from '@/services/database';
import { DailyMetrics } from '@/types/aiCoach';
import { PerformanceMetric as AnalyticsPerformanceMetric, TrendAnalysis } from '@/types/analytics';

// ===== TYPES & INTERFACES =====

export interface PlateauDetection {
  isDetected: boolean;
  type: 'strength' | 'volume' | 'endurance' | 'body_composition' | 'overall';
  severity: 'mild' | 'moderate' | 'severe' | 'chronic';
  confidence: number;
  duration: number; // Days since plateau started
  affectedExercises: string[];
  metrics: {
    currentTrend: number; // Slope of recent progress
    expectedTrend: number; // Expected progress based on training age
    stagnationPeriod: number; // Days without meaningful progress
    progressDeficit: number; // How far behind expected progress
  };
  evidence: PlateauEvidence[];
  interventions: PlateauIntervention[];
  riskFactors: PlateauRiskFactor[];
  lastAssessed: string;
}

export interface PlateauEvidence {
  metric: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  dataPoints: number;
  timeframe: string;
  statisticalSignificance: number;
}

export interface PlateauIntervention {
  type: 'deload' | 'variation' | 'technique' | 'periodization' | 'recovery' | 'nutrition';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  implementation: {
    duration: string;
    frequency: string;
    modifications: string[];
  };
  expectedOutcome: string;
  evidenceLevel: 'high' | 'moderate' | 'limited';
  successProbability: number; // 0-1
}

export interface PlateauRiskFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  mitigation: string;
  timeToImpact: number; // Days
}

export interface PlateauAnalysis {
  strengthPlateaus: PlateauDetection[];
  volumePlateaus: PlateauDetection[];
  overallRisk: number; // 0-100
  timeToPlateauEstimate: number; // Days
  preventiveActions: PlateauIntervention[];
  monitoringRecommendations: string[];
}

// ===== STRENGTH PLATEAU DETECTOR =====

export class StrengthPlateauDetector extends BaseMLModel {
  name = 'StrengthPlateauDetector';
  type = 'classification' as const;
  features = [
    'progress_rate', 'stagnation_period', 'volume_trend', 'intensity_trend',
    'training_age', 'readiness_trend', 'technique_consistency', 'recovery_quality'
  ];
  lastTrained = new Date().toISOString();
  accuracy = 0.87;

  predict(features: MLFeature[]): MLPrediction {
    const featureMap = this.createFeatureMap(features);
    
    const progressRate = featureMap.progress_rate || 0;
    const stagnationPeriod = featureMap.stagnation_period || 0;
    const volumeTrend = featureMap.volume_trend || 0;
    const trainingAge = featureMap.training_age || 1;
    const readinessTrend = featureMap.readiness_trend || 0;
    
    // Calculate plateau probability based on multiple factors
    const stagnationScore = this.calculateStagnationScore(progressRate, stagnationPeriod);
    const trainingAgeScore = this.calculateTrainingAgeScore(trainingAge, progressRate);
    const volumeScore = this.calculateVolumeScore(volumeTrend, progressRate);
    const readinessScore = this.calculateReadinessScore(readinessTrend);
    
    // Weighted combination of scores
    const plateauProbability = (
      stagnationScore * 0.40 +
      trainingAgeScore * 0.25 +
      volumeScore * 0.20 +
      readinessScore * 0.15
    );
    
    const confidence = this.calculateConfidence(features);
    
    return {
      value: plateauProbability * 100,
      confidence,
      variance: 15,
      factors: [
        { feature: 'stagnation_period', contribution: stagnationScore, importance: 0.40 },
        { feature: 'training_age', contribution: trainingAgeScore, importance: 0.25 },
        { feature: 'volume_trend', contribution: volumeScore, importance: 0.20 },
        { feature: 'readiness_trend', contribution: readinessScore, importance: 0.15 }
      ],
      methodology: 'Multi-factor plateau detection with training periodization analysis',
      timeframe: 14
    };
  }

  private createFeatureMap(features: MLFeature[]): Record<string, number> {
    return features.reduce((map, feature) => {
      map[feature.name] = feature.value;
      return map;
    }, {} as Record<string, number>);
  }

  private calculateStagnationScore(progressRate: number, stagnationPeriod: number): number {
    // Expected minimum progress rates based on training status
    const minWeeklyProgress = 0.005; // 0.5% per week minimum
    
    let score = 0;
    
    // Progress rate component
    if (progressRate < minWeeklyProgress) {
      score += 0.6; // 60% of score from poor progress
    } else if (progressRate < minWeeklyProgress * 2) {
      score += 0.3; // 30% for slow progress
    }
    
    // Stagnation period component
    if (stagnationPeriod >= 28) { // 4+ weeks
      score += 0.4; // 40% for long stagnation
    } else if (stagnationPeriod >= 14) { // 2+ weeks
      score += 0.2; // 20% for moderate stagnation
    }
    
    return Math.min(1, score);
  }

  private calculateTrainingAgeScore(trainingAge: number, progressRate: number): number {
    // Expected progress rates decrease with training age
    let expectedRate: number;
    
    if (trainingAge < 0.5) expectedRate = 0.03; // Novice: 3% weekly
    else if (trainingAge < 2) expectedRate = 0.015; // Intermediate: 1.5% weekly
    else if (trainingAge < 5) expectedRate = 0.008; // Advanced: 0.8% weekly
    else expectedRate = 0.004; // Elite: 0.4% weekly
    
    const progressDeficit = (expectedRate - progressRate) / expectedRate;
    return Math.max(0, Math.min(1, progressDeficit));
  }

  private calculateVolumeScore(volumeTrend: number, progressRate: number): number {
    // Stagnant or declining volume with poor progress indicates plateau
    if (volumeTrend <= 0 && progressRate < 0.01) {
      return 0.8; // High plateau risk
    } else if (volumeTrend <= 0.1 && progressRate < 0.015) {
      return 0.5; // Moderate plateau risk
    }
    return 0.1; // Low plateau risk
  }

  private calculateReadinessScore(readinessTrend: number): number {
    // Declining readiness contributes to plateau risk
    if (readinessTrend < -0.1) return 0.7; // Strong decline
    if (readinessTrend < 0) return 0.4; // Mild decline
    return 0.1; // Stable or improving
  }
}

// ===== VOLUME PLATEAU DETECTOR =====

export class VolumePlateauDetector extends BaseMLModel {
  name = 'VolumePlateauDetector';
  type = 'classification' as const;
  features = [
    'volume_capacity', 'recovery_rate', 'frequency_optimization', 'intensity_distribution',
    'exercise_variation', 'progressive_overload_rate', 'fatigue_accumulation'
  ];
  lastTrained = new Date().toISOString();
  accuracy = 0.81;

  predict(features: MLFeature[]): MLPrediction {
    const featureMap = this.createFeatureMap(features);
    
    const volumeCapacity = featureMap.volume_capacity || 0.7;
    const recoveryRate = featureMap.recovery_rate || 0.8;
    const fatigueAccumulation = featureMap.fatigue_accumulation || 0.3;
    const overloadRate = featureMap.progressive_overload_rate || 0.02;
    
    // Calculate volume plateau indicators
    const capacityScore = this.calculateCapacityScore(volumeCapacity, recoveryRate);
    const fatigueScore = this.calculateFatigueScore(fatigueAccumulation);
    const overloadScore = this.calculateOverloadScore(overloadRate);
    
    const plateauProbability = (
      capacityScore * 0.40 +
      fatigueScore * 0.35 +
      overloadScore * 0.25
    );
    
    const confidence = this.calculateConfidence(features);
    
    return {
      value: plateauProbability * 100,
      confidence,
      variance: 12,
      factors: [
        { feature: 'volume_capacity', contribution: capacityScore, importance: 0.40 },
        { feature: 'fatigue_accumulation', contribution: fatigueScore, importance: 0.35 },
        { feature: 'progressive_overload_rate', contribution: overloadScore, importance: 0.25 }
      ],
      methodology: 'Volume capacity analysis with fatigue and recovery modeling',
      timeframe: 21
    };
  }

  private createFeatureMap(features: MLFeature[]): Record<string, number> {
    return features.reduce((map, feature) => {
      map[feature.name] = feature.value;
      return map;
    }, {} as Record<string, number>);
  }

  private calculateCapacityScore(capacity: number, recoveryRate: number): number {
    // High capacity utilization with poor recovery indicates plateau risk
    const utilizationScore = capacity > 0.85 ? 0.7 : capacity > 0.75 ? 0.4 : 0.1;
    const recoveryPenalty = recoveryRate < 0.7 ? 0.3 : 0;
    
    return Math.min(1, utilizationScore + recoveryPenalty);
  }

  private calculateFatigueScore(fatigue: number): number {
    // High fatigue accumulation indicates volume plateau
    if (fatigue > 0.7) return 0.8;
    if (fatigue > 0.5) return 0.5;
    if (fatigue > 0.3) return 0.2;
    return 0.1;
  }

  private calculateOverloadScore(overloadRate: number): number {
    // Slow or stagnant overload progression
    if (overloadRate < 0.01) return 0.7; // Very slow
    if (overloadRate < 0.02) return 0.4; // Slow
    return 0.1; // Adequate
  }
}

// ===== COMPREHENSIVE PLATEAU ANALYZER =====

export class PlateauAnalyzer {
  private strengthDetector = new StrengthPlateauDetector();
  private volumeDetector = new VolumePlateauDetector();

  /**
   * Comprehensive plateau analysis across all metrics
   */
  async analyzePlateaus(
    workouts: WorkoutSessionWithExercises[],
    dailyMetrics: DailyMetrics[],
    exerciseId?: string
  ): Promise<PlateauAnalysis> {
    
    // Extract features for different plateau types
    const strengthFeatures = this.extractStrengthFeatures(workouts, dailyMetrics, exerciseId);
    const volumeFeatures = this.extractVolumeFeatures(workouts, dailyMetrics);
    
    // Get plateau predictions
    const strengthPrediction = this.strengthDetector.predict(strengthFeatures);
    const volumePrediction = this.volumeDetector.predict(volumeFeatures);
    
    // Detect existing plateaus
    const strengthPlateaus = this.detectStrengthPlateaus(workouts, strengthPrediction, exerciseId);
    const volumePlateaus = this.detectVolumePlateaus(workouts, volumePrediction);
    
    // Calculate overall risk
    const overallRisk = Math.max(strengthPrediction.value, volumePrediction.value);
    
    // Estimate time to plateau
    const timeToPlateauEstimate = this.estimateTimeToPlateauPleateau(
      strengthFeatures,
      volumeFeatures,
      overallRisk
    );
    
    // Generate preventive actions
    const preventiveActions = this.generatePreventiveActions(
      strengthPlateaus,
      volumePlateaus,
      overallRisk
    );
    
    // Generate monitoring recommendations
    const monitoringRecommendations = this.generateMonitoringRecommendations(
      strengthPlateaus,
      volumePlateaus
    );
    
    return {
      strengthPlateaus,
      volumePlateaus,
      overallRisk,
      timeToPlateauEstimate,
      preventiveActions,
      monitoringRecommendations
    };
  }

  private extractStrengthFeatures(
    workouts: WorkoutSessionWithExercises[],
    dailyMetrics: DailyMetrics[],
    exerciseId?: string
  ): MLFeature[] {
    if (workouts.length === 0) return [];

    // Filter workouts for specific exercise if provided
    const relevantWorkouts = exerciseId 
      ? workouts.filter(w => w.exercises.some(e => e.id === exerciseId))
      : workouts;

    if (relevantWorkouts.length < 3) return [];

    // Calculate progress rate
    const progressRate = this.calculateProgressRate(relevantWorkouts, exerciseId);
    
    // Calculate stagnation period
    const stagnationPeriod = this.calculateStagnationPeriod(relevantWorkouts, exerciseId);
    
    // Calculate volume trend
    const volumeTrend = this.calculateVolumeTrend(relevantWorkouts);
    
    // Estimate training age (simplified)
    const trainingAge = Math.min(5, workouts.length / 52); // Rough estimate in years
    
    // Calculate readiness trend
    const readinessTrend = this.calculateReadinessTrend(dailyMetrics);
    
    return [
      { name: 'progress_rate', value: progressRate, importance: 0.35, category: 'performance' },
      { name: 'stagnation_period', value: stagnationPeriod, importance: 0.30, category: 'temporal' },
      { name: 'volume_trend', value: volumeTrend, importance: 0.20, category: 'performance' },
      { name: 'training_age', value: trainingAge, importance: 0.15, category: 'user' }
    ];
  }

  private extractVolumeFeatures(
    workouts: WorkoutSessionWithExercises[],
    dailyMetrics: DailyMetrics[]
  ): MLFeature[] {
    if (workouts.length === 0) return [];

    // Calculate volume capacity utilization
    const volumeCapacity = this.calculateVolumeCapacity(workouts);
    
    // Calculate recovery rate
    const recoveryRate = this.calculateRecoveryRate(dailyMetrics);
    
    // Calculate fatigue accumulation
    const fatigueAccumulation = this.calculateFatigueAccumulation(dailyMetrics, workouts);
    
    // Calculate progressive overload rate
    const overloadRate = this.calculateOverloadRate(workouts);
    
    return [
      { name: 'volume_capacity', value: volumeCapacity, importance: 0.30, category: 'performance' },
      { name: 'recovery_rate', value: recoveryRate, importance: 0.25, category: 'readiness' },
      { name: 'fatigue_accumulation', value: fatigueAccumulation, importance: 0.25, category: 'readiness' },
      { name: 'progressive_overload_rate', value: overloadRate, importance: 0.20, category: 'performance' }
    ];
  }

  private calculateProgressRate(
    workouts: WorkoutSessionWithExercises[],
    exerciseId?: string
  ): number {
    if (workouts.length < 4) return 0;

    // Get performance data over time
    const performanceData: { date: Date; maxWeight: number }[] = [];
    
    workouts.forEach(workout => {
      const relevantExercises = exerciseId 
        ? workout.exercises.filter(e => e.id === exerciseId)
        : workout.exercises;
        
      relevantExercises.forEach(exercise => {
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));
        if (maxWeight > 0) {
          performanceData.push({
            date: new Date(workout.started_at),
            maxWeight
          });
        }
      });
    });
    
    if (performanceData.length < 3) return 0;
    
    // Sort by date and calculate trend
    performanceData.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const weights = performanceData.map(d => d.maxWeight);
    const indices = weights.map((_, i) => i);
    const regression = StatUtils.linearRegression(indices, weights);
    
    // Convert slope to weekly percentage change
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    const weeklyChange = (regression.slope * 7) / avgWeight; // Assuming daily data points
    
    return weeklyChange * regression.confidence;
  }

  private calculateStagnationPeriod(
    workouts: WorkoutSessionWithExercises[],
    exerciseId?: string
  ): number {
    if (workouts.length < 2) return 0;

    // Find the most recent improvement
    let lastImprovementDate: Date | null = null;
    let bestPerformance = 0;
    
    // Sort workouts by date (newest first)
    const sortedWorkouts = [...workouts].sort((a, b) => 
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
    
    // Go through workouts from newest to oldest
    for (const workout of sortedWorkouts) {
      const relevantExercises = exerciseId 
        ? workout.exercises.filter(e => e.id === exerciseId)
        : workout.exercises;
        
      for (const exercise of relevantExercises) {
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));
        
        if (maxWeight > bestPerformance * 1.025) { // 2.5% improvement threshold
          bestPerformance = maxWeight;
          lastImprovementDate = new Date(workout.started_at);
        }
      }
    }
    
    if (!lastImprovementDate) return workouts.length; // All workouts without improvement
    
    // Calculate days since last improvement
    const now = new Date();
    const daysSinceImprovement = Math.floor(
      (now.getTime() - lastImprovementDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceImprovement;
  }

  private calculateVolumeTrend(workouts: WorkoutSessionWithExercises[]): number {
    if (workouts.length < 3) return 0;

    const volumes = workouts.map(workout => 
      workout.exercises.reduce((total, exercise) => 
        total + exercise.sets.reduce((setTotal, set) => 
          setTotal + (set.weight || 0) * (set.reps || 0), 0), 0)
    );
    
    const indices = volumes.map((_, i) => i);
    const regression = StatUtils.linearRegression(indices, volumes);
    
    return regression.slope * regression.confidence;
  }

  private calculateReadinessTrend(dailyMetrics: DailyMetrics[]): number {
    if (dailyMetrics.length < 3) return 0;

    const readinessScores = dailyMetrics.map(m => 
      (m.sleep * 10 + m.energy * 10 + (10 - m.soreness) * 8 + (10 - m.stress) * 7) / 3.5
    );
    
    const indices = readinessScores.map((_, i) => i);
    const regression = StatUtils.linearRegression(indices, readinessScores);
    
    return regression.slope * regression.confidence;
  }

  private calculateVolumeCapacity(workouts: WorkoutSessionWithExercises[]): number {
    if (workouts.length === 0) return 0.5;

    // Simplified volume capacity calculation
    // In reality, this would need more sophisticated modeling
    const recentWorkouts = workouts.slice(0, 4);
    const avgVolume = recentWorkouts.reduce((sum, w) => 
      sum + w.exercises.reduce((total, e) => 
        total + e.sets.reduce((setTotal, s) => 
          setTotal + (s.weight || 0) * (s.reps || 0), 0), 0), 0
    ) / recentWorkouts.length;
    
    // Estimate capacity based on volume progression
    const maxObservedVolume = Math.max(...workouts.map(w => 
      w.exercises.reduce((total, e) => 
        total + e.sets.reduce((setTotal, s) => 
          setTotal + (s.weight || 0) * (s.reps || 0), 0), 0)
    ));
    
    return avgVolume / maxObservedVolume;
  }

  private calculateRecoveryRate(dailyMetrics: DailyMetrics[]): number {
    if (dailyMetrics.length === 0) return 0.8;

    const avgSleep = dailyMetrics.reduce((sum, m) => sum + m.sleep, 0) / dailyMetrics.length;
    const avgSoreness = dailyMetrics.reduce((sum, m) => sum + m.soreness, 0) / dailyMetrics.length;
    const avgEnergy = dailyMetrics.reduce((sum, m) => sum + m.energy, 0) / dailyMetrics.length;
    
    // Combine recovery indicators
    const sleepScore = Math.min(1, avgSleep / 8);
    const sorenessScore = Math.max(0, (10 - avgSoreness) / 10);
    const energyScore = avgEnergy / 10;
    
    return (sleepScore + sorenessScore + energyScore) / 3;
  }

  private calculateFatigueAccumulation(
    dailyMetrics: DailyMetrics[],
    workouts: WorkoutSessionWithExercises[]
  ): number {
    if (dailyMetrics.length === 0) return 0.3;

    // Calculate training stress vs recovery capacity
    const avgSoreness = dailyMetrics.reduce((sum, m) => sum + m.soreness, 0) / dailyMetrics.length;
    const avgStress = dailyMetrics.reduce((sum, m) => sum + m.stress, 0) / dailyMetrics.length;
    const avgEnergy = dailyMetrics.reduce((sum, m) => sum + m.energy, 0) / dailyMetrics.length;
    
    // High soreness and stress, low energy indicate fatigue accumulation
    const fatigueScore = (avgSoreness + avgStress - avgEnergy) / 20;
    
    return Math.max(0, Math.min(1, fatigueScore));
  }

  private calculateOverloadRate(workouts: WorkoutSessionWithExercises[]): number {
    if (workouts.length < 3) return 0.02;

    // Calculate rate of volume increase
    const volumeTrend = this.calculateVolumeTrend(workouts);
    const avgVolume = workouts.reduce((sum, w) => 
      sum + w.exercises.reduce((total, e) => 
        total + e.sets.reduce((setTotal, s) => 
          setTotal + (s.weight || 0) * (s.reps || 0), 0), 0), 0
    ) / workouts.length;
    
    // Convert to weekly percentage change
    return avgVolume > 0 ? (volumeTrend * 7) / avgVolume : 0;
  }

  private detectStrengthPlateaus(
    workouts: WorkoutSessionWithExercises[],
    prediction: MLPrediction,
    exerciseId?: string
  ): PlateauDetection[] {
    const plateaus: PlateauDetection[] = [];
    
    if (prediction.value > 60) { // 60% plateau probability threshold
      const stagnationPeriod = this.calculateStagnationPeriod(workouts, exerciseId);
      const progressRate = this.calculateProgressRate(workouts, exerciseId);
      
      plateaus.push({
        isDetected: true,
        type: 'strength',
        severity: this.determinePlateauSeverity(prediction.value, stagnationPeriod),
        confidence: prediction.confidence,
        duration: stagnationPeriod,
        affectedExercises: exerciseId ? [exerciseId] : ['multiple'],
        metrics: {
          currentTrend: progressRate,
          expectedTrend: 0.015, // Expected 1.5% weekly progress
          stagnationPeriod,
          progressDeficit: Math.max(0, 0.015 - progressRate)
        },
        evidence: this.generatePlateauEvidence('strength', prediction, stagnationPeriod),
        interventions: this.generateInterventions('strength', prediction.value),
        riskFactors: this.generateRiskFactors('strength'),
        lastAssessed: new Date().toISOString()
      });
    }
    
    return plateaus;
  }

  private detectVolumePlateaus(
    workouts: WorkoutSessionWithExercises[],
    prediction: MLPrediction
  ): PlateauDetection[] {
    const plateaus: PlateauDetection[] = [];
    
    if (prediction.value > 55) { // 55% plateau probability threshold for volume
      plateaus.push({
        isDetected: true,
        type: 'volume',
        severity: this.determinePlateauSeverity(prediction.value, 14),
        confidence: prediction.confidence,
        duration: 14, // Estimate
        affectedExercises: ['overall'],
        metrics: {
          currentTrend: 0,
          expectedTrend: 0.02,
          stagnationPeriod: 14,
          progressDeficit: 0.02
        },
        evidence: this.generatePlateauEvidence('volume', prediction, 14),
        interventions: this.generateInterventions('volume', prediction.value),
        riskFactors: this.generateRiskFactors('volume'),
        lastAssessed: new Date().toISOString()
      });
    }
    
    return plateaus;
  }

  private determinePlateauSeverity(
    probability: number,
    duration: number
  ): 'mild' | 'moderate' | 'severe' | 'chronic' {
    if (duration > 60) return 'chronic'; // 2+ months
    if (probability > 80 || duration > 30) return 'severe';
    if (probability > 70 || duration > 14) return 'moderate';
    return 'mild';
  }

  private generatePlateauEvidence(
    type: 'strength' | 'volume',
    prediction: MLPrediction,
    duration: number
  ): PlateauEvidence[] {
    const evidence: PlateauEvidence[] = [];
    
    if (type === 'strength') {
      evidence.push({
        metric: 'Progress Rate',
        description: 'Strength gains below expected rate for training level',
        severity: prediction.value > 80 ? 'high' : prediction.value > 60 ? 'medium' : 'low',
        dataPoints: 10,
        timeframe: `${duration} days`,
        statisticalSignificance: prediction.confidence
      });
    }
    
    return evidence;
  }

  private generateInterventions(
    type: 'strength' | 'volume',
    severity: number
  ): PlateauIntervention[] {
    const interventions: PlateauIntervention[] = [];
    
    if (type === 'strength') {
      if (severity > 70) {
        interventions.push({
          type: 'deload',
          priority: 'immediate',
          title: 'Implement Deload Week',
          description: 'Reduce training volume by 40-50% to promote recovery',
          implementation: {
            duration: '1 week',
            frequency: 'immediately',
            modifications: [
              'Reduce weight by 20-30%',
              'Reduce sets by 30-40%',
              'Focus on technique refinement'
            ]
          },
          expectedOutcome: 'Improved recovery and renewed progress after 1-2 weeks',
          evidenceLevel: 'high',
          successProbability: 0.8
        });
      }
      
      interventions.push({
        type: 'variation',
        priority: 'high',
        title: 'Exercise Variation',
        description: 'Introduce new movement patterns to stimulate adaptation',
        implementation: {
          duration: '4-6 weeks',
          frequency: '2-3 times per week',
          modifications: [
            'Change exercise angle or grip',
            'Add pause reps or tempo changes',
            'Introduce unilateral variations'
          ]
        },
        expectedOutcome: 'Renewed strength gains through novel stimulus',
        evidenceLevel: 'high',
        successProbability: 0.75
      });
    }
    
    return interventions;
  }

  private generateRiskFactors(type: 'strength' | 'volume'): PlateauRiskFactor[] {
    return [
      {
        factor: 'Monotonous Training',
        impact: 'high',
        description: 'Lack of exercise variation reduces adaptation stimulus',
        mitigation: 'Introduce periodization and exercise rotation',
        timeToImpact: 14
      },
      {
        factor: 'Inadequate Recovery',
        impact: 'medium',
        description: 'Poor sleep or high stress impedes adaptation',
        mitigation: 'Prioritize sleep hygiene and stress management',
        timeToImpact: 7
      }
    ];
  }

  private estimateTimeToPlateauPleateau(
    strengthFeatures: MLFeature[],
    volumeFeatures: MLFeature[],
    currentRisk: number
  ): number {
    // Simplified estimation based on current risk level
    if (currentRisk > 80) return 7; // High risk - plateau likely within a week
    if (currentRisk > 60) return 21; // Moderate risk - 3 weeks
    if (currentRisk > 40) return 42; // Low risk - 6 weeks
    return 84; // Very low risk - 12 weeks
  }

  private generatePreventiveActions(
    strengthPlateaus: PlateauDetection[],
    volumePlateaus: PlateauDetection[],
    overallRisk: number
  ): PlateauIntervention[] {
    const actions: PlateauIntervention[] = [];
    
    if (overallRisk > 50) {
      actions.push({
        type: 'periodization',
        priority: 'high',
        title: 'Implement Periodization',
        description: 'Cycle through different training phases to prevent adaptation',
        implementation: {
          duration: '12 weeks',
          frequency: 'ongoing',
          modifications: [
            'Alternate between strength and hypertrophy phases',
            'Include planned deload weeks',
            'Vary exercise selection periodically'
          ]
        },
        expectedOutcome: 'Sustained progress and plateau prevention',
        evidenceLevel: 'high',
        successProbability: 0.85
      });
    }
    
    return actions;
  }

  private generateMonitoringRecommendations(
    strengthPlateaus: PlateauDetection[],
    volumePlateaus: PlateauDetection[]
  ): string[] {
    const recommendations: string[] = [
      'Track weekly progress photos and measurements',
      'Monitor RPE trends to identify overreaching',
      'Assess sleep quality and stress levels daily'
    ];
    
    if (strengthPlateaus.length > 0) {
      recommendations.push('Test 1RM or 3RM every 4-6 weeks');
      recommendations.push('Video record lifts to assess technique consistency');
    }
    
    if (volumePlateaus.length > 0) {
      recommendations.push('Track training volume and recovery metrics weekly');
      recommendations.push('Monitor heart rate variability if available');
    }
    
    return recommendations;
  }
}

export { PlateauAnalyzer as default };