/**
 * ML Integration Test Suite
 * 
 * Comprehensive tests for all ML systems to ensure:
 * - Proper data flow and integration
 * - Error handling and fallbacks
 * - Performance under various conditions
 * - Accuracy of predictions within expected ranges
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mlOrchestrator, MLOrchestrator } from '../index';
import { DailyMetrics } from '@/types/aiCoach';
import { WorkoutSessionWithExercises, Exercise } from '@/services/database';

// Test Data Setup
const mockDailyMetrics: DailyMetrics[] = [
  {
    id: '1',
    date: '2025-01-01',
    sleep: 8,
    energy: 8,
    soreness: 3,
    stress: 4
  },
  {
    id: '2', 
    date: '2024-12-31',
    sleep: 7,
    energy: 7,
    soreness: 4,
    stress: 5
  },
  {
    id: '3',
    date: '2024-12-30', 
    sleep: 6,
    energy: 6,
    soreness: 5,
    stress: 6
  }
];

const mockWorkouts: WorkoutSessionWithExercises[] = [
  {
    id: 'workout-1',
    user_id: 'test-user',
    template_id: null,
    name: 'Upper Body Strength',
    started_at: '2025-01-01T10:00:00Z',
    completed_at: '2025-01-01T11:30:00Z',
    duration_minutes: 90,
    total_volume: 2500,
    average_rpe: 7.5,
    notes: 'Good session',
    created_at: '2025-01-01T10:00:00Z',
    exercises: [
      {
        id: 'bench-press',
        name: 'Barbell Bench Press',
        category: 'strength',
        sets: [
          { id: 'set-1', weight: 100, reps: 8, rpe: 7, notes: null, is_personal_record: false },
          { id: 'set-2', weight: 100, reps: 8, rpe: 8, notes: null, is_personal_record: false },
          { id: 'set-3', weight: 100, reps: 7, rpe: 9, notes: null, is_personal_record: false }
        ]
      },
      {
        id: 'bent-row',
        name: 'Barbell Bent Over Row',
        category: 'strength',
        sets: [
          { id: 'set-4', weight: 80, reps: 10, rpe: 6, notes: null, is_personal_record: false },
          { id: 'set-5', weight: 80, reps: 10, rpe: 7, notes: null, is_personal_record: false },
          { id: 'set-6', weight: 80, reps: 9, rpe: 8, notes: null, is_personal_record: false }
        ]
      }
    ]
  },
  {
    id: 'workout-2',
    user_id: 'test-user',
    template_id: null,
    name: 'Lower Body Strength',
    started_at: '2024-12-30T10:00:00Z',
    completed_at: '2024-12-30T11:15:00Z',
    duration_minutes: 75,
    total_volume: 3200,
    average_rpe: 8.0,
    notes: 'Challenging session',
    created_at: '2024-12-30T10:00:00Z',
    exercises: [
      {
        id: 'squat',
        name: 'Barbell Back Squat',
        category: 'strength',
        sets: [
          { id: 'set-7', weight: 120, reps: 6, rpe: 8, notes: null, is_personal_record: false },
          { id: 'set-8', weight: 120, reps: 6, rpe: 8, notes: null, is_personal_record: false },
          { id: 'set-9', weight: 120, reps: 5, rpe: 9, notes: null, is_personal_record: false }
        ]
      }
    ]
  }
];

const mockExercises: Exercise[] = [
  {
    id: 'bench-press',
    name: 'Barbell Bench Press',
    category: 'compound',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell'],
    instructions: 'Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up.',
    difficulty_level: 'intermediate'
  },
  {
    id: 'bent-row',
    name: 'Barbell Bent Over Row', 
    category: 'compound',
    muscle_groups: ['back', 'biceps'],
    equipment: ['barbell'],
    instructions: 'Hinge at hips, grip bar, row to lower chest.',
    difficulty_level: 'intermediate'
  },
  {
    id: 'squat',
    name: 'Barbell Back Squat',
    category: 'compound', 
    muscle_groups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['barbell'],
    instructions: 'Bar on upper back, squat down, drive through heels.',
    difficulty_level: 'intermediate'
  },
  {
    id: 'pushup',
    name: 'Push Up',
    category: 'compound',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    equipment: ['bodyweight'],
    instructions: 'Start in plank, lower to chest, push up.',
    difficulty_level: 'beginner'
  }
];

describe('ML Integration Tests', () => {
  let orchestrator: MLOrchestrator;

  beforeEach(() => {
    orchestrator = new MLOrchestrator();
  });

  describe('System Health Check', () => {
    it('should complete health check without errors', async () => {
      const status = await orchestrator.healthCheck();
      
      expect(status).toBeDefined();
      expect(status.lastHealthCheck).toBeDefined();
      expect(status.progress).toMatch(/operational|degraded|error/);
      expect(status.injuryRisk).toMatch(/operational|degraded|error/);
      expect(status.trainingWindows).toMatch(/operational|degraded|error/);
      expect(status.plateauDetection).toMatch(/operational|degraded|error/);
      expect(status.workoutGeneration).toMatch(/operational|degraded|error/);
    });
  });

  describe('User Analysis', () => {
    it('should analyze user with complete data', async () => {
      const insights = await orchestrator.analyzeUser(
        'test-user',
        mockWorkouts,
        mockDailyMetrics,
        mockExercises
      );

      expect(insights).toBeDefined();
      expect(insights.userId).toBe('test-user');
      expect(insights.confidence).toBeGreaterThan(0);
      expect(insights.confidence).toBeLessThanOrEqual(1);
      
      // Progress insights
      expect(insights.progress).toBeDefined();
      expect(insights.progress.confidence).toBeGreaterThanOrEqual(0);
      
      // Injury risk insights
      expect(insights.injuryRisk).toBeDefined();
      expect(insights.injuryRisk.overallRisk).toBeGreaterThanOrEqual(0);
      expect(insights.injuryRisk.overallRisk).toBeLessThanOrEqual(100);
      expect(insights.injuryRisk.riskLevel).toMatch(/low|moderate|high|critical/);
      
      // Training windows
      expect(insights.trainingWindows).toBeDefined();
      expect(insights.trainingWindows.primary).toBeDefined();
      expect(insights.trainingWindows.primary.timeOfDay).toBeGreaterThanOrEqual(0);
      expect(insights.trainingWindows.primary.timeOfDay).toBeLessThan(24);
      
      // Plateaus
      expect(insights.plateaus).toBeDefined();
      expect(insights.plateaus.risk).toBeGreaterThanOrEqual(0);
      expect(insights.plateaus.risk).toBeLessThanOrEqual(100);
      
      // Recommendations
      expect(insights.recommendations).toBeDefined();
      expect(Array.isArray(insights.recommendations.immediate)).toBe(true);
      expect(Array.isArray(insights.recommendations.shortTerm)).toBe(true);
      expect(Array.isArray(insights.recommendations.longTerm)).toBe(true);
      expect(insights.recommendations.priority).toMatch(/low|medium|high|critical/);
      
      console.log('✅ User analysis test passed');
    }, 10000);

    it('should handle empty data gracefully', async () => {
      const insights = await orchestrator.analyzeUser(
        'test-user',
        [],
        [],
        []
      );

      expect(insights).toBeDefined();
      expect(insights.userId).toBe('test-user');
      expect(insights.confidence).toBeGreaterThan(0); // Should have default confidence
      expect(insights.recommendations.immediate).toContain('Start tracking daily metrics for personalized insights');
      
      console.log('✅ Empty data handling test passed');
    });

    it('should handle partial data', async () => {
      const insights = await orchestrator.analyzeUser(
        'test-user',
        mockWorkouts.slice(0, 1), // Only one workout
        mockDailyMetrics.slice(0, 1), // Only one metric
        mockExercises
      );

      expect(insights).toBeDefined();
      expect(insights.userId).toBe('test-user');
      expect(insights.confidence).toBeGreaterThan(0);
      
      console.log('✅ Partial data handling test passed');
    });
  });

  describe('Workout Generation', () => {
    it('should generate strength workout', async () => {
      const request = {
        userId: 'test-user',
        workoutType: 'strength' as const,
        targetDuration: 60,
        availableEquipment: ['barbell', 'dumbbell', 'bodyweight'],
        fitnessLevel: 'intermediate' as const,
        currentReadiness: 75
      };

      const workout = await orchestrator.generateWorkout(
        request,
        mockExercises,
        mockDailyMetrics,
        mockWorkouts
      );

      expect(workout).toBeDefined();
      expect(workout.type).toBe('strength');
      expect(workout.estimatedDuration).toBe(60);
      expect(workout.confidence).toBeGreaterThan(0);
      expect(Array.isArray(workout.exercises)).toBe(true);
      expect(workout.metadata).toBeDefined();
      expect(workout.metadata.generatedAt).toBeDefined();
      
      console.log('✅ Strength workout generation test passed');
    });

    it('should generate hypertrophy workout', async () => {
      const request = {
        userId: 'test-user',
        workoutType: 'hypertrophy' as const,
        targetDuration: 90,
        availableEquipment: ['dumbbell', 'bodyweight'],
        fitnessLevel: 'beginner' as const,
        currentReadiness: 80
      };

      const workout = await orchestrator.generateWorkout(
        request,
        mockExercises,
        mockDailyMetrics,
        mockWorkouts
      );

      expect(workout).toBeDefined();
      expect(workout.type).toBe('hypertrophy');
      expect(workout.estimatedDuration).toBe(90);
      
      console.log('✅ Hypertrophy workout generation test passed');
    });

    it('should adapt workout for equipment limitations', async () => {
      const request = {
        userId: 'test-user',
        workoutType: 'strength' as const,
        targetDuration: 60,
        availableEquipment: ['bodyweight'], // Limited equipment
        fitnessLevel: 'intermediate' as const,
        currentReadiness: 70
      };

      const workout = await orchestrator.generateWorkout(
        request,
        mockExercises,
        mockDailyMetrics,
        mockWorkouts
      );

      expect(workout).toBeDefined();
      
      // Should only include bodyweight exercises or provide alternatives
      workout.exercises.forEach(exercise => {
        const hasBodyweight = exercise.exercise.equipment.includes('bodyweight');
        const hasAlternatives = exercise.alternatives && exercise.alternatives.length > 0;
        expect(hasBodyweight || hasAlternatives).toBe(true);
      });
      
      console.log('✅ Equipment adaptation test passed');
    });

    it('should handle low readiness', async () => {
      const lowReadinessMetrics: DailyMetrics[] = [
        {
          id: '1',
          date: '2025-01-01',
          sleep: 4, // Poor sleep
          energy: 3, // Low energy
          soreness: 8, // High soreness
          stress: 8 // High stress
        }
      ];

      const request = {
        userId: 'test-user',
        workoutType: 'strength' as const,
        targetDuration: 60,
        availableEquipment: ['barbell', 'dumbbell'],
        fitnessLevel: 'intermediate' as const,
        currentReadiness: 35 // Low readiness
      };

      const workout = await orchestrator.generateWorkout(
        request,
        mockExercises,
        lowReadinessMetrics,
        mockWorkouts
      );

      expect(workout).toBeDefined();
      
      // Should adapt for low readiness
      expect(workout.adaptations.readinessAdjustments.length).toBeGreaterThan(0);
      
      // Exercises should have lower RPE targets
      workout.exercises.forEach(exercise => {
        expect(exercise.targetRPE).toBeLessThanOrEqual(7);
      });
      
      console.log('✅ Low readiness adaptation test passed');
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted workout data', async () => {
      const corruptedWorkouts = [
        {
          ...mockWorkouts[0],
          exercises: [
            {
              ...mockWorkouts[0].exercises[0],
              sets: [
                { ...mockWorkouts[0].exercises[0].sets[0], weight: null, reps: null } // Null values
              ]
            }
          ]
        }
      ] as WorkoutSessionWithExercises[];

      const insights = await orchestrator.analyzeUser(
        'test-user',
        corruptedWorkouts,
        mockDailyMetrics,
        mockExercises
      );

      expect(insights).toBeDefined();
      expect(insights.confidence).toBeGreaterThan(0);
      
      console.log('✅ Corrupted data handling test passed');
    });

    it('should handle missing exercise references', async () => {
      const workoutsWithMissingExercises = [
        {
          ...mockWorkouts[0],
          exercises: [
            {
              id: 'non-existent-exercise',
              name: 'Non Existent Exercise',
              category: 'strength' as const,
              sets: [
                { id: 'set-1', weight: 100, reps: 8, rpe: 7, notes: null, is_personal_record: false }
              ]
            }
          ]
        }
      ] as WorkoutSessionWithExercises[];

      const insights = await orchestrator.analyzeUser(
        'test-user',
        workoutsWithMissingExercises,
        mockDailyMetrics,
        mockExercises.slice(0, 2) // Reduced exercise set
      );

      expect(insights).toBeDefined();
      expect(insights.confidence).toBeGreaterThan(0);
      
      console.log('✅ Missing exercise handling test passed');
    });
  });

  describe('Performance Tests', () => {
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      
      await orchestrator.analyzeUser(
        'test-user',
        mockWorkouts,
        mockDailyMetrics,
        mockExercises
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
      
      console.log(`✅ Performance test passed (${duration}ms)`);
    });

    it('should handle large datasets', async () => {
      // Generate larger datasets
      const largeWorkouts: WorkoutSessionWithExercises[] = [];
      const largeDailyMetrics: DailyMetrics[] = [];
      
      for (let i = 0; i < 50; i++) {
        largeWorkouts.push({
          ...mockWorkouts[0],
          id: `workout-${i}`,
          started_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
        });
        
        largeDailyMetrics.push({
          ...mockDailyMetrics[0],
          id: `metric-${i}`,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
      
      const startTime = Date.now();
      
      const insights = await orchestrator.analyzeUser(
        'test-user',
        largeWorkouts,
        largeDailyMetrics,
        mockExercises
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(insights).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should complete in less than 10 seconds even with large datasets
      
      console.log(`✅ Large dataset test passed (${duration}ms, ${largeWorkouts.length} workouts, ${largeDailyMetrics.length} metrics)`);
    }, 15000);
  });

  describe('Data Validation', () => {
    it('should validate prediction ranges', async () => {
      const insights = await orchestrator.analyzeUser(
        'test-user',
        mockWorkouts,
        mockDailyMetrics,
        mockExercises
      );

      // Injury risk should be 0-100
      expect(insights.injuryRisk.overallRisk).toBeGreaterThanOrEqual(0);
      expect(insights.injuryRisk.overallRisk).toBeLessThanOrEqual(100);
      
      // Plateau risk should be 0-100
      expect(insights.plateaus.risk).toBeGreaterThanOrEqual(0);
      expect(insights.plateaus.risk).toBeLessThanOrEqual(100);
      
      // Training window time should be 0-23
      expect(insights.trainingWindows.primary.timeOfDay).toBeGreaterThanOrEqual(0);
      expect(insights.trainingWindows.primary.timeOfDay).toBeLessThan(24);
      
      // Confidence should be 0-1
      expect(insights.confidence).toBeGreaterThanOrEqual(0);
      expect(insights.confidence).toBeLessThanOrEqual(1);
      
      console.log('✅ Prediction range validation test passed');
    });

    it('should provide consistent results', async () => {
      // Run analysis multiple times with same data
      const insights1 = await orchestrator.analyzeUser(
        'test-user',
        mockWorkouts,
        mockDailyMetrics,
        mockExercises
      );
      
      const insights2 = await orchestrator.analyzeUser(
        'test-user',
        mockWorkouts,
        mockDailyMetrics,
        mockExercises
      );

      // Results should be consistent (within small tolerance due to randomness)
      expect(Math.abs(insights1.injuryRisk.overallRisk - insights2.injuryRisk.overallRisk)).toBeLessThan(5);
      expect(Math.abs(insights1.plateaus.risk - insights2.plateaus.risk)).toBeLessThan(5);
      expect(insights1.trainingWindows.primary.timeOfDay).toBe(insights2.trainingWindows.primary.timeOfDay);
      
      console.log('✅ Consistency test passed');
    });
  });
});

// Export for use in other test files
export {
  mockDailyMetrics,
  mockWorkouts,
  mockExercises
};