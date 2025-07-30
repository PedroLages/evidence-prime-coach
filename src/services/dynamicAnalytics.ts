import { useAuth } from '@/contexts/AuthContext';
import { 
  getProfile, 
  getBodyMeasurements, 
  getWorkoutSessions,
  BodyMeasurement 
} from './database';
import { formatWeight, getDefaultUnits } from '@/lib/units';

export interface WorkoutStatistics {
  totalWorkouts: number;
  totalVolume: number; // in kg
  averageWorkoutDuration: number; // in minutes
  currentStreak: number; // consecutive workout days
  workoutConsistency: number; // percentage
  trainingIntensity: number; // average RPE
  recentWorkouts: number; // last 30 days
  longestStreak: number;
  totalSets: number;
  totalReps: number;
}

export interface ExercisePerformance {
  exercise: string;
  category: string;
  totalVolume: number;
  maxWeight: number;
  totalSets: number;
  averageRPE: number;
  personalRecords: number;
  lastPerformed: string;
  trend: 'improving' | 'stable' | 'declining';
  estimatedOneRM: number;
  volumeProgress: number; // percentage change from last month
}

export interface ProgressOverview {
  weightProgress: {
    startWeight: number | null;
    currentWeight: number | null;
    targetWeight: number | null;
    totalChange: number | null;
    progressPercentage: number | null;
    weeklyRate: number | null; // kg per week
    projectedGoalDate: string | null;
  };
  strengthProgress: {
    totalVolumeChange: number; // percentage
    strengthGains: ExercisePerformance[];
    overallTrend: 'improving' | 'stable' | 'declining';
  };
  bodyComposition: {
    measurements: BodyMeasurement[];
    latestMeasurement: BodyMeasurement | null;
    changes: { [key: string]: number }; // change from first measurement
  };
  consistency: {
    weeklyAverage: number;
    monthlyAverage: number;
    adherenceRate: number;
    missedWorkouts: number;
  };
}

export class DynamicAnalyticsService {
  static async getWorkoutStatistics(userId: string): Promise<WorkoutStatistics> {
    try {
      const workoutSessions = await getWorkoutSessions(userId);
      
      if (workoutSessions.length === 0) {
        return this.getEmptyWorkoutStatistics();
      }

      // Calculate total volume
      let totalVolume = 0;
      let totalSets = 0;
      let totalReps = 0;
      let totalRPE = 0;
      let rpeCount = 0;
      let totalDuration = 0;
      let durationCount = 0;

      workoutSessions.forEach(session => {
        if (session.duration) {
          totalDuration += session.duration;
          durationCount++;
        }

        session.exercises?.forEach((exercise: any) => {
          exercise.sets?.forEach((set: any) => {
            if (set.weight && set.reps) {
              totalVolume += set.weight * set.reps;
              totalSets++;
              totalReps += set.reps;
            }
            if (set.rpe) {
              totalRPE += set.rpe;
              rpeCount++;
            }
          });
        });
      });

      // Calculate workout consistency and streaks
      const workoutDates = workoutSessions
        .map(session => new Date(session.date))
        .sort((a, b) => a.getTime() - b.getTime());

      const { currentStreak, longestStreak } = this.calculateStreaks(workoutDates);
      const workoutConsistency = this.calculateConsistency(workoutDates);
      
      // Recent workouts (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentWorkouts = workoutSessions.filter(
        session => new Date(session.date) >= thirtyDaysAgo
      ).length;

      return {
        totalWorkouts: workoutSessions.length || 0,
        totalVolume: totalVolume || 0,
        averageWorkoutDuration: durationCount > 0 ? (totalDuration / durationCount) || 0 : 0,
        currentStreak: currentStreak || 0,
        workoutConsistency: workoutConsistency || 0,
        trainingIntensity: rpeCount > 0 ? (totalRPE / rpeCount) || 0 : 0,
        recentWorkouts: recentWorkouts || 0,
        longestStreak: longestStreak || 0,
        totalSets: totalSets || 0,
        totalReps: totalReps || 0
      };
    } catch (error) {
      console.error('Error calculating workout statistics:', error);
      return this.getEmptyWorkoutStatistics();
    }
  }

  static async getExercisePerformance(userId: string): Promise<ExercisePerformance[]> {
    try {
      const workoutSessions = await getWorkoutSessions(userId);
      const exerciseMap = new Map<string, any>();

      // Aggregate exercise data
      workoutSessions.forEach(session => {
        session.exercises?.forEach((exercise: any) => {
          const key = exercise.name;
          if (!exerciseMap.has(key)) {
            exerciseMap.set(key, {
              exercise: exercise.name,
              category: exercise.category || 'Other',
              totalVolume: 0,
              maxWeight: 0,
              totalSets: 0,
              totalRPE: 0,
              rpeCount: 0,
              personalRecords: 0,
              lastPerformed: session.date,
              weights: [],
              volumes: []
            });
          }

          const data = exerciseMap.get(key);
          
          exercise.sets?.forEach((set: any) => {
            if (set.weight && set.reps) {
              data.totalVolume += set.weight * set.reps;
              data.maxWeight = Math.max(data.maxWeight, set.weight);
              data.totalSets++;
              data.weights.push({ weight: set.weight, date: session.date });
              data.volumes.push({ volume: set.weight * set.reps, date: session.date });
            }
            if (set.rpe) {
              data.totalRPE += set.rpe;
              data.rpeCount++;
            }
            if (set.is_personal_record) {
              data.personalRecords++;
            }
          });

          // Update last performed date
          if (new Date(session.date) > new Date(data.lastPerformed)) {
            data.lastPerformed = session.date;
          }
        });
      });

      // Process and return exercise performance data
      return Array.from(exerciseMap.values()).map(data => {
        const trend = this.calculateExerciseTrend(data.weights, data.volumes);
        const volumeProgress = this.calculateVolumeProgress(data.volumes);
        const estimatedOneRM = data.maxWeight * 1.0278; // Conservative estimate

        return {
          exercise: data.exercise,
          category: data.category,
          totalVolume: data.totalVolume,
          maxWeight: data.maxWeight,
          totalSets: data.totalSets,
          averageRPE: data.rpeCount > 0 ? data.totalRPE / data.rpeCount : 0,
          personalRecords: data.personalRecords,
          lastPerformed: data.lastPerformed,
          trend,
          estimatedOneRM,
          volumeProgress
        };
      }).sort((a, b) => b.totalVolume - a.totalVolume); // Sort by total volume
    } catch (error) {
      console.error('Error calculating exercise performance:', error);
      return [];
    }
  }

  static async getProgressOverview(userId: string): Promise<ProgressOverview> {
    try {
      const [profile, bodyMeasurements, workoutSessions] = await Promise.all([
        getProfile(userId),
        getBodyMeasurements(userId),
        getWorkoutSessions(userId)
      ]);

      // Weight progress
      const weightProgress = this.calculateWeightProgress(profile, bodyMeasurements);

      // Strength progress
      const strengthProgress = this.calculateStrengthProgress(workoutSessions);

      // Body composition
      const bodyComposition = this.calculateBodyComposition(bodyMeasurements);

      // Consistency metrics
      const consistency = this.calculateConsistencyMetrics(workoutSessions);

      return {
        weightProgress,
        strengthProgress,
        bodyComposition,
        consistency
      };
    } catch (error) {
      console.error('Error calculating progress overview:', error);
      return this.getEmptyProgressOverview();
    }
  }

  private static getEmptyWorkoutStatistics(): WorkoutStatistics {
    return {
      totalWorkouts: 0,
      totalVolume: 0,
      averageWorkoutDuration: 0,
      currentStreak: 0,
      workoutConsistency: 0,
      trainingIntensity: 0,
      recentWorkouts: 0,
      longestStreak: 0,
      totalSets: 0,
      totalReps: 0
    };
  }

  private static calculateStreaks(workoutDates: Date[]): { currentStreak: number; longestStreak: number } {
    if (workoutDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check current streak
    const uniqueDates = [...new Set(workoutDates.map(date => date.toDateString()))];
    const sortedUniqueDates = uniqueDates.map(dateStr => new Date(dateStr)).sort((a, b) => b.getTime() - a.getTime());
    
    for (let i = 0; i < sortedUniqueDates.length; i++) {
      const date = sortedUniqueDates[i];
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (date.toDateString() === expectedDate.toDateString() || 
          (i === 0 && date.toDateString() === yesterday.toDateString())) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < sortedUniqueDates.length - 1; i++) {
      const current = sortedUniqueDates[i];
      const next = sortedUniqueDates[i + 1];
      const daysDiff = Math.abs((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 2) { // Allow for rest days
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak + 1);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak + 1);

    return { currentStreak, longestStreak };
  }

  private static calculateConsistency(workoutDates: Date[]): number {
    if (workoutDates.length === 0) return 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentWorkouts = workoutDates.filter(date => date >= thirtyDaysAgo).length;
    const expectedWorkouts = Math.min(12, Math.floor(30 / 2.5)); // ~3 workouts per week for 30 days
    
    return Math.min(100, (recentWorkouts / expectedWorkouts) * 100);
  }

  private static calculateWeightProgress(profile: any, bodyMeasurements: BodyMeasurement[]) {
    const weightMeasurements = bodyMeasurements
      .filter(m => m.weight !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const startWeight = weightMeasurements[0]?.weight || profile?.weight || null;
    const currentWeight = weightMeasurements[weightMeasurements.length - 1]?.weight || profile?.weight || null;
    const targetWeight = profile?.target_weight || null;

    let totalChange = null;
    let progressPercentage = null;
    let weeklyRate = null;
    let projectedGoalDate = null;

    if (startWeight && currentWeight) {
      totalChange = currentWeight - startWeight;
      
      if (targetWeight) {
        const totalNeeded = targetWeight - startWeight;
        progressPercentage = totalNeeded !== 0 ? (totalChange / totalNeeded) * 100 : 0;
        
        // Calculate weekly rate and projection
        if (weightMeasurements.length > 1) {
          const firstDate = new Date(weightMeasurements[0].date);
          const lastDate = new Date(weightMeasurements[weightMeasurements.length - 1].date);
          const weeksDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
          
          if (weeksDiff > 0) {
            weeklyRate = totalChange / weeksDiff;
            
            if (weeklyRate > 0) {
              const remainingWeight = targetWeight - currentWeight;
              const weeksToGoal = remainingWeight / weeklyRate;
              const goalDate = new Date();
              goalDate.setDate(goalDate.getDate() + weeksToGoal * 7);
              projectedGoalDate = goalDate.toISOString();
            }
          }
        }
      }
    }

    return {
      startWeight: startWeight || null,
      currentWeight: currentWeight || null,
      targetWeight: targetWeight || null,
      totalChange: totalChange || null,
      progressPercentage: progressPercentage || null,
      weeklyRate: weeklyRate || null,
      projectedGoalDate: projectedGoalDate || null
    };
  }

  private static calculateStrengthProgress(workoutSessions: any[]) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentVolume = this.calculatePeriodVolume(workoutSessions, thirtyDaysAgo);
    const previousVolume = this.calculatePeriodVolume(workoutSessions, sixtyDaysAgo, thirtyDaysAgo);

    const totalVolumeChange = previousVolume > 0 ? 
      ((recentVolume - previousVolume) / previousVolume) * 100 : 0;

    let overallTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (totalVolumeChange > 5) overallTrend = 'improving';
    else if (totalVolumeChange < -5) overallTrend = 'declining';

    return {
      totalVolumeChange: totalVolumeChange || 0,
      strengthGains: [], // This would be populated with exercise-specific gains
      overallTrend: overallTrend || 'stable'
    };
  }

  private static calculatePeriodVolume(workoutSessions: any[], startDate: Date, endDate?: Date): number {
    return workoutSessions
      .filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= startDate && (!endDate || sessionDate < endDate);
      })
      .reduce((total, session) => {
        return total + (session.exercises?.reduce((sessionTotal: number, exercise: any) => {
          return sessionTotal + (exercise.sets?.reduce((exerciseTotal: number, set: any) => {
            return exerciseTotal + (set.weight * set.reps || 0);
          }, 0) || 0);
        }, 0) || 0);
      }, 0);
  }

  private static calculateBodyComposition(bodyMeasurements: BodyMeasurement[]) {
    const sortedMeasurements = bodyMeasurements.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const latestMeasurement = sortedMeasurements[sortedMeasurements.length - 1] || null;
    const firstMeasurement = sortedMeasurements[0] || null;

    const changes: { [key: string]: number } = {};
    if (firstMeasurement && latestMeasurement) {
      const fields = ['weight', 'body_fat_percentage', 'muscle_mass', 'waist', 'chest', 'arms', 'thighs', 'hips', 'neck'];
      fields.forEach(field => {
        const firstValue = (firstMeasurement as any)[field];
        const latestValue = (latestMeasurement as any)[field];
        if (firstValue !== null && latestValue !== null) {
          changes[field] = latestValue - firstValue;
        }
      });
    }

    return {
      measurements: bodyMeasurements,
      latestMeasurement,
      changes
    };
  }

  private static calculateConsistencyMetrics(workoutSessions: any[]) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyWorkouts = workoutSessions.filter(session => 
      new Date(session.date) >= oneWeekAgo
    ).length;

    const monthlyWorkouts = workoutSessions.filter(session => 
      new Date(session.date) >= oneMonthAgo
    ).length;

    const expectedWeekly = 3; // 3 workouts per week
    const expectedMonthly = 12; // ~3 workouts per week for a month

    const adherenceRate = monthlyWorkouts > 0 ? 
      Math.min(100, (monthlyWorkouts / expectedMonthly) * 100) : 0;

    const missedWorkouts = Math.max(0, expectedMonthly - monthlyWorkouts);

    return {
      weeklyAverage: weeklyWorkouts || 0,
      monthlyAverage: monthlyWorkouts || 0,
      adherenceRate: adherenceRate || 0,
      missedWorkouts: missedWorkouts || 0
    };
  }

  private static calculateExerciseTrend(weights: any[], volumes: any[]): 'improving' | 'stable' | 'declining' {
    if (weights.length < 3) return 'stable';
    
    const recent = weights.slice(-3);
    const earlier = weights.slice(-6, -3);
    
    if (recent.length === 0 || earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, w) => sum + w.weight, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, w) => sum + w.weight, 0) / earlier.length;
    
    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    if (change > 2) return 'improving';
    if (change < -2) return 'declining';
    return 'stable';
  }

  private static calculateVolumeProgress(volumes: any[]): number {
    if (volumes.length < 4) return 0;
    
    const recentMonth = volumes.slice(-4);
    const previousMonth = volumes.slice(-8, -4);
    
    if (recentMonth.length === 0 || previousMonth.length === 0) return 0;
    
    const recentAvg = recentMonth.reduce((sum, v) => sum + v.volume, 0) / recentMonth.length;
    const previousAvg = previousMonth.reduce((sum, v) => sum + v.volume, 0) / previousMonth.length;
    
    return previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
  }

  private static getEmptyProgressOverview(): ProgressOverview {
    return {
      weightProgress: {
        startWeight: null,
        currentWeight: null,
        targetWeight: null,
        totalChange: null,
        progressPercentage: null,
        weeklyRate: null,
        projectedGoalDate: null
      },
      strengthProgress: {
        totalVolumeChange: 0,
        strengthGains: [],
        overallTrend: 'stable'
      },
      bodyComposition: {
        measurements: [],
        latestMeasurement: null,
        changes: {}
      },
      consistency: {
        weeklyAverage: 0,
        monthlyAverage: 0,
        adherenceRate: 0,
        missedWorkouts: 0
      }
    };
  }
}