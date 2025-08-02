/**
 * ML Foundation for Evidence Prime Coach
 * 
 * This module provides the core ML infrastructure including:
 * - Data preprocessing and feature engineering
 * - Statistical analysis utilities
 * - Machine learning model abstractions
 * - Time series analysis functions
 * - Prediction confidence calculations
 */

import { DailyMetrics, ReadinessFactors } from '@/types/aiCoach';
import { PerformanceMetric, TrendAnalysis } from '@/types/analytics';
import { WorkoutSessionWithExercises, Exercise } from '@/services/database';

// ===== TYPES & INTERFACES =====

export interface MLFeature {
  name: string;
  value: number;
  importance: number;
  category: 'temporal' | 'readiness' | 'performance' | 'user' | 'exercise';
}

export interface DataPoint {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface TimeSeriesData {
  metric: string;
  data: DataPoint[];
  frequency: 'daily' | 'weekly' | 'monthly';
  unit: string;
}

export interface MLModel {
  name: string;
  type: 'regression' | 'classification' | 'timeseries';
  features: string[];
  lastTrained: string;
  accuracy: number;
  predict(features: MLFeature[]): MLPrediction;
}

export interface MLPrediction {
  value: number;
  confidence: number;
  variance: number;
  factors: {
    feature: string;
    contribution: number;
    importance: number;
  }[];
  methodology: string;
  timeframe?: number; // days into future
}

export interface TrainingDataset {
  features: MLFeature[][];
  targets: number[];
  metadata: {
    exerciseId?: string;
    userId?: string;
    timeRange: { start: string; end: string };
  };
}

// ===== STATISTICAL UTILITIES =====

export class StatUtils {
  /**
   * Calculate linear regression coefficients
   */
  static linearRegression(x: number[], y: number[]): {
    slope: number;
    intercept: number;
    rSquared: number;
    confidence: number;
  } {
    if (x.length !== y.length || x.length < 2) {
      return { slope: 0, intercept: 0, rSquared: 0, confidence: 0 };
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
    const residualSumSquares = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    
    const rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
    const confidence = Math.max(0, Math.min(1, rSquared));

    return { slope, intercept, rSquared, confidence };
  }

  /**
   * Calculate moving average
   */
  static movingAverage(data: number[], window: number): number[] {
    if (window >= data.length) return [data.reduce((a, b) => a + b, 0) / data.length];
    
    const result: number[] = [];
    for (let i = window - 1; i < data.length; i++) {
      const slice = data.slice(i - window + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / window);
    }
    return result;
  }

  /**
   * Calculate exponential moving average
   */
  static exponentialMovingAverage(data: number[], alpha: number = 0.2): number[] {
    if (data.length === 0) return [];
    
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
    }
    return result;
  }

  /**
   * Detect outliers using IQR method
   */
  static detectOutliers(data: number[]): { outliers: number[]; indices: number[] } {
    if (data.length < 4) return { outliers: [], indices: [] };

    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers: number[] = [];
    const indices: number[] = [];

    data.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outliers.push(value);
        indices.push(index);
      }
    });

    return { outliers, indices };
  }

  /**
   * Calculate correlation coefficient
   */
  static correlation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate standard deviation
   */
  static standardDeviation(data: number[]): number {
    if (data.length < 2) return 0;
    
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (data.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Normalize data to 0-1 range
   */
  static normalize(data: number[]): { normalized: number[]; min: number; max: number } {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    if (range === 0) {
      return { normalized: data.map(() => 0.5), min, max };
    }
    
    const normalized = data.map(value => (value - min) / range);
    return { normalized, min, max };
  }
}

// ===== FEATURE ENGINEERING =====

export class FeatureEngineering {
  /**
   * Extract features from daily metrics
   */
  static extractReadinessFeatures(metrics: DailyMetrics[]): MLFeature[] {
    if (metrics.length === 0) return [];

    const features: MLFeature[] = [];
    const latest = metrics[0];

    // Current state features
    features.push(
      { name: 'sleep_current', value: latest.sleep, importance: 0.35, category: 'readiness' },
      { name: 'energy_current', value: latest.energy, importance: 0.25, category: 'readiness' },
      { name: 'soreness_current', value: 10 - latest.soreness, importance: 0.20, category: 'readiness' },
      { name: 'stress_current', value: 10 - latest.stress, importance: 0.15, category: 'readiness' }
    );

    if (latest.hrv) {
      features.push({ name: 'hrv_current', value: latest.hrv, importance: 0.05, category: 'readiness' });
    }

    // Trend features (last 7 days)
    const recentMetrics = metrics.slice(0, 7);
    if (recentMetrics.length >= 3) {
      const sleepTrend = this.calculateTrend(recentMetrics.map(m => m.sleep));
      const energyTrend = this.calculateTrend(recentMetrics.map(m => m.energy));
      
      features.push(
        { name: 'sleep_trend', value: sleepTrend, importance: 0.15, category: 'temporal' },
        { name: 'energy_trend', value: energyTrend, importance: 0.10, category: 'temporal' }
      );
    }

    // Variability features
    if (recentMetrics.length >= 5) {
      const sleepVariability = StatUtils.standardDeviation(recentMetrics.map(m => m.sleep));
      const energyVariability = StatUtils.standardDeviation(recentMetrics.map(m => m.energy));
      
      features.push(
        { name: 'sleep_variability', value: sleepVariability, importance: 0.08, category: 'temporal' },
        { name: 'energy_variability', value: energyVariability, importance: 0.06, category: 'temporal' }
      );
    }

    // Weekly patterns
    const dayOfWeek = new Date(latest.date).getDay();
    features.push(
      { name: 'day_of_week', value: dayOfWeek, importance: 0.05, category: 'temporal' }
    );

    return features;
  }

  /**
   * Extract features from workout performance data
   */
  static extractPerformanceFeatures(
    workouts: WorkoutSessionWithExercises[],
    exerciseId?: string
  ): MLFeature[] {
    if (workouts.length === 0) return [];

    const features: MLFeature[] = [];

    // Filter for specific exercise if provided
    const relevantWorkouts = exerciseId 
      ? workouts.filter(w => w.exercises.some(e => e.id === exerciseId))
      : workouts;

    if (relevantWorkouts.length === 0) return [];

    // Recent performance metrics
    const recentVolumes = relevantWorkouts.slice(0, 5).map(w => 
      w.exercises.reduce((sum, e) => sum + e.sets.reduce((setSum, s) => 
        setSum + (s.weight || 0) * (s.reps || 0), 0), 0)
    );

    const recentRPEs = relevantWorkouts.slice(0, 5).flatMap(w => 
      w.exercises.flatMap(e => e.sets.map(s => s.rpe || 5).filter(rpe => rpe > 0))
    );

    if (recentVolumes.length > 0) {
      const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
      const volumeTrend = recentVolumes.length >= 3 ? this.calculateTrend(recentVolumes) : 0;
      
      features.push(
        { name: 'avg_volume', value: avgVolume, importance: 0.30, category: 'performance' },
        { name: 'volume_trend', value: volumeTrend, importance: 0.25, category: 'temporal' }
      );
    }

    if (recentRPEs.length > 0) {
      const avgRPE = recentRPEs.reduce((a, b) => a + b, 0) / recentRPEs.length;
      features.push(
        { name: 'avg_rpe', value: avgRPE, importance: 0.20, category: 'performance' }
      );
    }

    // Frequency features
    const workoutFrequency = this.calculateWorkoutFrequency(relevantWorkouts);
    features.push(
      { name: 'workout_frequency', value: workoutFrequency, importance: 0.15, category: 'temporal' }
    );

    // Recovery time between sessions
    const avgRecoveryTime = this.calculateAverageRecoveryTime(relevantWorkouts);
    features.push(
      { name: 'avg_recovery_time', value: avgRecoveryTime, importance: 0.10, category: 'temporal' }
    );

    return features;
  }

  /**
   * Calculate trend direction and magnitude
   */
  private static calculateTrend(data: number[]): number {
    if (data.length < 3) return 0;
    
    const indices = data.map((_, i) => i);
    const regression = StatUtils.linearRegression(indices, data);
    
    // Normalize slope to -1 to 1 range
    const normalizedSlope = Math.tanh(regression.slope * regression.confidence);
    return normalizedSlope;
  }

  /**
   * Calculate workout frequency (workouts per week)
   */
  private static calculateWorkoutFrequency(workouts: WorkoutSessionWithExercises[]): number {
    if (workouts.length < 2) return 0;

    const sortedWorkouts = workouts.sort((a, b) => 
      new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
    );

    const firstDate = new Date(sortedWorkouts[0].started_at);
    const lastDate = new Date(sortedWorkouts[sortedWorkouts.length - 1].started_at);
    const weeksDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
    
    return weeksDiff > 0 ? workouts.length / weeksDiff : 0;
  }

  /**
   * Calculate average recovery time between workouts
   */
  private static calculateAverageRecoveryTime(workouts: WorkoutSessionWithExercises[]): number {
    if (workouts.length < 2) return 0;

    const sortedWorkouts = workouts.sort((a, b) => 
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );

    const recoveryTimes: number[] = [];
    for (let i = 0; i < sortedWorkouts.length - 1; i++) {
      const current = new Date(sortedWorkouts[i].started_at);
      const previous = new Date(sortedWorkouts[i + 1].started_at);
      const hoursDiff = (current.getTime() - previous.getTime()) / (1000 * 60 * 60);
      recoveryTimes.push(hoursDiff);
    }

    return recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length;
  }

  /**
   * Create lag features for time series prediction
   */
  static createLagFeatures(data: number[], lags: number[]): MLFeature[][] {
    const features: MLFeature[][] = [];
    
    for (let i = Math.max(...lags); i < data.length; i++) {
      const featureSet: MLFeature[] = [];
      
      lags.forEach(lag => {
        if (i - lag >= 0) {
          featureSet.push({
            name: `lag_${lag}`,
            value: data[i - lag],
            importance: 1 / (lag + 1), // Higher importance for recent lags
            category: 'temporal'
          });
        }
      });
      
      features.push(featureSet);
    }
    
    return features;
  }
}

// ===== TIME SERIES ANALYSIS =====

export class TimeSeriesAnalysis {
  /**
   * Detect seasonality in time series data
   */
  static detectSeasonality(data: DataPoint[]): {
    hasSeasonality: boolean;
    period?: number;
    strength: number;
  } {
    if (data.length < 14) {
      return { hasSeasonality: false, strength: 0 };
    }

    const values = data.map(d => d.value);
    
    // Test for weekly seasonality (7-day period)
    const weeklyCorrelation = this.calculateSeasonalCorrelation(values, 7);
    
    if (weeklyCorrelation > 0.3) {
      return {
        hasSeasonality: true,
        period: 7,
        strength: weeklyCorrelation
      };
    }

    return { hasSeasonality: false, strength: weeklyCorrelation };
  }

  /**
   * Calculate seasonal correlation for a given period
   */
  private static calculateSeasonalCorrelation(data: number[], period: number): number {
    if (data.length < period * 2) return 0;

    const laggedData = data.slice(period);
    const originalData = data.slice(0, -period);
    
    return StatUtils.correlation(originalData, laggedData);
  }

  /**
   * Forecast future values using exponential smoothing
   */
  static exponentialSmoothing(
    data: number[],
    alpha: number = 0.3,
    periods: number = 7
  ): number[] {
    if (data.length === 0) return [];

    const smoothed = StatUtils.exponentialMovingAverage(data, alpha);
    const trend = this.calculateTrend(data);
    const lastValue = smoothed[smoothed.length - 1];

    const forecasts: number[] = [];
    for (let i = 1; i <= periods; i++) {
      forecasts.push(lastValue + trend * i);
    }

    return forecasts;
  }

  /**
   * Calculate trend component
   */
  private static calculateTrend(data: number[]): number {
    if (data.length < 3) return 0;
    
    const indices = data.map((_, i) => i);
    const regression = StatUtils.linearRegression(indices, data);
    
    return regression.slope * regression.confidence;
  }

  /**
   * Decompose time series into trend, seasonal, and residual components
   */
  static decompose(data: DataPoint[]): {
    trend: number[];
    seasonal: number[];
    residual: number[];
    original: number[];
  } {
    const values = data.map(d => d.value);
    
    // Calculate trend using moving average
    const trendWindow = Math.min(7, Math.floor(values.length / 3));
    const trend = StatUtils.movingAverage(values, trendWindow);
    
    // Pad trend to match original length
    const paddedTrend = this.padArray(trend, values.length);
    
    // Calculate seasonal component (simplified)
    const detrended = values.map((val, i) => val - paddedTrend[i]);
    const seasonal = this.calculateSeasonalComponent(detrended);
    
    // Calculate residual
    const residual = values.map((val, i) => val - paddedTrend[i] - seasonal[i]);
    
    return {
      trend: paddedTrend,
      seasonal,
      residual,
      original: values
    };
  }

  /**
   * Pad array to target length
   */
  private static padArray(arr: number[], targetLength: number): number[] {
    if (arr.length >= targetLength) return arr;
    
    const padded = [...arr];
    const diff = targetLength - arr.length;
    const lastValue = arr[arr.length - 1];
    
    for (let i = 0; i < diff; i++) {
      padded.unshift(lastValue);
    }
    
    return padded;
  }

  /**
   * Calculate seasonal component (simplified approach)
   */
  private static calculateSeasonalComponent(detrended: number[]): number[] {
    // For simplicity, assume no seasonality for now
    // In a more advanced implementation, this would use proper seasonal decomposition
    return detrended.map(() => 0);
  }
}

// ===== MODEL ABSTRACTIONS =====

export abstract class BaseMLModel implements MLModel {
  abstract name: string;
  abstract type: 'regression' | 'classification' | 'timeseries';
  abstract features: string[];
  abstract lastTrained: string;
  abstract accuracy: number;

  abstract predict(features: MLFeature[]): MLPrediction;

  /**
   * Calculate prediction confidence based on feature quality
   */
  protected calculateConfidence(features: MLFeature[]): number {
    if (features.length === 0) return 0;

    // Base confidence on feature completeness and importance
    const totalImportance = features.reduce((sum, f) => sum + f.importance, 0);
    const maxPossibleImportance = this.features.length;
    
    const completeness = totalImportance / maxPossibleImportance;
    
    // Adjust for feature quality (non-zero values)
    const nonZeroFeatures = features.filter(f => f.value !== 0).length;
    const quality = nonZeroFeatures / features.length;
    
    return Math.min(1, completeness * quality * 0.9); // Cap at 90%
  }

  /**
   * Validate input features
   */
  protected validateFeatures(features: MLFeature[]): boolean {
    const requiredFeatures = this.features;
    const providedFeatures = features.map(f => f.name);
    
    // Check if all required features are present
    return requiredFeatures.every(required => 
      providedFeatures.includes(required)
    );
  }
}

export { BaseMLModel as MLModelBase };