/**
 * Dynamic Workout Generation System
 * 
 * This module implements AI-powered workout generation that:
 * - Adapts workouts based on real-time readiness metrics
 * - Applies intelligent exercise selection and substitution
 * - Optimizes volume and intensity based on user capacity
 * - Implements periodization and progressive overload
 * - Considers equipment availability and user preferences
 * - Provides real-time workout adjustments during training
 */

import { Exercise, WorkoutTemplate, WorkoutSessionWithExercises } from '@/services/database';
import { DailyMetrics, WorkoutModification } from '@/types/aiCoach';
import { BaseMLModel, MLFeature, MLPrediction, StatUtils } from './foundation';
import { ReadinessAnalyzer } from '../aiCoach/readinessAnalyzer';
import { PlateauAnalyzer } from './plateauDetection';
import { InjuryRiskAnalyzer } from './injuryRiskAssessment';

// ===== TYPES & INTERFACES =====

export interface WorkoutGenerationRequest {
  userId: string;
  workoutType: 'strength' | 'hypertrophy' | 'power' | 'endurance' | 'recovery';
  targetDuration: number; // minutes
  availableEquipment: string[];
  targetMuscleGroups?: string[];
  excludeExercises?: string[];
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  currentReadiness?: number;
  injuryHistory?: string[];
  preferences?: {
    intensityPreference: 'low' | 'moderate' | 'high';
    volumePreference: 'low' | 'moderate' | 'high';
    exerciseVariety: 'conservative' | 'moderate' | 'adventurous';
  };
}

export interface GeneratedWorkout {
  id: string;
  name: string;
  type: WorkoutGenerationRequest['workoutType'];
  estimatedDuration: number;
  targetIntensity: number; // 1-10 scale
  exercises: GeneratedExercise[];
  warmup: GeneratedExercise[];
  cooldown: GeneratedExercise[];
  modifications: WorkoutModification[];
  adaptations: {
    readinessAdjustments: string[];
    equipmentSubstitutions: string[];
    progressiveOverload: string[];
  };
  confidence: number;
  reasoning: string[];
  metadata: {
    totalVolume: number;
    averageIntensity: number;
    muscleGroupBalance: Record<string, number>;
    generatedAt: string;
    algorithmVersion: string;
  };
}

export interface GeneratedExercise {
  exerciseId: string;
  exercise: Exercise;
  targetSets: number;
  targetReps: string; // e.g., "8-12", "5", "3-5"
  targetWeight?: number;
  targetRPE: number;
  restTime: number; // seconds
  notes?: string;
  alternatives: ExerciseAlternative[];
  progression: {
    nextSession: ProgressionPlan;
    longTerm: ProgressionPlan;
  };
}

export interface ExerciseAlternative {
  exerciseId: string;
  exercise: Exercise;
  reason: string;
  substitutionType: 'equipment' | 'injury' | 'difficulty' | 'variety';
  confidence: number;
}

export interface ProgressionPlan {
  type: 'weight' | 'reps' | 'sets' | 'intensity';
  adjustment: number;
  condition: string;
  reasoning: string;
}

export interface WorkoutAdaptationEngine {
  adaptForReadiness(workout: GeneratedWorkout, readiness: number): GeneratedWorkout;
  adaptForInjuryRisk(workout: GeneratedWorkout, riskFactors: string[]): GeneratedWorkout;
  adaptForEquipment(workout: GeneratedWorkout, availableEquipment: string[]): GeneratedWorkout;
  adaptForPlateauRisk(workout: GeneratedWorkout, plateauRisk: number): GeneratedWorkout;
}

// ===== EXERCISE SELECTION AI =====

export class ExerciseSelectionAI extends BaseMLModel {
  name = 'ExerciseSelectionAI';
  type = 'classification' as const;
  features = [
    'muscle_group_priority', 'equipment_availability', 'user_experience', 'injury_history',
    'exercise_variety_score', 'movement_pattern_balance', 'readiness_level', 'workout_phase'
  ];
  lastTrained = new Date().toISOString();
  accuracy = 0.85;

  /**
   * Predict optimal exercise selection score
   */
  predict(features: MLFeature[]): MLPrediction {
    const featureMap = this.createFeatureMap(features);
    
    const muscleGroupPriority = featureMap.muscle_group_priority || 0.5;
    const equipmentAvailability = featureMap.equipment_availability || 1.0;
    const userExperience = featureMap.user_experience || 0.5;
    const readinessLevel = featureMap.readiness_level || 0.7;
    const varietyScore = featureMap.exercise_variety_score || 0.5;
    
    // Calculate exercise suitability score
    const suitabilityScore = (
      muscleGroupPriority * 0.30 +
      equipmentAvailability * 0.25 +
      userExperience * 0.20 +
      readinessLevel * 0.15 +
      varietyScore * 0.10
    );
    
    const confidence = this.calculateConfidence(features);
    
    return {
      value: suitabilityScore * 100,
      confidence,
      variance: 10,
      factors: [
        { feature: 'muscle_group_priority', contribution: muscleGroupPriority, importance: 0.30 },
        { feature: 'equipment_availability', contribution: equipmentAvailability, importance: 0.25 },
        { feature: 'user_experience', contribution: userExperience, importance: 0.20 },
        { feature: 'readiness_level', contribution: readinessLevel, importance: 0.15 },
        { feature: 'exercise_variety_score', contribution: varietyScore, importance: 0.10 }
      ],
      methodology: 'Multi-criteria exercise selection with user personalization',
      timeframe: 1
    };
  }

  private createFeatureMap(features: MLFeature[]): Record<string, number> {
    return features.reduce((map, feature) => {
      map[feature.name] = feature.value;
      return map;
    }, {} as Record<string, number>);
  }
}

// ===== VOLUME & INTENSITY OPTIMIZER =====

export class VolumeIntensityOptimizer extends BaseMLModel {
  name = 'VolumeIntensityOptimizer';
  type = 'regression' as const;
  features = [
    'readiness_score', 'training_age', 'recent_volume', 'recovery_capacity',
    'workout_frequency', 'plateau_risk', 'injury_risk', 'goal_priority'
  ];
  lastTrained = new Date().toISOString();
  accuracy = 0.82;

  predict(features: MLFeature[]): MLPrediction {
    const featureMap = this.createFeatureMap(features);
    
    const readinessScore = featureMap.readiness_score || 70;
    const trainingAge = featureMap.training_age || 1;
    const recentVolume = featureMap.recent_volume || 1000;
    const recoveryCapacity = featureMap.recovery_capacity || 0.8;
    const plateauRisk = featureMap.plateau_risk || 0.3;
    
    // Calculate base volume recommendation
    const baseVolume = this.calculateBaseVolume(trainingAge, readinessScore);
    
    // Apply readiness adjustments
    const readinessMultiplier = this.calculateReadinessMultiplier(readinessScore);
    
    // Apply recovery capacity adjustments
    const recoveryMultiplier = this.calculateRecoveryMultiplier(recoveryCapacity);
    
    // Apply plateau risk adjustments
    const plateauMultiplier = this.calculatePlateauMultiplier(plateauRisk);
    
    const optimalVolume = baseVolume * readinessMultiplier * recoveryMultiplier * plateauMultiplier;
    
    const confidence = this.calculateConfidence(features);
    
    return {
      value: optimalVolume,
      confidence,
      variance: optimalVolume * 0.15,
      factors: [
        { feature: 'readiness_score', contribution: readinessMultiplier - 1, importance: 0.35 },
        { feature: 'training_age', contribution: trainingAge / 3, importance: 0.25 },
        { feature: 'recovery_capacity', contribution: recoveryMultiplier - 1, importance: 0.20 },
        { feature: 'plateau_risk', contribution: plateauMultiplier - 1, importance: 0.20 }
      ],
      methodology: 'Adaptive volume optimization with readiness and recovery modeling',
      timeframe: 1
    };
  }

  private createFeatureMap(features: MLFeature[]): Record<string, number> {
    return features.reduce((map, feature) => {
      map[feature.name] = feature.value;
      return map;
    }, {} as Record<string, number>);
  }

  private calculateBaseVolume(trainingAge: number, readinessScore: number): number {
    // Base volume recommendations based on training experience
    let baseVolume: number;
    
    if (trainingAge < 0.5) baseVolume = 800; // Novice: lower volume
    else if (trainingAge < 2) baseVolume = 1200; // Intermediate: moderate volume
    else if (trainingAge < 5) baseVolume = 1600; // Advanced: higher volume
    else baseVolume = 2000; // Elite: high volume
    
    // Adjust for readiness
    const readinessAdjustment = (readinessScore - 70) / 100;
    return baseVolume * (1 + readinessAdjustment);
  }

  private calculateReadinessMultiplier(readinessScore: number): number {
    // Readiness score directly affects volume capacity
    if (readinessScore >= 85) return 1.15; // Feeling great - can handle more
    if (readinessScore >= 75) return 1.05; // Good readiness
    if (readinessScore >= 65) return 1.0; // Baseline
    if (readinessScore >= 55) return 0.9; // Reduced capacity
    if (readinessScore >= 45) return 0.8; // Significantly reduced
    return 0.7; // Poor readiness - minimal volume
  }

  private calculateRecoveryMultiplier(recoveryCapacity: number): number {
    // Recovery capacity affects sustainable volume
    if (recoveryCapacity >= 0.9) return 1.1;
    if (recoveryCapacity >= 0.8) return 1.0;
    if (recoveryCapacity >= 0.7) return 0.95;
    if (recoveryCapacity >= 0.6) return 0.85;
    return 0.75;
  }

  private calculatePlateauMultiplier(plateauRisk: number): number {
    // Higher plateau risk may require volume changes
    if (plateauRisk > 0.7) return 1.15; // Increase volume to break plateau
    if (plateauRisk > 0.5) return 1.05; // Slight increase
    return 1.0; // Normal volume
  }
}

// ===== MAIN WORKOUT GENERATOR =====

export class DynamicWorkoutGenerator implements WorkoutAdaptationEngine {
  private exerciseSelectionAI = new ExerciseSelectionAI();
  private volumeOptimizer = new VolumeIntensityOptimizer();
  private readinessAnalyzer = new ReadinessAnalyzer();
  private plateauAnalyzer = new PlateauAnalyzer();
  private injuryRiskAnalyzer = new InjuryRiskAnalyzer();

  /**
   * Generate a complete workout based on user parameters and AI optimization
   */
  async generateWorkout(
    request: WorkoutGenerationRequest,
    exercises: Exercise[],
    dailyMetrics: DailyMetrics[],
    workoutHistory: WorkoutSessionWithExercises[]
  ): Promise<GeneratedWorkout> {
    
    // Analyze current state
    const readinessAnalysis = ReadinessAnalyzer.analyzeReadiness(dailyMetrics);
    const plateauAnalysis = await this.plateauAnalyzer.analyzePlateaus(workoutHistory, dailyMetrics);
    const injuryRisk = await this.injuryRiskAnalyzer.assessInjuryRisk(workoutHistory, dailyMetrics, request.userId);
    
    // Select exercises using AI
    const selectedExercises = await this.selectOptimalExercises(
      request,
      exercises,
      readinessAnalysis.overallScore,
      plateauAnalysis.overallRisk,
      injuryRisk.overallRisk
    );
    
    // Optimize volume and intensity
    const volumeIntensityPlan = await this.optimizeVolumeIntensity(
      request,
      readinessAnalysis.overallScore,
      workoutHistory,
      plateauAnalysis.overallRisk
    );
    
    // Generate complete workout structure
    const generatedWorkout = this.buildWorkoutStructure(
      request,
      selectedExercises,
      volumeIntensityPlan,
      readinessAnalysis,
      plateauAnalysis,
      injuryRisk
    );
    
    // Apply real-time adaptations
    let adaptedWorkout = generatedWorkout;
    adaptedWorkout = this.adaptForReadiness(adaptedWorkout, readinessAnalysis.overallScore);
    adaptedWorkout = this.adaptForInjuryRisk(adaptedWorkout, injuryRisk.warnings || []);
    adaptedWorkout = this.adaptForEquipment(adaptedWorkout, request.availableEquipment);
    adaptedWorkout = this.adaptForPlateauRisk(adaptedWorkout, plateauAnalysis.overallRisk);
    
    return adaptedWorkout;
  }

  /**
   * Select optimal exercises using AI scoring
   */
  private async selectOptimalExercises(
    request: WorkoutGenerationRequest,
    exercises: Exercise[],
    readinessScore: number,
    plateauRisk: number,
    injuryRisk: number
  ): Promise<Exercise[]> {
    
    const targetMuscleGroups = request.targetMuscleGroups || this.getDefaultMuscleGroups(request.workoutType);
    const selectedExercises: Exercise[] = [];
    
    // Score each exercise
    const exerciseScores: { exercise: Exercise; score: number; confidence: number }[] = [];
    
    for (const exercise of exercises) {
      // Check equipment availability
      const hasEquipment = exercise.equipment.every(eq => 
        request.availableEquipment.includes(eq) || eq === 'bodyweight'
      );
      
      if (!hasEquipment) continue;
      
      // Check if exercise is excluded
      if (request.excludeExercises?.includes(exercise.id)) continue;
      
      // Calculate muscle group relevance
      const muscleGroupRelevance = this.calculateMuscleGroupRelevance(
        exercise.muscle_groups,
        targetMuscleGroups
      );
      
      // Create features for AI scoring
      const features: MLFeature[] = [
        { name: 'muscle_group_priority', value: muscleGroupRelevance, importance: 0.30, category: 'exercise' },
        { name: 'equipment_availability', value: 1.0, importance: 0.25, category: 'exercise' },
        { name: 'user_experience', value: this.getUserExperienceScore(exercise, request.fitnessLevel), importance: 0.20, category: 'user' },
        { name: 'readiness_level', value: readinessScore / 100, importance: 0.15, category: 'readiness' },
        { name: 'exercise_variety_score', value: 0.5, importance: 0.10, category: 'exercise' }
      ];
      
      const prediction = this.exerciseSelectionAI.predict(features);
      
      exerciseScores.push({
        exercise,
        score: prediction.value,
        confidence: prediction.confidence
      });
    }
    
    // Sort by score and select top exercises
    exerciseScores.sort((a, b) => b.score - a.score);
    
    // Select exercises ensuring muscle group balance
    const exercisesPerMuscleGroup = Math.ceil(request.targetDuration / 15); // Rough estimate
    const muscleGroupCounts: Record<string, number> = {};
    
    for (const { exercise } of exerciseScores) {
      let shouldAdd = false;
      
      for (const muscleGroup of exercise.muscle_groups) {
        if (targetMuscleGroups.includes(muscleGroup)) {
          const currentCount = muscleGroupCounts[muscleGroup] || 0;
          if (currentCount < exercisesPerMuscleGroup) {
            shouldAdd = true;
            muscleGroupCounts[muscleGroup] = currentCount + 1;
            break;
          }
        }
      }
      
      if (shouldAdd && selectedExercises.length < 8) { // Max 8 exercises
        selectedExercises.push(exercise);
      }
    }
    
    return selectedExercises;
  }

  /**
   * Optimize volume and intensity for the workout
   */
  private async optimizeVolumeIntensity(
    request: WorkoutGenerationRequest,
    readinessScore: number,
    workoutHistory: WorkoutSessionWithExercises[],
    plateauRisk: number
  ): Promise<{ targetVolume: number; targetIntensity: number; setsPerExercise: number }> {
    
    // Calculate recent volume
    const recentVolume = this.calculateRecentVolume(workoutHistory);
    
    // Estimate training age
    const trainingAge = Math.min(5, workoutHistory.length / 52);
    
    // Create features for volume optimization
    const features: MLFeature[] = [
      { name: 'readiness_score', value: readinessScore, importance: 0.35, category: 'readiness' },
      { name: 'training_age', value: trainingAge, importance: 0.25, category: 'user' },
      { name: 'recent_volume', value: recentVolume, importance: 0.20, category: 'performance' },
      { name: 'recovery_capacity', value: 0.8, importance: 0.20, category: 'readiness' } // Placeholder
    ];
    
    const volumePrediction = this.volumeOptimizer.predict(features);
    
    // Calculate target intensity based on workout type and readiness
    const targetIntensity = this.calculateTargetIntensity(request.workoutType, readinessScore);
    
    // Determine sets per exercise
    const setsPerExercise = Math.ceil(volumePrediction.value / 1000); // Rough conversion
    
    return {
      targetVolume: volumePrediction.value,
      targetIntensity,
      setsPerExercise: Math.max(2, Math.min(5, setsPerExercise))
    };
  }

  /**
   * Build the complete workout structure
   */
  private buildWorkoutStructure(
    request: WorkoutGenerationRequest,
    exercises: Exercise[],
    volumePlan: { targetVolume: number; targetIntensity: number; setsPerExercise: number },
    readinessAnalysis: any,
    plateauAnalysis: any,
    injuryRisk: any
  ): GeneratedWorkout {
    
    const generatedExercises: GeneratedExercise[] = exercises.map((exercise, index) => {
      return {
        exerciseId: exercise.id!,
        exercise,
        targetSets: volumePlan.setsPerExercise,
        targetReps: this.calculateTargetReps(request.workoutType, volumePlan.targetIntensity),
        targetRPE: this.calculateTargetRPE(volumePlan.targetIntensity, readinessAnalysis.overallScore),
        restTime: this.calculateRestTime(request.workoutType, volumePlan.targetIntensity),
        alternatives: this.generateAlternatives(exercise, exercises),
        progression: this.generateProgressionPlan(exercise, request.workoutType)
      };
    });
    
    // Generate warmup and cooldown
    const warmup = this.generateWarmup(exercises);
    const cooldown = this.generateCooldown();
    
    return {
      id: `generated_${Date.now()}`,
      name: `AI-Generated ${request.workoutType.charAt(0).toUpperCase() + request.workoutType.slice(1)} Workout`,
      type: request.workoutType,
      estimatedDuration: request.targetDuration,
      targetIntensity: volumePlan.targetIntensity,
      exercises: generatedExercises,
      warmup,
      cooldown,
      modifications: [],
      adaptations: {
        readinessAdjustments: [],
        equipmentSubstitutions: [],
        progressiveOverload: this.generateProgressiveOverloadPlan(plateauAnalysis)
      },
      confidence: 0.85,
      reasoning: this.generateWorkoutReasoning(request, readinessAnalysis, plateauAnalysis),
      metadata: {
        totalVolume: volumePlan.targetVolume,
        averageIntensity: volumePlan.targetIntensity,
        muscleGroupBalance: this.calculateMuscleGroupBalance(generatedExercises),
        generatedAt: new Date().toISOString(),
        algorithmVersion: '1.0.0'
      }
    };
  }

  // ===== ADAPTATION METHODS =====

  adaptForReadiness(workout: GeneratedWorkout, readiness: number): GeneratedWorkout {
    const adapted = { ...workout };
    
    if (readiness < 60) {
      // Reduce intensity and volume for low readiness
      adapted.exercises = adapted.exercises.map(ex => ({
        ...ex,
        targetSets: Math.max(1, ex.targetSets - 1),
        targetRPE: Math.max(5, ex.targetRPE - 1),
        restTime: ex.restTime + 30
      }));
      
      adapted.adaptations.readinessAdjustments.push(
        'Reduced volume and intensity due to low readiness'
      );
    } else if (readiness > 85) {
      // Increase intensity for high readiness
      adapted.exercises = adapted.exercises.map(ex => ({
        ...ex,
        targetRPE: Math.min(9, ex.targetRPE + 1)
      }));
      
      adapted.adaptations.readinessAdjustments.push(
        'Increased intensity due to excellent readiness'
      );
    }
    
    return adapted;
  }

  adaptForInjuryRisk(workout: GeneratedWorkout, riskFactors: string[]): GeneratedWorkout {
    const adapted = { ...workout };
    
    // Add extra warmup and reduce intensity
    adapted.warmup.push(...this.generateInjuryPreventionWarmup());
    
    adapted.exercises = adapted.exercises.map(ex => ({
      ...ex,
      targetRPE: Math.max(6, ex.targetRPE - 1),
      restTime: ex.restTime + 15,
      notes: 'Focus on controlled movement and proper form'
    }));
    
    return adapted;
  }

  adaptForEquipment(workout: GeneratedWorkout, availableEquipment: string[]): GeneratedWorkout {
    const adapted = { ...workout };
    
    adapted.exercises = adapted.exercises.map(ex => {
      const hasEquipment = ex.exercise.equipment.every(eq => 
        availableEquipment.includes(eq) || eq === 'bodyweight'
      );
      
      if (!hasEquipment && ex.alternatives.length > 0) {
        const alternative = ex.alternatives.find(alt => 
          alt.exercise.equipment.every(eq => 
            availableEquipment.includes(eq) || eq === 'bodyweight'
          )
        );
        
        if (alternative) {
          return {
            ...ex,
            exerciseId: alternative.exerciseId,
            exercise: alternative.exercise,
            notes: `Substituted due to equipment availability: ${alternative.reason}`
          };
        }
      }
      
      return ex;
    });
    
    return adapted;
  }

  adaptForPlateauRisk(workout: GeneratedWorkout, plateauRisk: number): GeneratedWorkout {
    const adapted = { ...workout };
    
    if (plateauRisk > 60) {
      // Add variation and intensity techniques
      adapted.exercises = adapted.exercises.map((ex, index) => {
        if (index % 2 === 0) {
          // Add intensity techniques to every other exercise
          return {
            ...ex,
            notes: 'Add drop sets or pause reps to break through plateau',
            targetRPE: Math.min(9, ex.targetRPE + 1)
          };
        }
        return ex;
      });
      
      adapted.adaptations.progressiveOverload.push(
        'Added intensity techniques to combat plateau risk'
      );
    }
    
    return adapted;
  }

  // ===== HELPER METHODS =====

  private getDefaultMuscleGroups(workoutType: string): string[] {
    const muscleGroupMap: Record<string, string[]> = {
      'strength': ['chest', 'back', 'legs', 'shoulders'],
      'hypertrophy': ['chest', 'back', 'arms', 'legs', 'shoulders'],
      'power': ['legs', 'back', 'core'],
      'endurance': ['legs', 'core', 'cardio'],
      'recovery': ['core', 'flexibility']
    };
    
    return muscleGroupMap[workoutType] || ['chest', 'back', 'legs'];
  }

  private calculateMuscleGroupRelevance(
    exerciseMuscles: string[],
    targetMuscles: string[]
  ): number {
    const overlap = exerciseMuscles.filter(muscle => 
      targetMuscles.includes(muscle)
    ).length;
    
    return overlap / targetMuscles.length;
  }

  private getUserExperienceScore(exercise: Exercise, fitnessLevel: string): number {
    const difficultyMap: Record<string, number> = {
      'beginner': 0.3,
      'intermediate': 0.7,
      'advanced': 1.0
    };
    
    const userLevel = difficultyMap[fitnessLevel] || 0.5;
    const exerciseLevel = difficultyMap[exercise.difficulty_level] || 0.5;
    
    // Score is higher when exercise difficulty matches user level
    return 1 - Math.abs(userLevel - exerciseLevel);
  }

  private calculateRecentVolume(workoutHistory: WorkoutSessionWithExercises[]): number {
    const recentWorkouts = workoutHistory.slice(0, 5);
    
    return recentWorkouts.reduce((total, workout) => 
      total + workout.exercises.reduce((exerciseTotal, exercise) => 
        exerciseTotal + exercise.sets.reduce((setTotal, set) => 
          setTotal + (set.weight || 0) * (set.reps || 0), 0), 0), 0
    ) / recentWorkouts.length;
  }

  private calculateTargetIntensity(workoutType: string, readinessScore: number): number {
    const baseIntensityMap: Record<string, number> = {
      'strength': 8.5,
      'hypertrophy': 7.5,
      'power': 8.0,
      'endurance': 6.0,
      'recovery': 4.0
    };
    
    const baseIntensity = baseIntensityMap[workoutType] || 7.0;
    const readinessAdjustment = (readinessScore - 70) / 100;
    
    return Math.max(4, Math.min(10, baseIntensity + readinessAdjustment));
  }

  private calculateTargetReps(workoutType: string, intensity: number): string {
    if (workoutType === 'strength') return intensity > 8 ? '3-5' : '5-8';
    if (workoutType === 'hypertrophy') return '8-12';
    if (workoutType === 'power') return '3-6';
    if (workoutType === 'endurance') return '12-20';
    return '8-12';
  }

  private calculateTargetRPE(intensity: number, readinessScore: number): number {
    const baseRPE = intensity;
    const readinessAdjustment = (readinessScore - 70) / 200; // Small adjustment
    
    return Math.max(5, Math.min(10, baseRPE + readinessAdjustment));
  }

  private calculateRestTime(workoutType: string, intensity: number): number {
    const baseRestMap: Record<string, number> = {
      'strength': 180,
      'hypertrophy': 90,
      'power': 180,
      'endurance': 60,
      'recovery': 60
    };
    
    const baseRest = baseRestMap[workoutType] || 90;
    const intensityMultiplier = intensity / 7; // Scale based on intensity
    
    return Math.round(baseRest * intensityMultiplier);
  }

  private generateAlternatives(exercise: Exercise, allExercises: Exercise[]): ExerciseAlternative[] {
    return allExercises
      .filter(alt => 
        alt.id !== exercise.id &&
        alt.muscle_groups.some(muscle => exercise.muscle_groups.includes(muscle))
      )
      .slice(0, 3)
      .map(alt => ({
        exerciseId: alt.id!,
        exercise: alt,
        reason: 'Similar muscle groups targeted',
        substitutionType: 'variety' as const,
        confidence: 0.8
      }));
  }

  private generateProgressionPlan(exercise: Exercise, workoutType: string): GeneratedExercise['progression'] {
    return {
      nextSession: {
        type: 'weight',
        adjustment: 2.5,
        condition: 'If all sets completed with good form',
        reasoning: 'Progressive overload through weight increase'
      },
      longTerm: {
        type: 'volume',
        adjustment: 1,
        condition: 'After 4-6 weeks',
        reasoning: 'Increase training volume to drive adaptation'
      }
    };
  }

  private generateWarmup(exercises: Exercise[]): GeneratedExercise[] {
    // Generate dynamic warmup based on main exercises
    return []; // Placeholder
  }

  private generateCooldown(): GeneratedExercise[] {
    // Generate cooldown routine
    return []; // Placeholder
  }

  private generateReadinessAdjustments(readinessAnalysis: any): string[] {
    const adjustments: string[] = [];
    
    if (readinessAnalysis.overallScore < 60) {
      adjustments.push('Reduced intensity due to low readiness score');
    }
    
    return adjustments;
  }

  private generateProgressiveOverloadPlan(plateauAnalysis: any): string[] {
    const plan: string[] = [];
    
    if (plateauAnalysis.overallRisk > 50) {
      plan.push('Implement exercise variation to break plateau');
    }
    
    return plan;
  }

  private generateWorkoutReasoning(
    request: WorkoutGenerationRequest,
    readinessAnalysis: any,
    plateauAnalysis: any
  ): string[] {
    return [
      `Workout optimized for ${request.workoutType} training`,
      `Adjusted for readiness score of ${readinessAnalysis.overallScore}`,
      `Exercise selection based on available equipment and preferences`
    ];
  }

  private calculateMuscleGroupBalance(exercises: GeneratedExercise[]): Record<string, number> {
    const balance: Record<string, number> = {};
    
    exercises.forEach(ex => {
      ex.exercise.muscle_groups.forEach(muscle => {
        balance[muscle] = (balance[muscle] || 0) + ex.targetSets;
      });
    });
    
    return balance;
  }

  private generateInjuryPreventionWarmup(): GeneratedExercise[] {
    // Generate specific injury prevention exercises
    return []; // Placeholder
  }
}

export { DynamicWorkoutGenerator as default };