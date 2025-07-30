import { PerformanceMetric, TrendAnalysis, ComparisonMetrics, ProgressAnalysis, Achievement, ProgressRecommendation, PerformanceProjection, WorkoutAnalytics } from '@/types/analytics';

export class ProgressAnalyzer {
  // Main analysis function
  static analyzeProgress(
    metrics: PerformanceMetric[], 
    timeframe: number = 90 // days
  ): ProgressAnalysis {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframe);
    
    const recentMetrics = metrics.filter(m => new Date(m.date) >= cutoffDate);
    const exercises = [...new Set(recentMetrics.map(m => m.exercise))];
    
    const trends = exercises.map(exercise => 
      this.analyzeTrend(recentMetrics.filter(m => m.exercise === exercise))
    );
    
    const comparisons = exercises.map(exercise =>
      this.comparePerformance(recentMetrics.filter(m => m.exercise === exercise))
    );
    
    const achievements = this.detectAchievements(recentMetrics);
    const recommendations = this.generateRecommendations(trends, comparisons);
    const projections = this.generateProjections(trends);
    
    const overallScore = this.calculateOverallScore(trends, achievements);
    
    return {
      overallScore,
      trends,
      comparisons,
      achievements,
      recommendations,
      projections
    };
  }
  
  // Trend analysis for individual exercises
  static analyzeTrend(exerciseMetrics: PerformanceMetric[]): TrendAnalysis {
    if (exerciseMetrics.length < 3) {
      return {
        exercise: exerciseMetrics[0]?.exercise || '',
        direction: 'stable',
        slope: 0,
        confidence: 0,
        dataPoints: exerciseMetrics.length,
        timeframe: '30 days',
        projectedGains: { oneWeek: 0, oneMonth: 0, threeMonths: 0 }
      };
    }
    
    // Sort by date
    const sorted = exerciseMetrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate linear regression for 1RM trend
    const oneRMValues = sorted.map(m => m.oneRM);
    const slope = this.calculateSlope(oneRMValues);
    const confidence = this.calculateConfidence(oneRMValues, slope);
    
    let direction: 'improving' | 'stable' | 'declining' = 'stable';
    if (slope > 0.5) direction = 'improving';
    else if (slope < -0.5) direction = 'declining';
    
    const projectedGains = this.calculateProjectedGains(slope, oneRMValues[oneRMValues.length - 1]);
    
    return {
      exercise: exerciseMetrics[0].exercise,
      direction,
      slope,
      confidence,
      dataPoints: exerciseMetrics.length,
      timeframe: `${Math.round((new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) / (1000 * 60 * 60 * 24))} days`,
      projectedGains
    };
  }
  
  // Compare current vs previous performance
  static comparePerformance(exerciseMetrics: PerformanceMetric[]): ComparisonMetrics {
    const sorted = exerciseMetrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const midpoint = Math.floor(sorted.length / 2);
    const current = sorted.slice(0, midpoint);
    const previous = sorted.slice(midpoint);
    
    const currentAvg = this.calculateAverages(current);
    const previousAvg = this.calculateAverages(previous);
    
    const changes = {
      oneRM: currentAvg.oneRM - previousAvg.oneRM,
      volume: currentAvg.volume - previousAvg.volume,
      frequency: currentAvg.frequency - previousAvg.frequency
    };
    
    const percentChanges = {
      oneRM: previousAvg.oneRM > 0 ? (changes.oneRM / previousAvg.oneRM) * 100 : 0,
      volume: previousAvg.volume > 0 ? (changes.volume / previousAvg.volume) * 100 : 0,
      frequency: previousAvg.frequency > 0 ? (changes.frequency / previousAvg.frequency) * 100 : 0
    };
    
    return {
      exercise: exerciseMetrics[0]?.exercise || '',
      current: currentAvg,
      previous: previousAvg,
      changes,
      percentChanges
    };
  }
  
  // Detect achievements and milestones
  static detectAchievements(metrics: PerformanceMetric[]): Achievement[] {
    const achievements: Achievement[] = [];
    const exerciseGroups = this.groupByExercise(metrics);
    
    Object.entries(exerciseGroups).forEach(([exercise, exerciseMetrics]) => {
      const sorted = exerciseMetrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // PR Detection
      let maxOneRM = 0;
      sorted.forEach(metric => {
        if (metric.oneRM > maxOneRM) {
          maxOneRM = metric.oneRM;
          achievements.push({
            id: `pr-${exercise}-${metric.date}`,
            type: 'pr',
            title: `New PR: ${exercise}`,
            description: `Hit a new personal record of ${metric.oneRM}lbs`,
            date: metric.date,
            exercise,
            value: metric.oneRM,
            unit: 'lbs',
            rarity: this.getPRRarity(metric.oneRM, exercise)
          });
        }
      });
      
      // Volume milestones
      const totalVolume = sorted.reduce((sum, m) => sum + m.volume, 0);
      if (totalVolume >= 10000) {
        achievements.push({
          id: `volume-${exercise}`,
          type: 'volume',
          title: `Volume Milestone: ${exercise}`,
          description: `Reached ${Math.round(totalVolume).toLocaleString()}lbs total volume`,
          date: sorted[sorted.length - 1].date,
          exercise,
          value: totalVolume,
          unit: 'lbs',
          rarity: totalVolume >= 50000 ? 'legendary' : totalVolume >= 25000 ? 'rare' : 'common'
        });
      }
    });
    
    // Consistency achievements
    const workoutDates = [...new Set(metrics.map(m => m.date))].sort();
    let currentStreak = 0;
    let maxStreak = 0;
    
    for (let i = 1; i < workoutDates.length; i++) {
      const daysDiff = (new Date(workoutDates[i]).getTime() - new Date(workoutDates[i-1]).getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    if (maxStreak >= 4) {
      achievements.push({
        id: 'consistency-streak',
        type: 'consistency',
        title: 'Consistency Champion',
        description: `${maxStreak} week workout streak`,
        date: workoutDates[workoutDates.length - 1],
        value: maxStreak,
        unit: 'weeks',
        rarity: maxStreak >= 12 ? 'legendary' : maxStreak >= 8 ? 'rare' : 'common'
      });
    }
    
    return achievements.slice(-10); // Return most recent 10
  }
  
  // Generate actionable recommendations
  static generateRecommendations(trends: TrendAnalysis[], comparisons: ComparisonMetrics[]): ProgressRecommendation[] {
    const recommendations: ProgressRecommendation[] = [];
    
    trends.forEach(trend => {
      if (trend.direction === 'declining' && trend.confidence > 0.7) {
        recommendations.push({
          id: `declining-${trend.exercise}`,
          category: 'strength',
          priority: 'high',
          title: `Address declining ${trend.exercise} performance`,
          description: `Your ${trend.exercise} has been declining for ${trend.timeframe}`,
          action: 'Consider deload, form check, or program variation',
          expectedOutcome: 'Restore upward progress trend',
          timeframe: '2-3 weeks',
          confidence: trend.confidence
        });
      }
      
      if (trend.direction === 'stable' && trend.dataPoints > 8) {
        recommendations.push({
          id: `plateau-${trend.exercise}`,
          category: 'strength',
          priority: 'medium',
          title: `Break ${trend.exercise} plateau`,
          description: `Progress has stalled over ${trend.timeframe}`,
          action: 'Increase volume, change rep ranges, or add accessories',
          expectedOutcome: 'Resume strength gains',
          timeframe: '3-4 weeks',
          confidence: 0.8
        });
      }
    });
    
    comparisons.forEach(comp => {
      if (comp.percentChanges.frequency < -20) {
        recommendations.push({
          id: `frequency-${comp.exercise}`,
          category: 'frequency',
          priority: 'medium',
          title: `Increase ${comp.exercise} frequency`,
          description: 'Training frequency has decreased significantly',
          action: 'Add another training session per week',
          expectedOutcome: 'Improved skill retention and faster progress',
          timeframe: '2 weeks',
          confidence: 0.75
        });
      }
    });
    
    return recommendations.slice(0, 5);
  }
  
  // Generate performance projections
  static generateProjections(trends: TrendAnalysis[]): PerformanceProjection[] {
    return trends.map(trend => {
      const baseValue = trend.projectedGains.oneWeek;
      
      return {
        exercise: trend.exercise,
        metric: 'oneRM' as const,
        timeframes: {
          oneWeek: { 
            value: baseValue, 
            confidence: trend.confidence * 0.9 
          },
          oneMonth: { 
            value: trend.projectedGains.oneMonth, 
            confidence: trend.confidence * 0.8 
          },
          threeMonths: { 
            value: trend.projectedGains.threeMonths, 
            confidence: trend.confidence * 0.6 
          },
          sixMonths: { 
            value: trend.projectedGains.threeMonths * 2, 
            confidence: trend.confidence * 0.4 
          }
        },
        methodology: 'Linear regression with confidence intervals'
      };
    });
  }
  
  // Calculate workout analytics
  static calculateWorkoutAnalytics(metrics: PerformanceMetric[]): WorkoutAnalytics {
    const workoutDates = [...new Set(metrics.map(m => m.date))];
    const totalVolume = metrics.reduce((sum, m) => sum + m.volume, 0);
    const averageRPE = metrics.reduce((sum, m) => sum + m.rpe, 0) / metrics.length;
    
    // Calculate consistency
    const weeklyWorkouts = this.calculateWeeklyFrequency(workoutDates);
    const currentStreak = this.calculateCurrentStreak(workoutDates);
    const longestStreak = this.calculateLongestStreak(workoutDates);
    
    // Exercise breakdown
    const exerciseGroups = this.groupByExercise(metrics);
    const exerciseBreakdown = Object.entries(exerciseGroups).map(([exercise, exerciseMetrics]) => ({
      exercise,
      frequency: exerciseMetrics.length,
      totalVolume: exerciseMetrics.reduce((sum, m) => sum + m.volume, 0),
      avgWeight: exerciseMetrics.reduce((sum, m) => sum + m.weight, 0) / exerciseMetrics.length,
      lastPerformed: exerciseMetrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
    }));
    
    return {
      totalWorkouts: workoutDates.length,
      totalVolume,
      averageRPE: isNaN(averageRPE) ? 0 : averageRPE,
      averageDuration: 60, // Mock data - would need actual duration tracking
      consistency: {
        weeklyAverage: weeklyWorkouts,
        streak: currentStreak,
        longestStreak
      },
      exerciseBreakdown
    };
  }
  
  // Helper methods
  private static calculateSlope(values: number[]): number {
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * values[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
  
  private static calculateConfidence(values: number[], slope: number): number {
    if (values.length < 3) return 0;
    
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const mean = values.reduce((a, b) => a + b, 0) / n;
    
    let totalVariation = 0;
    let explainedVariation = 0;
    
    for (let i = 0; i < n; i++) {
      const predicted = slope * x[i] + (mean - slope * (n-1)/2);
      totalVariation += Math.pow(values[i] - mean, 2);
      explainedVariation += Math.pow(predicted - mean, 2);
    }
    
    return totalVariation > 0 ? Math.min(explainedVariation / totalVariation, 1) : 0;
  }
  
  private static calculateProjectedGains(slope: number, currentValue: number) {
    return {
      oneWeek: currentValue + (slope * 2), // Assuming 2 workouts per week
      oneMonth: currentValue + (slope * 8),
      threeMonths: currentValue + (slope * 24)
    };
  }
  
  private static calculateAverages(metrics: PerformanceMetric[]) {
    if (metrics.length === 0) {
      return { oneRM: 0, volume: 0, frequency: 0 };
    }
    
    return {
      oneRM: metrics.reduce((sum, m) => sum + m.oneRM, 0) / metrics.length,
      volume: metrics.reduce((sum, m) => sum + m.volume, 0) / metrics.length,
      frequency: metrics.length / (metrics.length > 0 ? 4 : 1) // Approximate weekly frequency
    };
  }
  
  private static groupByExercise(metrics: PerformanceMetric[]) {
    return metrics.reduce((groups, metric) => {
      if (!groups[metric.exercise]) {
        groups[metric.exercise] = [];
      }
      groups[metric.exercise].push(metric);
      return groups;
    }, {} as Record<string, PerformanceMetric[]>);
  }
  
  private static getPRRarity(value: number, exercise: string): 'common' | 'rare' | 'legendary' {
    // Simple heuristic based on exercise and weight
    const benchmarks = {
      'Bench Press': [135, 225, 315],
      'Squat': [185, 315, 405],
      'Deadlift': [225, 405, 500]
    };
    
    const exerciseBenchmarks = benchmarks[exercise as keyof typeof benchmarks] || [100, 200, 300];
    
    if (value >= exerciseBenchmarks[2]) return 'legendary';
    if (value >= exerciseBenchmarks[1]) return 'rare';
    return 'common';
  }
  
  private static calculateOverallScore(trends: TrendAnalysis[], achievements: Achievement[]): number {
    const trendScore = trends.reduce((acc, trend) => {
      if (trend.direction === 'improving') return acc + 30;
      if (trend.direction === 'stable') return acc + 15;
      return acc - 10;
    }, 0);
    
    const achievementScore = achievements.reduce((acc, achievement) => {
      if (achievement.rarity === 'legendary') return acc + 25;
      if (achievement.rarity === 'rare') return acc + 15;
      return acc + 5;
    }, 0);
    
    return Math.min(Math.max((trendScore + achievementScore) / trends.length, 0), 100);
  }
  
  private static calculateWeeklyFrequency(dates: string[]): number {
    if (dates.length === 0) return 0;
    
    const sortedDates = dates.sort();
    const firstDate = new Date(sortedDates[0]);
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const weeks = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
    
    return weeks > 0 ? dates.length / weeks : dates.length;
  }
  
  private static calculateCurrentStreak(dates: string[]): number {
    const sortedDates = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const daysDiff = (new Date(sortedDates[i-1]).getTime() - new Date(sortedDates[i]).getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) {
        streak++;
      } else {
        break;
      }
    }
    
    return Math.floor(streak / 7); // Convert to weeks
  }
  
  private static calculateLongestStreak(dates: string[]): number {
    const sortedDates = dates.sort();
    let maxStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const daysDiff = (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i-1]).getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return Math.floor(maxStreak / 7); // Convert to weeks
  }
}