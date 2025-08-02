/**
 * ML Integration Hub
 * 
 * This module provides a unified interface for all ML systems and handles:
 * - System integration and orchestration
 * - Data flow between ML components
 * - Error handling and fallbacks
 * - Performance monitoring
 * - API endpoints for frontend integration
 */

// Core ML Systems
export { StatUtils, FeatureEngineering, TimeSeriesAnalysis, BaseMLModel } from './foundation';

// Prediction Models
export { ProgressAnalyzer } from './progressPredictor';
export { InjuryRiskAnalyzer } from './injuryRiskAssessment';
export { TrainingWindowAnalyzer } from './trainingWindowPredictor';
export { PlateauAnalyzer } from './plateauDetection';
export { DynamicWorkoutGenerator } from './workoutGenerator';

// Integration Types
import { DailyMetrics } from '@/types/aiCoach';
import { WorkoutSessionWithExercises, Exercise } from '@/services/database';
import { 
  ProgressAnalyzer,
  InjuryRiskAnalyzer, 
  TrainingWindowAnalyzer,
  PlateauAnalyzer,
  DynamicWorkoutGenerator
} from './index';

export interface MLSystemStatus {
  progress: 'operational' | 'degraded' | 'error';
  injuryRisk: 'operational' | 'degraded' | 'error';
  trainingWindows: 'operational' | 'degraded' | 'error';
  plateauDetection: 'operational' | 'degraded' | 'error';
  workoutGeneration: 'operational' | 'degraded' | 'error';
  lastHealthCheck: string;
}

export interface MLInsights {
  userId: string;
  progress: {
    strengthPrediction?: any;
    volumePrediction?: any;
    weightLossPrediction?: any;
    confidence: number;
  };
  injuryRisk: {
    overallRisk: number;
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    warnings: any[];
    recommendations: any[];
  };
  trainingWindows: {
    primary: any;
    secondary?: any;
    avoid: any[];
    personalizedFactors: any;
  };
  plateaus: {
    detected: any[];
    risk: number;
    preventiveActions: any[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  confidence: number;
  lastAnalyzed: string;
}

// ===== MAIN ML ORCHESTRATOR =====

export class MLOrchestrator {
  private progressAnalyzer = new ProgressAnalyzer();
  private injuryRiskAnalyzer = new InjuryRiskAnalyzer();
  private trainingWindowAnalyzer = new TrainingWindowAnalyzer();
  private plateauAnalyzer = new PlateauAnalyzer();
  private workoutGenerator = new DynamicWorkoutGenerator();

  /**
   * Comprehensive ML analysis for a user
   */
  async analyzeUser(
    userId: string,
    workouts: WorkoutSessionWithExercises[],
    dailyMetrics: DailyMetrics[],
    exercises: Exercise[]
  ): Promise<MLInsights> {
    
    console.log(`🧠 Starting ML analysis for user ${userId}`);
    
    try {
      // Run all analyses in parallel for performance
      const [
        progressAnalysis,
        injuryRiskAssessment,
        trainingWindowsAnalysis,
        plateauAnalysis
      ] = await Promise.all([
        this.analyzeProgress(workouts, dailyMetrics).catch(this.handleAnalysisError('progress')),
        this.analyzeInjuryRisk(workouts, dailyMetrics, userId).catch(this.handleAnalysisError('injuryRisk')),
        this.analyzeTrainingWindows(dailyMetrics, workouts, userId).catch(this.handleAnalysisError('trainingWindows')),
        this.analyzePlateaus(workouts, dailyMetrics).catch(this.handleAnalysisError('plateaus'))
      ]);

      // Combine insights and generate recommendations
      const combinedInsights = this.combineInsights(
        userId,
        progressAnalysis,
        injuryRiskAssessment,
        trainingWindowsAnalysis,
        plateauAnalysis
      );

      // Ensure we have default recommendations for empty data
      if (workouts.length === 0 && dailyMetrics.length === 0) {
        combinedInsights.recommendations.immediate = ['Start tracking daily metrics for personalized insights'];
      }

      console.log(`✅ ML analysis completed for user ${userId}`);
      return combinedInsights;

    } catch (error) {
      console.error(`❌ ML analysis failed for user ${userId}:`, error);
      return this.getDefaultInsights(userId);
    }
  }

  /**
   * Generate AI-powered workout
   */
  async generateWorkout(
    request: any,
    exercises: Exercise[],
    dailyMetrics: DailyMetrics[],
    workoutHistory: WorkoutSessionWithExercises[]
  ): Promise<any> {
    
    console.log(`🏋️ Generating AI workout: ${request.workoutType}`);
    
    try {
      const workout = await this.workoutGenerator.generateWorkout(
        request,
        exercises,
        dailyMetrics,
        workoutHistory
      );

      console.log(`✅ Workout generated successfully`);
      return workout;

    } catch (error) {
      console.error(`❌ Workout generation failed:`, error);
      return this.getDefaultWorkout(request);
    }
  }

  /**
   * Check system health
   */
  async healthCheck(): Promise<MLSystemStatus> {
    console.log('🔍 Performing ML system health check');
    
    const status: MLSystemStatus = {
      progress: 'operational',
      injuryRisk: 'operational',
      trainingWindows: 'operational',
      plateauDetection: 'operational',
      workoutGeneration: 'operational',
      lastHealthCheck: new Date().toISOString()
    };

    // Test each system with minimal data
    try {
      await this.testProgressSystem();
    } catch (error) {
      console.warn('Progress system degraded:', error);
      status.progress = 'degraded';
    }

    try {
      await this.testInjuryRiskSystem();
    } catch (error) {
      console.warn('Injury risk system degraded:', error);
      status.injuryRisk = 'degraded';
    }

    try {
      await this.testTrainingWindowsSystem();
    } catch (error) {
      console.warn('Training windows system degraded:', error);
      status.trainingWindows = 'degraded';
    }

    try {
      await this.testPlateauSystem();
    } catch (error) {
      console.warn('Plateau detection system degraded:', error);
      status.plateauDetection = 'degraded';
    }

    try {
      await this.testWorkoutGenerationSystem();
    } catch (error) {
      console.warn('Workout generation system degraded:', error);
      status.workoutGeneration = 'degraded';
    }

    console.log('✅ Health check completed');
    return status;
  }

  // ===== PRIVATE ANALYSIS METHODS =====

  private async analyzeProgress(
    workouts: WorkoutSessionWithExercises[],
    dailyMetrics: DailyMetrics[]
  ) {
    if (workouts.length === 0 || dailyMetrics.length === 0) {
      return this.getDefaultProgressAnalysis();
    }

    return await this.progressAnalyzer.analyzeProgress(workouts, dailyMetrics);
  }

  private async analyzeInjuryRisk(
    workouts: WorkoutSessionWithExercises[],
    dailyMetrics: DailyMetrics[],
    userId: string
  ) {
    if (workouts.length === 0 || dailyMetrics.length === 0) {
      return this.getDefaultInjuryRisk();
    }

    return await this.injuryRiskAnalyzer.assessInjuryRisk(workouts, dailyMetrics, userId);
  }

  private async analyzeTrainingWindows(
    dailyMetrics: DailyMetrics[],
    workouts: WorkoutSessionWithExercises[],
    userId: string
  ) {
    if (dailyMetrics.length === 0) {
      return this.getDefaultTrainingWindows();
    }

    return await this.trainingWindowAnalyzer.analyzeOptimalWindows(dailyMetrics, workouts, userId);
  }

  private async analyzePlateaus(
    workouts: WorkoutSessionWithExercises[],
    dailyMetrics: DailyMetrics[]
  ) {
    if (workouts.length < 3) {
      return this.getDefaultPlateauAnalysis();
    }

    return await this.plateauAnalyzer.analyzePlateaus(workouts, dailyMetrics);
  }

  // ===== SYSTEM TESTS =====

  private async testProgressSystem(): Promise<void> {
    const testWorkouts: WorkoutSessionWithExercises[] = [{
      id: 'test',
      user_id: 'test',
      template_id: null,
      name: 'Test Workout',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_minutes: 60,
      total_volume: 1000,
      average_rpe: 7,
      notes: null,
      created_at: new Date().toISOString(),
      exercises: [{
        id: 'test-ex',
        name: 'Test Exercise',
        category: 'strength',
        sets: [{
          id: 'test-set',
          weight: 100,
          reps: 10,
          rpe: 7,
          notes: null,
          is_personal_record: false
        }]
      }]
    }];

    const testMetrics: DailyMetrics[] = [{
      id: 'test',
      date: new Date().toISOString().split('T')[0],
      sleep: 8,
      energy: 8,
      soreness: 3,
      stress: 3
    }];

    await this.progressAnalyzer.analyzeProgress(testWorkouts, testMetrics);
  }

  private async testInjuryRiskSystem(): Promise<void> {
    const testWorkouts: WorkoutSessionWithExercises[] = [{
      id: 'test',
      user_id: 'test',
      template_id: null,
      name: 'Test Workout',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_minutes: 60,
      total_volume: 1000,
      average_rpe: 7,
      notes: null,
      created_at: new Date().toISOString(),
      exercises: []
    }];

    const testMetrics: DailyMetrics[] = [{
      id: 'test',
      date: new Date().toISOString().split('T')[0],
      sleep: 8,
      energy: 8,
      soreness: 3,
      stress: 3
    }];

    await this.injuryRiskAnalyzer.assessInjuryRisk(testWorkouts, testMetrics, 'test');
  }

  private async testTrainingWindowsSystem(): Promise<void> {
    const testMetrics: DailyMetrics[] = [{
      id: 'test',
      date: new Date().toISOString().split('T')[0],
      sleep: 8,
      energy: 8,
      soreness: 3,
      stress: 3
    }];

    await this.trainingWindowAnalyzer.analyzeOptimalWindows(testMetrics, [], 'test');
  }

  private async testPlateauSystem(): Promise<void> {
    const testWorkouts: WorkoutSessionWithExercises[] = [{
      id: 'test',
      user_id: 'test',
      template_id: null,
      name: 'Test Workout',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_minutes: 60,
      total_volume: 1000,
      average_rpe: 7,
      notes: null,
      created_at: new Date().toISOString(),
      exercises: []
    }];

    const testMetrics: DailyMetrics[] = [{
      id: 'test',
      date: new Date().toISOString().split('T')[0],
      sleep: 8,
      energy: 8,
      soreness: 3,
      stress: 3
    }];

    await this.plateauAnalyzer.analyzePlateaus(testWorkouts, testMetrics);
  }

  private async testWorkoutGenerationSystem(): Promise<void> {
    const testRequest = {
      userId: 'test',
      workoutType: 'strength' as const,
      targetDuration: 60,
      availableEquipment: ['barbell', 'dumbbell'],
      fitnessLevel: 'intermediate' as const
    };

    const testExercises: Exercise[] = [{
      id: 'test',
      name: 'Test Exercise',
      category: 'compound',
      muscle_groups: ['chest'],
      equipment: ['barbell'],
      instructions: 'Test instructions',
      difficulty_level: 'intermediate'
    }];

    await this.workoutGenerator.generateWorkout(testRequest, testExercises, [], []);
  }

  // ===== INSIGHT COMBINATION =====

  private combineInsights(
    userId: string,
    progressAnalysis: any,
    injuryRiskAssessment: any,
    trainingWindowsAnalysis: any,
    plateauAnalysis: any
  ): MLInsights {
    
    const immediateRecommendations: string[] = [];
    const shortTermRecommendations: string[] = [];
    const longTermRecommendations: string[] = [];
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Process injury risk
    if (injuryRiskAssessment?.overallRisk > 70) {
      immediateRecommendations.push('High injury risk detected - reduce training intensity');
      priority = 'critical';
    } else if (injuryRiskAssessment?.overallRisk > 50) {
      immediateRecommendations.push('Moderate injury risk - focus on recovery');
      priority = 'high';
    }

    // Process plateau risk
    if (plateauAnalysis?.overallRisk > 60) {
      shortTermRecommendations.push('Plateau risk detected - consider exercise variation');
      if (priority === 'low') priority = 'medium';
    }

    // Process progress insights
    if (progressAnalysis?.confidence > 0.7) {
      if (progressAnalysis.strength?.confidence > 0.8) {
        longTermRecommendations.push('Strong progress trajectory - continue current approach');
      }
    }

    // Process training windows
    if (trainingWindowsAnalysis?.primary) {
      const optimalTime = trainingWindowsAnalysis.primary.timeOfDay;
      shortTermRecommendations.push(`Optimal training time: ${optimalTime}:00-${optimalTime + 2}:00`);
    }

    // Calculate overall confidence
    const confidenceScores = [
      progressAnalysis?.confidence || 0,
      injuryRiskAssessment?.confidence || 0,
      trainingWindowsAnalysis?.primary?.confidence || 0,
      plateauAnalysis?.timeToPlateauEstimate ? 0.8 : 0.5
    ];
    
    const overallConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;

    return {
      userId,
      progress: {
        strengthPrediction: progressAnalysis?.strength,
        volumePrediction: progressAnalysis?.volume,
        weightLossPrediction: progressAnalysis?.weightLoss,
        confidence: progressAnalysis?.confidence || 0.5
      },
      injuryRisk: {
        overallRisk: injuryRiskAssessment?.overallRisk || 25,
        riskLevel: injuryRiskAssessment?.riskLevel || 'low',
        warnings: injuryRiskAssessment?.warnings || [],
        recommendations: injuryRiskAssessment?.recommendations || []
      },
      trainingWindows: {
        primary: trainingWindowsAnalysis?.primary,
        secondary: trainingWindowsAnalysis?.secondary,
        avoid: trainingWindowsAnalysis?.avoid || [],
        personalizedFactors: trainingWindowsAnalysis?.personalizedFactors
      },
      plateaus: {
        detected: [...(plateauAnalysis?.strengthPlateaus || []), ...(plateauAnalysis?.volumePlateaus || [])],
        risk: plateauAnalysis?.overallRisk || 20,
        preventiveActions: plateauAnalysis?.preventiveActions || []
      },
      recommendations: {
        immediate: immediateRecommendations,
        shortTerm: shortTermRecommendations,
        longTerm: longTermRecommendations,
        priority
      },
      confidence: overallConfidence,
      lastAnalyzed: new Date().toISOString()
    };
  }

  // ===== ERROR HANDLING =====

  private handleAnalysisError(systemName: string) {
    return (error: any) => {
      console.warn(`${systemName} analysis failed, using defaults:`, error);
      return null;
    };
  }

  // ===== DEFAULT FALLBACKS =====

  private getDefaultInsights(userId: string): MLInsights {
    return {
      userId,
      progress: {
        confidence: 0.3
      },
      injuryRisk: {
        overallRisk: 25,
        riskLevel: 'low',
        warnings: [],
        recommendations: []
      },
      trainingWindows: {
        primary: {
          timeOfDay: 18,
          dayOfWeek: 2,
          optimalityScore: 70,
          confidence: 0.5,
          duration: 60,
          reasoning: ['Default evening window for general population']
        },
        avoid: [],
        personalizedFactors: {
          chronotype: 'neutral',
          optimalSleepWindow: { bedtime: 22, wakeup: 6 },
          peakPerformanceTime: 18,
          recoveryPattern: 'moderate'
        }
      },
      plateaus: {
        detected: [],
        risk: 20,
        preventiveActions: []
      },
      recommendations: {
        immediate: ['Start tracking daily metrics for personalized insights'],
        shortTerm: ['Maintain consistent training schedule'],
        longTerm: ['Focus on progressive overload'],
        priority: 'low'
      },
      confidence: 0.3,
      lastAnalyzed: new Date().toISOString()
    };
  }

  private getDefaultProgressAnalysis() {
    return {
      strength: { confidence: 0.3 },
      volume: { confidence: 0.3 },
      confidence: 0.3
    };
  }

  private getDefaultInjuryRisk() {
    return {
      overallRisk: 25,
      riskLevel: 'low',
      confidence: 0.5,
      warnings: [],
      recommendations: []
    };
  }

  private getDefaultTrainingWindows() {
    return {
      primary: {
        timeOfDay: 18,
        dayOfWeek: 2,
        optimalityScore: 70,
        confidence: 0.5,
        duration: 60,
        reasoning: ['Default evening window']
      },
      personalizedFactors: {
        chronotype: 'neutral',
        optimalSleepWindow: { bedtime: 22, wakeup: 6 },
        peakPerformanceTime: 18,
        recoveryPattern: 'moderate'
      }
    };
  }

  private getDefaultPlateauAnalysis() {
    return {
      strengthPlateaus: [],
      volumePlateaus: [],
      overallRisk: 20,
      preventiveActions: []
    };
  }

  private getDefaultWorkout(request: any) {
    return {
      id: 'default',
      name: 'Basic Workout',
      type: request.workoutType,
      estimatedDuration: request.targetDuration,
      targetIntensity: 6,
      exercises: [],
      warmup: [],
      cooldown: [],
      modifications: [],
      adaptations: {
        readinessAdjustments: [],
        equipmentSubstitutions: [],
        progressiveOverload: []
      },
      confidence: 0.3,
      reasoning: ['Default workout due to system limitation'],
      metadata: {
        totalVolume: 0,
        averageIntensity: 6,
        muscleGroupBalance: {},
        generatedAt: new Date().toISOString(),
        algorithmVersion: '1.0.0'
      }
    };
  }
}

// Export singleton instance
export const mlOrchestrator = new MLOrchestrator();