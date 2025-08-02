import { PerformanceMetric } from '@/types/analytics';

export interface PredictionModel {
  name: string;
  type: 'linear' | 'polynomial' | 'exponential' | 'logistic';
  coefficients: number[];
  rSquared: number;
  predictions: {
    oneWeek: { value: number; confidence: number };
    oneMonth: { value: number; confidence: number };
    threeMonths: { value: number; confidence: number };
    sixMonths: { value: number; confidence: number };
    oneYear: { value: number; confidence: number };
  };
}

export interface InjuryRiskAssessment {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  riskScore: number; // 0-100
  factors: {
    trainingLoad: number;
    volumeIncrease: number;
    intensitySpike: number;
    recoveryTime: number;
    consistencyPattern: number;
  };
  recommendations: string[];
  timeToRecommendedDeload: number; // days
}

export interface GoalAchievementPrediction {
  goalType: 'strength' | 'bodyweight' | 'volume' | 'consistency';
  targetValue: number;
  currentValue: number;
  achievementProbability: number; // 0-1
  estimatedTimeframe: {
    optimistic: number; // days
    realistic: number; // days
    pessimistic: number; // days
  };
  requiredProgressRate: number;
  currentProgressRate: number;
  confidenceLevel: number;
}

export interface WeightLossPrediction {
  currentWeight: number;
  targetWeight: number;
  predictedLossRate: number; // kg/week
  estimatedCompletion: string;
  milestones: {
    date: string;
    weight: number;
    percentage: number;
  }[];
  plateauRisk: {
    probability: number;
    estimatedDate: string | null;
    preventionStrategies: string[];
  };
  metabolicAdaptation: {
    currentBMR: number;
    predictedBMR: number;
    adaptationPercentage: number;
  };
  sustainabilityScore: number; // 0-100
  recommendations: {
    calorieAdjustments: string[];
    exerciseModifications: string[];
    timingOptimizations: string[];
  };
}

export interface PlateauPrediction {
  exercise: string;
  plateauProbability: number; // 0-1
  estimatedPlateauDate: string | null;
  currentTrendStrength: number;
  variationRecommendations: string[];
  breakoutStrategies: string[];
}

export class PredictiveModelingEngine {
  
  // Enhanced performance prediction with multiple models
  static predictPerformance(
    exerciseMetrics: PerformanceMetric[], 
    metric: 'oneRM' | 'volume' | 'frequency' = 'oneRM'
  ): PredictionModel[] {
    if (exerciseMetrics.length < 4) {
      return [];
    }

    const sortedMetrics = exerciseMetrics.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const values = sortedMetrics.map(m => {
      switch (metric) {
        case 'oneRM': return m.oneRM;
        case 'volume': return m.volume;
        case 'frequency': return 1; // Sessions per timeframe
        default: return m.oneRM;
      }
    });

    const models: PredictionModel[] = [];

    // Linear regression model
    const linearModel = this.createLinearModel(values);
    if (linearModel) models.push(linearModel);

    // Polynomial regression model (2nd degree)
    const polynomialModel = this.createPolynomialModel(values, 2);
    if (polynomialModel) models.push(polynomialModel);

    // Exponential model for strength gains
    const exponentialModel = this.createExponentialModel(values);
    if (exponentialModel) models.push(exponentialModel);

    // Logistic model for plateau prediction
    const logisticModel = this.createLogisticModel(values);
    if (logisticModel) models.push(logisticModel);

    // Return models sorted by R² (best fit first)
    return models.sort((a, b) => b.rSquared - a.rSquared);
  }

  // Injury risk assessment based on training patterns
  static assessInjuryRisk(metrics: PerformanceMetric[]): InjuryRiskAssessment {
    if (metrics.length < 7) {
      return this.getDefaultRiskAssessment();
    }

    const sortedMetrics = metrics.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const recentWeek = sortedMetrics.slice(0, 7);
    const previousWeek = sortedMetrics.slice(7, 14);

    // Calculate risk factors
    const trainingLoad = this.calculateTrainingLoadRisk(recentWeek);
    const volumeIncrease = this.calculateVolumeIncreaseRisk(recentWeek, previousWeek);
    const intensitySpike = this.calculateIntensitySpikeRisk(recentWeek);
    const recoveryTime = this.calculateRecoveryRisk(recentWeek);
    const consistencyPattern = this.calculateConsistencyRisk(sortedMetrics);

    const riskScore = Math.min(100, 
      trainingLoad * 0.3 + 
      volumeIncrease * 0.25 + 
      intensitySpike * 0.2 + 
      recoveryTime * 0.15 + 
      consistencyPattern * 0.1
    );

    let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    if (riskScore < 25) riskLevel = 'low';
    else if (riskScore < 50) riskLevel = 'moderate';
    else if (riskScore < 75) riskLevel = 'high';
    else riskLevel = 'critical';

    const recommendations = this.generateInjuryPreventionRecommendations(riskLevel, {
      trainingLoad, volumeIncrease, intensitySpike, recoveryTime, consistencyPattern
    });

    const timeToRecommendedDeload = this.calculateDeloadTiming(riskScore, sortedMetrics);

    return {
      riskLevel,
      riskScore,
      factors: { trainingLoad, volumeIncrease, intensitySpike, recoveryTime, consistencyPattern },
      recommendations,
      timeToRecommendedDeload
    };
  }

  // Goal achievement prediction
  static predictGoalAchievement(
    currentValue: number,
    targetValue: number,
    historicalData: PerformanceMetric[],
    goalType: 'strength' | 'bodyweight' | 'volume' | 'consistency'
  ): GoalAchievementPrediction {
    if (historicalData.length < 3) {
      return this.getDefaultGoalPrediction(goalType, targetValue, currentValue);
    }

    const progressRate = this.calculateProgressRate(historicalData, goalType);
    const requiredProgressRate = (targetValue - currentValue) / 90; // Assume 90-day target
    
    const achievementProbability = Math.min(1, Math.max(0, 
      progressRate > 0 ? Math.min(progressRate / requiredProgressRate, 1) : 0
    ));

    const baseTimeframe = Math.abs(targetValue - currentValue) / Math.max(progressRate, 0.01);
    
    const estimatedTimeframe = {
      optimistic: Math.floor(baseTimeframe * 0.7),
      realistic: Math.floor(baseTimeframe),
      pessimistic: Math.floor(baseTimeframe * 1.5)
    };

    const confidenceLevel = this.calculateConfidenceLevel(historicalData, progressRate);

    return {
      goalType,
      targetValue,
      currentValue,
      achievementProbability,
      estimatedTimeframe,
      requiredProgressRate,
      currentProgressRate: progressRate,
      confidenceLevel
    };
  }

  // Plateau prediction
  static predictPlateau(exerciseMetrics: PerformanceMetric[]): PlateauPrediction {
    if (exerciseMetrics.length < 6) {
      return this.getDefaultPlateauPrediction(exerciseMetrics[0]?.exercise || 'Unknown');
    }

    const exercise = exerciseMetrics[0].exercise;
    const sortedMetrics = exerciseMetrics.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Analyze trend strength using rolling averages
    const trendStrength = this.calculateTrendStrength(sortedMetrics);
    const plateauProbability = this.calculatePlateauProbability(sortedMetrics, trendStrength);
    
    let estimatedPlateauDate: string | null = null;
    if (plateauProbability > 0.6) {
      const daysToPlateua = Math.floor((1 - trendStrength) * 30);
      const plateauDate = new Date();
      plateauDate.setDate(plateauDate.getDate() + daysToPlateua);
      estimatedPlateauDate = plateauDate.toISOString();
    }

    const variationRecommendations = this.generateVariationRecommendations(exercise, plateauProbability);
    const breakoutStrategies = this.generateBreakoutStrategies(exercise, trendStrength);

    return {
      exercise,
      plateauProbability,
      estimatedPlateauDate,
      currentTrendStrength: trendStrength,
      variationRecommendations,
      breakoutStrategies
    };
  }

  // Private helper methods
  private static createLinearModel(values: number[]): PredictionModel | null {
    if (values.length < 3) return null;

    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * values[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const rSquared = this.calculateRSquared(values, x.map(xi => slope * xi + intercept));
    
    const currentValue = values[values.length - 1];
    const baseConfidence = Math.max(0.1, rSquared);
    
    return {
      name: 'Linear Regression',
      type: 'linear',
      coefficients: [intercept, slope],
      rSquared,
      predictions: {
        oneWeek: { 
          value: currentValue + slope * 2, 
          confidence: baseConfidence * 0.95 
        },
        oneMonth: { 
          value: currentValue + slope * 8, 
          confidence: baseConfidence * 0.85 
        },
        threeMonths: { 
          value: currentValue + slope * 24, 
          confidence: baseConfidence * 0.7 
        },
        sixMonths: { 
          value: currentValue + slope * 48, 
          confidence: baseConfidence * 0.5 
        },
        oneYear: { 
          value: currentValue + slope * 96, 
          confidence: baseConfidence * 0.3 
        }
      }
    };
  }

  private static createPolynomialModel(values: number[], degree: number): PredictionModel | null {
    if (values.length < degree + 1) return null;

    // Simplified polynomial regression (quadratic)
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    
    // For quadratic: y = ax² + bx + c
    // Using least squares method (simplified implementation)
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumX3 = x.reduce((acc, xi) => acc + xi * xi * xi, 0);
    const sumX4 = x.reduce((acc, xi) => acc + xi * xi * xi * xi, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * values[i], 0);
    const sumX2Y = x.reduce((acc, xi, i) => acc + xi * xi * values[i], 0);

    // Solve system of equations (simplified for quadratic)
    const denom = n * sumX2 * sumX4 + 2 * sumX * sumX2 * sumX3 - sumX2 * sumX2 * sumX2 - n * sumX3 * sumX3 - sumX * sumX * sumX4;
    
    if (Math.abs(denom) < 1e-10) return null;

    const a = (n * sumX2 * sumX2Y + sumX * sumX3 * sumY + sumX * sumX2 * sumXY - sumX2 * sumX2 * sumY - n * sumX3 * sumXY - sumX * sumX * sumX2Y) / denom;
    const b = (n * sumX4 * sumXY + sumX * sumX2 * sumX2Y + sumX2 * sumX3 * sumY - sumX2 * sumX2 * sumXY - n * sumX3 * sumX2Y - sumX * sumX4 * sumY) / denom;
    const c = (sumX2 * sumX4 * sumY + sumX * sumX3 * sumX2Y + sumX2 * sumX3 * sumXY - sumX2 * sumX2 * sumX2Y - sumX * sumX4 * sumXY - sumX3 * sumX3 * sumY) / denom;

    const predictions = x.map(xi => a * xi * xi + b * xi + c);
    const rSquared = this.calculateRSquared(values, predictions);
    
    const currentValue = values[values.length - 1];
    const lastX = n - 1;
    const baseConfidence = Math.max(0.1, rSquared);
    
    return {
      name: 'Polynomial Regression',
      type: 'polynomial', 
      coefficients: [c, b, a],
      rSquared,
      predictions: {
        oneWeek: { 
          value: a * (lastX + 2) * (lastX + 2) + b * (lastX + 2) + c, 
          confidence: baseConfidence * 0.9 
        },
        oneMonth: { 
          value: a * (lastX + 8) * (lastX + 8) + b * (lastX + 8) + c, 
          confidence: baseConfidence * 0.8 
        },
        threeMonths: { 
          value: a * (lastX + 24) * (lastX + 24) + b * (lastX + 24) + c, 
          confidence: baseConfidence * 0.65 
        },
        sixMonths: { 
          value: a * (lastX + 48) * (lastX + 48) + b * (lastX + 48) + c, 
          confidence: baseConfidence * 0.45 
        },
        oneYear: { 
          value: a * (lastX + 96) * (lastX + 96) + b * (lastX + 96) + c, 
          confidence: baseConfidence * 0.25 
        }
      }
    };
  }

  private static createExponentialModel(values: number[]): PredictionModel | null {
    if (values.length < 3 || values.some(v => v <= 0)) return null;

    // Exponential model: y = ae^(bx)
    // Transform to linear: ln(y) = ln(a) + bx
    const logValues = values.map(v => Math.log(v));
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumLogY = logValues.reduce((a, b) => a + b, 0);
    const sumXLogY = x.reduce((acc, xi, i) => acc + xi * logValues[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const b = (n * sumXLogY - sumX * sumLogY) / (n * sumXX - sumX * sumX);
    const lnA = (sumLogY - b * sumX) / n;
    const a = Math.exp(lnA);
    
    const predictions = x.map(xi => a * Math.exp(b * xi));
    const rSquared = this.calculateRSquared(values, predictions);
    
    const lastX = n - 1;
    const baseConfidence = Math.max(0.1, rSquared);
    
    return {
      name: 'Exponential Model',
      type: 'exponential',
      coefficients: [a, b],
      rSquared,
      predictions: {
        oneWeek: { 
          value: a * Math.exp(b * (lastX + 2)), 
          confidence: baseConfidence * 0.85 
        },
        oneMonth: { 
          value: a * Math.exp(b * (lastX + 8)), 
          confidence: baseConfidence * 0.7 
        },
        threeMonths: { 
          value: a * Math.exp(b * (lastX + 24)), 
          confidence: baseConfidence * 0.5 
        },
        sixMonths: { 
          value: a * Math.exp(b * (lastX + 48)), 
          confidence: baseConfidence * 0.3 
        },
        oneYear: { 
          value: a * Math.exp(b * (lastX + 96)), 
          confidence: baseConfidence * 0.15 
        }
      }
    };
  }

  private static createLogisticModel(values: number[]): PredictionModel | null {
    if (values.length < 4) return null;

    // Simplified logistic model: y = L / (1 + e^(-k(x-x0)))
    // Estimate parameters
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const L = maxVal * 1.1; // Carrying capacity estimate
    const k = 0.1; // Growth rate estimate
    const x0 = values.length / 2; // Midpoint estimate
    
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const predictions = x.map(xi => L / (1 + Math.exp(-k * (xi - x0))));
    const rSquared = this.calculateRSquared(values, predictions);
    
    const lastX = n - 1;
    const baseConfidence = Math.max(0.1, rSquared);
    
    return {
      name: 'Logistic Model',
      type: 'logistic',
      coefficients: [L, k, x0],
      rSquared,
      predictions: {
        oneWeek: { 
          value: L / (1 + Math.exp(-k * ((lastX + 2) - x0))), 
          confidence: baseConfidence * 0.8 
        },
        oneMonth: { 
          value: L / (1 + Math.exp(-k * ((lastX + 8) - x0))), 
          confidence: baseConfidence * 0.75 
        },
        threeMonths: { 
          value: L / (1 + Math.exp(-k * ((lastX + 24) - x0))), 
          confidence: baseConfidence * 0.7 
        },
        sixMonths: { 
          value: L / (1 + Math.exp(-k * ((lastX + 48) - x0))), 
          confidence: baseConfidence * 0.65 
        },
        oneYear: { 
          value: L / (1 + Math.exp(-k * ((lastX + 96) - x0))), 
          confidence: baseConfidence * 0.6 
        }
      }
    };
  }

  private static calculateRSquared(actual: number[], predicted: number[]): number {
    const actualMean = actual.reduce((a, b) => a + b, 0) / actual.length;
    const totalSumSquares = actual.reduce((acc, val) => acc + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = actual.reduce((acc, val, i) => acc + Math.pow(val - predicted[i], 2), 0);
    
    return totalSumSquares > 0 ? Math.max(0, 1 - (residualSumSquares / totalSumSquares)) : 0;
  }

  private static calculateTrainingLoadRisk(recentMetrics: PerformanceMetric[]): number {
    const totalVolume = recentMetrics.reduce((sum, m) => sum + m.volume, 0);
    const avgRPE = recentMetrics.reduce((sum, m) => sum + m.rpe, 0) / recentMetrics.length;
    
    // Higher volume + higher RPE = higher risk
    const volumeRisk = Math.min(100, totalVolume / 1000); // Normalize
    const intensityRisk = Math.max(0, (avgRPE - 6) * 25); // RPE > 6 increases risk
    
    return (volumeRisk + intensityRisk) / 2;
  }

  private static calculateVolumeIncreaseRisk(recent: PerformanceMetric[], previous: PerformanceMetric[]): number {
    if (previous.length === 0) return 0;
    
    const recentVolume = recent.reduce((sum, m) => sum + m.volume, 0);
    const previousVolume = previous.reduce((sum, m) => sum + m.volume, 0);
    
    const increase = ((recentVolume - previousVolume) / previousVolume) * 100;
    
    // >10% increase starts to be risky, >25% is very risky
    return Math.max(0, Math.min(100, (increase - 10) * 4));
  }

  private static calculateIntensitySpikeRisk(recentMetrics: PerformanceMetric[]): number {
    if (recentMetrics.length < 2) return 0;
    
    const rpeValues = recentMetrics.map(m => m.rpe);
    const maxRPE = Math.max(...rpeValues);
    const avgRPE = rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length;
    
    const spike = maxRPE - avgRPE;
    return Math.max(0, Math.min(100, spike * 25)); // RPE spike > 2 is risky
  }

  private static calculateRecoveryRisk(recentMetrics: PerformanceMetric[]): number {
    // Simple heuristic: consecutive days of high RPE indicate poor recovery
    let consecutiveHighRPE = 0;
    let maxConsecutive = 0;
    
    for (const metric of recentMetrics) {
      if (metric.rpe >= 8) {
        consecutiveHighRPE++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveHighRPE);
      } else {
        consecutiveHighRPE = 0;
      }
    }
    
    return Math.min(100, maxConsecutive * 25); // 3+ consecutive high RPE days = high risk
  }

  private static calculateConsistencyRisk(allMetrics: PerformanceMetric[]): number {
    if (allMetrics.length < 7) return 0;
    
    // Check for erratic patterns in recent training
    const recent = allMetrics.slice(0, 7);
    const volumes = recent.map(m => m.volume);
    const volumeStdDev = this.calculateStandardDeviation(volumes);
    const volumeMean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    
    const coefficientOfVariation = volumeStdDev / volumeMean;
    return Math.min(100, coefficientOfVariation * 100); // High variation = higher risk
  }

  private static calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private static generateInjuryPreventionRecommendations(
    riskLevel: string, 
    factors: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Consider immediate deload week');
      recommendations.push('Focus on mobility and recovery work');
      recommendations.push('Reduce training intensity by 20-30%');
    }
    
    if (factors.volumeIncrease > 50) {
      recommendations.push('Volume increased too rapidly - scale back to previous levels');
    }
    
    if (factors.intensitySpike > 50) {
      recommendations.push('Avoid consecutive high-intensity sessions');
    }
    
    if (factors.recoveryTime > 60) {
      recommendations.push('Increase rest periods between sets and sessions');
      recommendations.push('Prioritize sleep and nutrition');
    }
    
    return recommendations;
  }

  private static calculateDeloadTiming(riskScore: number, metrics: PerformanceMetric[]): number {
    // Higher risk = sooner deload needed
    const baseDeloadInterval = 28; // 4 weeks
    const riskMultiplier = 1 - (riskScore / 100);
    
    return Math.max(3, Math.floor(baseDeloadInterval * riskMultiplier));
  }

  private static calculateProgressRate(data: PerformanceMetric[], goalType: string): number {
    if (data.length < 2) return 0;
    
    const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstValue = sortedData[0].oneRM;
    const lastValue = sortedData[sortedData.length - 1].oneRM;
    const daysDiff = (new Date(sortedData[sortedData.length - 1].date).getTime() - 
                     new Date(sortedData[0].date).getTime()) / (1000 * 60 * 60 * 24);
    
    return daysDiff > 0 ? (lastValue - firstValue) / daysDiff : 0;
  }

  private static calculateConfidenceLevel(data: PerformanceMetric[], progressRate: number): number {
    // Base confidence on data consistency and sample size
    const dataQuality = Math.min(1, data.length / 10); // More data = higher confidence
    const progressConsistency = this.calculateProgressConsistency(data);
    
    return (dataQuality + progressConsistency) / 2;
  }

  private static calculateProgressConsistency(data: PerformanceMetric[]): number {
    if (data.length < 3) return 0;
    
    const values = data.map(d => d.oneRM);
    const diffs = [];
    
    for (let i = 1; i < values.length; i++) {
      diffs.push(values[i] - values[i-1]);
    }
    
    const stdDev = this.calculateStandardDeviation(diffs);
    const meanDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    
    // Lower coefficient of variation = more consistent progress
    return meanDiff !== 0 ? Math.max(0, 1 - (stdDev / Math.abs(meanDiff))) : 0;
  }

  private static calculateTrendStrength(metrics: PerformanceMetric[]): number {
    if (metrics.length < 3) return 0.5;
    
    const values = metrics.map(m => m.oneRM);
    const x = Array.from({length: values.length}, (_, i) => i);
    
    // Calculate linear regression slope
    const n = values.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * values[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const predictions = x.map(xi => slope * xi + (sumY - slope * sumX) / n);
    const rSquared = this.calculateRSquared(values, predictions);
    
    // Strong positive trend = high value, strong negative trend = low value
    return Math.max(0, Math.min(1, (slope > 0 ? rSquared : 1 - rSquared)));
  }

  private static calculatePlateauProbability(metrics: PerformanceMetric[], trendStrength: number): number {
    // Look at recent stagnation
    const recentMetrics = metrics.slice(-5);
    const recentValues = recentMetrics.map(m => m.oneRM);
    
    const recentStdDev = this.calculateStandardDeviation(recentValues);
    const recentMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    
    const coefficientOfVariation = recentMean > 0 ? recentStdDev / recentMean : 0;
    
    // Low trend strength + low variation = plateau likely
    const plateauProbability = (1 - trendStrength) * 0.7 + (1 - Math.min(1, coefficientOfVariation * 10)) * 0.3;
    
    return Math.max(0, Math.min(1, plateauProbability));
  }

  private static generateVariationRecommendations(exercise: string, plateauProbability: number): string[] {
    const baseRecommendations = [
      'Try different rep ranges (3-5, 6-8, 12-15)',
      'Incorporate pause reps or tempo variations',
      'Add unilateral variations of the movement',
      'Focus on weak point training'
    ];
    
    const exerciseSpecific: Record<string, string[]> = {
      'Bench Press': ['Close-grip bench press', 'Incline bench press', 'Dumbbell bench press'],
      'Squat': ['Front squats', 'Pause squats', 'Box squats'],
      'Deadlift': ['Deficit deadlifts', 'Romanian deadlifts', 'Sumo deadlifts']
    };
    
    const specific = exerciseSpecific[exercise] || [];
    return [...baseRecommendations, ...specific].slice(0, plateauProbability > 0.7 ? 6 : 4);
  }

  private static generateBreakoutStrategies(exercise: string, trendStrength: number): string[] {
    const strategies = [
      'Deload for 1 week, then return with 10% volume increase',
      'Switch to higher frequency training (more sessions per week)',
      'Focus on technical improvements and form refinement',
      'Add accessory exercises targeting weak points'
    ];
    
    if (trendStrength < 0.3) {
      strategies.unshift('Complete program change recommended');
      strategies.push('Consider working with a qualified trainer');
    }
    
    return strategies;
  }

  // Default fallback methods
  private static getDefaultRiskAssessment(): InjuryRiskAssessment {
    return {
      riskLevel: 'low',
      riskScore: 15,
      factors: {
        trainingLoad: 10,
        volumeIncrease: 5,
        intensitySpike: 0,
        recoveryTime: 0,
        consistencyPattern: 0
      },
      recommendations: ['Continue current training program', 'Monitor for any unusual fatigue'],
      timeToRecommendedDeload: 21
    };
  }

  private static getDefaultGoalPrediction(
    goalType: string, 
    targetValue: number, 
    currentValue: number
  ): GoalAchievementPrediction {
    return {
      goalType: goalType as any,
      targetValue,
      currentValue,
      achievementProbability: 0.5,
      estimatedTimeframe: {
        optimistic: 60,
        realistic: 90,
        pessimistic: 120
      },
      requiredProgressRate: (targetValue - currentValue) / 90,
      currentProgressRate: 0,
      confidenceLevel: 0.1
    };
  }

  private static getDefaultPlateauPrediction(exercise: string): PlateauPrediction {
    return {
      exercise,
      plateauProbability: 0.3,
      estimatedPlateauDate: null,
      currentTrendStrength: 0.5,
      variationRecommendations: ['Vary rep ranges', 'Include pause reps'],
      breakoutStrategies: ['Increase training frequency', 'Add accessory work']
    };
  }
}