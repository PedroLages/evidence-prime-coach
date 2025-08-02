import { PerformanceMetric } from '@/types/analytics';

export interface UserCohort {
  ageRange: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  bodyWeightRange: string;
  trainingStyle: string;
  sampleSize: number;
}

export interface BenchmarkData {
  exercise: string;
  metric: 'oneRM' | 'volume' | 'frequency';
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  cohortInfo: UserCohort;
  lastUpdated: string;
}

export interface PersonalBenchmark {
  exercise: string;
  currentValue: number;
  personalBest: number;
  percentileRank: number;
  cohortComparison: {
    aboveAverage: boolean;
    percentileRank: number;
    cohort: UserCohort;
  };
  historicalRanking: {
    sixMonthsAgo: number;
    oneYearAgo: number;
    rankingTrend: 'improving' | 'stable' | 'declining';
  };
  progressVelocity: {
    currentRate: number; // lbs/month
    cohortAverageRate: number;
    relativePace: 'faster' | 'average' | 'slower';
  };
}

export interface CompetitiveAnalysis {
  overallRank: {
    percentile: number;
    description: string;
    strongestLifts: string[];
    weakestLifts: string[];
  };
  exerciseRankings: PersonalBenchmark[];
  improvementOpportunities: {
    exercise: string;
    currentPercentile: number;
    potentialGain: number;
    timeToAchieve: number;
    difficulty: 'easy' | 'moderate' | 'hard';
  }[];
  strengthProfile: {
    category: 'powerlifter' | 'bodybuilder' | 'athlete' | 'generalist';
    confidence: number;
    characteristics: string[];
  };
}

export interface PopulationStatistics {
  totalUsers: number;
  activeUsers: number;
  exercisePopularity: {
    exercise: string;
    userCount: number;
    averageFrequency: number;
  }[];
  strengthStandards: {
    exercise: string;
    standards: {
      beginner: number;
      intermediate: number;
      advanced: number;
      elite: number;
    };
  }[];
}

export class ComparativeAnalyticsEngine {
  
  // Mock population data - In production, this would come from anonymized database
  private static readonly MOCK_POPULATION_DATA: Record<string, BenchmarkData> = {
    'Bench Press': {
      exercise: 'Bench Press',
      metric: 'oneRM',
      percentiles: {
        p10: 95,
        p25: 135,
        p50: 185,
        p75: 225,
        p90: 275,
        p95: 315,
        p99: 405
      },
      cohortInfo: {
        ageRange: '25-35',
        experienceLevel: 'intermediate',
        bodyWeightRange: '170-190',
        trainingStyle: 'strength',
        sampleSize: 1247
      },
      lastUpdated: new Date().toISOString()
    },
    'Squat': {
      exercise: 'Squat',
      metric: 'oneRM',
      percentiles: {
        p10: 135,
        p25: 185,
        p50: 245,
        p75: 315,
        p90: 385,
        p95: 435,
        p99: 550
      },
      cohortInfo: {
        ageRange: '25-35',
        experienceLevel: 'intermediate',
        bodyWeightRange: '170-190',
        trainingStyle: 'strength',
        sampleSize: 1180
      },
      lastUpdated: new Date().toISOString()
    },
    'Deadlift': {
      exercise: 'Deadlift',
      metric: 'oneRM',
      percentiles: {
        p10: 185,
        p25: 245,
        p50: 315,
        p75: 405,
        p90: 485,
        p95: 545,
        p99: 650
      },
      cohortInfo: {
        ageRange: '25-35',
        experienceLevel: 'intermediate',
        bodyWeightRange: '170-190',
        trainingStyle: 'strength',
        sampleSize: 1156
      },
      lastUpdated: new Date().toISOString()
    },
    'Overhead Press': {
      exercise: 'Overhead Press',
      metric: 'oneRM',
      percentiles: {
        p10: 65,
        p25: 95,
        p50: 125,
        p75: 155,
        p90: 185,
        p95: 205,
        p99: 245
      },
      cohortInfo: {
        ageRange: '25-35',
        experienceLevel: 'intermediate',
        bodyWeightRange: '170-190',
        trainingStyle: 'strength',
        sampleSize: 892
      },
      lastUpdated: new Date().toISOString()
    }
  };

  // Generate comprehensive competitive analysis
  static generateCompetitiveAnalysis(
    userMetrics: PerformanceMetric[],
    userProfile: {
      age?: number;
      bodyWeight?: number;
      experienceLevel?: string;
      trainingYears?: number;
    }
  ): CompetitiveAnalysis {
    const exerciseGroups = this.groupMetricsByExercise(userMetrics);
    const exerciseRankings: PersonalBenchmark[] = [];
    
    // Calculate rankings for each exercise
    Object.entries(exerciseGroups).forEach(([exercise, metrics]) => {
      const benchmark = this.calculatePersonalBenchmark(exercise, metrics, userProfile);
      if (benchmark) {
        exerciseRankings.push(benchmark);
      }
    });

    // Calculate overall ranking
    const overallRank = this.calculateOverallRank(exerciseRankings);
    
    // Identify improvement opportunities
    const improvementOpportunities = this.identifyImprovementOpportunities(exerciseRankings);
    
    // Determine strength profile
    const strengthProfile = this.determineStrengthProfile(exerciseRankings);

    return {
      overallRank,
      exerciseRankings,
      improvementOpportunities,
      strengthProfile
    };
  }

  // Get benchmark data for specific exercise
  static getBenchmarkData(exercise: string, userProfile?: any): BenchmarkData | null {
    return this.MOCK_POPULATION_DATA[exercise] || null;
  }

  // Calculate percentile ranking for a specific value
  static calculatePercentileRank(value: number, benchmarkData: BenchmarkData): number {
    const { percentiles } = benchmarkData;
    
    if (value <= percentiles.p10) return 10;
    if (value <= percentiles.p25) return 10 + ((value - percentiles.p10) / (percentiles.p25 - percentiles.p10)) * 15;
    if (value <= percentiles.p50) return 25 + ((value - percentiles.p25) / (percentiles.p50 - percentiles.p25)) * 25;
    if (value <= percentiles.p75) return 50 + ((value - percentiles.p50) / (percentiles.p75 - percentiles.p50)) * 25;
    if (value <= percentiles.p90) return 75 + ((value - percentiles.p75) / (percentiles.p90 - percentiles.p75)) * 15;
    if (value <= percentiles.p95) return 90 + ((value - percentiles.p90) / (percentiles.p95 - percentiles.p90)) * 5;
    if (value <= percentiles.p99) return 95 + ((value - percentiles.p95) / (percentiles.p99 - percentiles.p95)) * 4;
    
    return 99 + Math.min(1, (value - percentiles.p99) / percentiles.p99);
  }

  // Generate population statistics
  static getPopulationStatistics(): PopulationStatistics {
    const exercisePopularity = Object.keys(this.MOCK_POPULATION_DATA).map(exercise => ({
      exercise,
      userCount: this.MOCK_POPULATION_DATA[exercise].cohortInfo.sampleSize,
      averageFrequency: 2.3 // Mock frequency per week
    })).sort((a, b) => b.userCount - a.userCount);

    const strengthStandards = Object.keys(this.MOCK_POPULATION_DATA).map(exercise => {
      const data = this.MOCK_POPULATION_DATA[exercise];
      return {
        exercise,
        standards: {
          beginner: data.percentiles.p25,
          intermediate: data.percentiles.p50,
          advanced: data.percentiles.p75,
          elite: data.percentiles.p95
        }
      };
    });

    return {
      totalUsers: 5420,
      activeUsers: 3280,
      exercisePopularity,
      strengthStandards
    };
  }

  // Compare user against their historical performance
  static compareAgainstPersonalHistory(
    currentMetrics: PerformanceMetric[],
    historicalMetrics: PerformanceMetric[]
  ): {
    exercise: string;
    currentVsBest: {
      current: number;
      personalBest: number;
      percentageOfBest: number;
      daysSinceBest: number;
    };
    progressTrend: {
      sixMonthChange: number;
      oneYearChange: number;
      overallTrend: 'improving' | 'stable' | 'declining';
    };
  }[] {
    const results: any[] = [];
    const exerciseGroups = this.groupMetricsByExercise([...currentMetrics, ...historicalMetrics]);

    Object.entries(exerciseGroups).forEach(([exercise, allMetrics]) => {
      const sortedMetrics = allMetrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const current = sortedMetrics[0];
      const personalBest = Math.max(...allMetrics.map(m => m.oneRM));
      const bestDate = allMetrics.find(m => m.oneRM === personalBest)?.date;
      
      const daysSinceBest = bestDate ? 
        Math.floor((Date.now() - new Date(bestDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

      // Calculate historical changes
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const sixMonthMetric = allMetrics.find(m => 
        Math.abs(new Date(m.date).getTime() - sixMonthsAgo.getTime()) < 30 * 24 * 60 * 60 * 1000
      );
      const oneYearMetric = allMetrics.find(m => 
        Math.abs(new Date(m.date).getTime() - oneYearAgo.getTime()) < 60 * 24 * 60 * 60 * 1000
      );

      const sixMonthChange = sixMonthMetric ? 
        ((current.oneRM - sixMonthMetric.oneRM) / sixMonthMetric.oneRM) * 100 : 0;
      const oneYearChange = oneYearMetric ? 
        ((current.oneRM - oneYearMetric.oneRM) / oneYearMetric.oneRM) * 100 : 0;

      let overallTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (sixMonthChange > 2) overallTrend = 'improving';
      else if (sixMonthChange < -2) overallTrend = 'declining';

      results.push({
        exercise,
        currentVsBest: {
          current: current.oneRM,
          personalBest,
          percentageOfBest: (current.oneRM / personalBest) * 100,
          daysSinceBest
        },
        progressTrend: {
          sixMonthChange,
          oneYearChange,
          overallTrend
        }
      });
    });

    return results;
  }

  // Predict ranking improvement potential
  static calculateRankingImprovementPotential(
    currentPercentile: number,
    progressRate: number,
    exercise: string
  ): {
    targetPercentile: number;
    requiredImprovement: number;
    estimatedTimeframe: number;
    difficulty: 'easy' | 'moderate' | 'hard';
    strategies: string[];
  } {
    const benchmarkData = this.getBenchmarkData(exercise);
    if (!benchmarkData) {
      return {
        targetPercentile: currentPercentile,
        requiredImprovement: 0,
        estimatedTimeframe: 0,
        difficulty: 'moderate',
        strategies: []
      };
    }

    // Determine realistic target based on current level
    let targetPercentile: number;
    if (currentPercentile < 25) targetPercentile = 50;
    else if (currentPercentile < 50) targetPercentile = 75;
    else if (currentPercentile < 75) targetPercentile = 90;
    else targetPercentile = 95;

    // Calculate required improvement
    const currentValue = this.getValueAtPercentile(currentPercentile, benchmarkData);
    const targetValue = this.getValueAtPercentile(targetPercentile, benchmarkData);
    const requiredImprovement = targetValue - currentValue;

    // Estimate timeframe based on progress rate
    const estimatedTimeframe = progressRate > 0 ? requiredImprovement / progressRate : 999;

    // Determine difficulty
    let difficulty: 'easy' | 'moderate' | 'hard';
    if (targetPercentile - currentPercentile <= 25) difficulty = 'easy';
    else if (targetPercentile - currentPercentile <= 40) difficulty = 'moderate';
    else difficulty = 'hard';

    // Generate strategies
    const strategies = this.generateImprovementStrategies(exercise, currentPercentile, targetPercentile);

    return {
      targetPercentile,
      requiredImprovement,
      estimatedTimeframe,
      difficulty,
      strategies
    };
  }

  // Private helper methods
  private static groupMetricsByExercise(metrics: PerformanceMetric[]): Record<string, PerformanceMetric[]> {
    return metrics.reduce((groups, metric) => {
      if (!groups[metric.exercise]) {
        groups[metric.exercise] = [];
      }
      groups[metric.exercise].push(metric);
      return groups;
    }, {} as Record<string, PerformanceMetric[]>);
  }

  private static calculatePersonalBenchmark(
    exercise: string,
    metrics: PerformanceMetric[],
    userProfile: any
  ): PersonalBenchmark | null {
    const benchmarkData = this.getBenchmarkData(exercise);
    if (!benchmarkData || metrics.length === 0) return null;

    const sortedMetrics = metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const currentValue = sortedMetrics[0].oneRM;
    const personalBest = Math.max(...metrics.map(m => m.oneRM));
    
    const percentileRank = this.calculatePercentileRank(currentValue, benchmarkData);
    
    // Calculate progress velocity
    const progressVelocity = this.calculateProgressVelocity(metrics);
    
    // Mock historical ranking data
    const historicalRanking = {
      sixMonthsAgo: Math.max(10, percentileRank - 15),
      oneYearAgo: Math.max(5, percentileRank - 25),
      rankingTrend: (percentileRank > 50 ? 'improving' : 'stable') as 'improving' | 'stable' | 'declining'
    };

    return {
      exercise,
      currentValue,
      personalBest,
      percentileRank,
      cohortComparison: {
        aboveAverage: percentileRank > 50,
        percentileRank,
        cohort: benchmarkData.cohortInfo
      },
      historicalRanking,
      progressVelocity
    };
  }

  private static calculateProgressVelocity(metrics: PerformanceMetric[]): {
    currentRate: number;
    cohortAverageRate: number;
    relativePace: 'faster' | 'average' | 'slower';
  } {
    if (metrics.length < 2) {
      return {
        currentRate: 0,
        cohortAverageRate: 2.5,
        relativePace: 'average'
      };
    }

    const sortedMetrics = metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstValue = sortedMetrics[0].oneRM;
    const lastValue = sortedMetrics[sortedMetrics.length - 1].oneRM;
    const monthsDiff = (new Date(sortedMetrics[sortedMetrics.length - 1].date).getTime() - 
                      new Date(sortedMetrics[0].date).getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    const currentRate = monthsDiff > 0 ? (lastValue - firstValue) / monthsDiff : 0;
    const cohortAverageRate = 2.5; // Mock average progress rate
    
    let relativePace: 'faster' | 'average' | 'slower';
    if (currentRate > cohortAverageRate * 1.2) relativePace = 'faster';
    else if (currentRate < cohortAverageRate * 0.8) relativePace = 'slower';
    else relativePace = 'average';

    return {
      currentRate,
      cohortAverageRate,
      relativePace
    };
  }

  private static calculateOverallRank(exerciseRankings: PersonalBenchmark[]): {
    percentile: number;
    description: string;
    strongestLifts: string[];
    weakestLifts: string[];
  } {
    if (exerciseRankings.length === 0) {
      return {
        percentile: 50,
        description: 'Average',
        strongestLifts: [],
        weakestLifts: []
      };
    }

    // Calculate weighted average (major lifts weighted more heavily)
    const majorLifts = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press'];
    let weightedSum = 0;
    let totalWeight = 0;

    exerciseRankings.forEach(ranking => {
      const weight = majorLifts.includes(ranking.exercise) ? 2 : 1;
      weightedSum += ranking.percentileRank * weight;
      totalWeight += weight;
    });

    const percentile = totalWeight > 0 ? weightedSum / totalWeight : 50;
    
    // Generate description
    let description: string;
    if (percentile >= 90) description = 'Elite';
    else if (percentile >= 75) description = 'Advanced';
    else if (percentile >= 50) description = 'Intermediate';
    else if (percentile >= 25) description = 'Novice';
    else description = 'Beginner';

    // Identify strongest and weakest lifts
    const sortedByStrength = [...exerciseRankings].sort((a, b) => b.percentileRank - a.percentileRank);
    const strongestLifts = sortedByStrength.slice(0, 3).map(r => r.exercise);
    const weakestLifts = sortedByStrength.slice(-2).map(r => r.exercise);

    return {
      percentile,
      description,
      strongestLifts,
      weakestLifts
    };
  }

  private static identifyImprovementOpportunities(exerciseRankings: PersonalBenchmark[]): {
    exercise: string;
    currentPercentile: number;
    potentialGain: number;
    timeToAchieve: number;
    difficulty: 'easy' | 'moderate' | 'hard';
  }[] {
    return exerciseRankings
      .filter(ranking => ranking.percentileRank < 85) // Focus on exercises below 85th percentile
      .sort((a, b) => a.percentileRank - b.percentileRank) // Start with weakest
      .slice(0, 3) // Top 3 opportunities
      .map(ranking => {
        const improvement = this.calculateRankingImprovementPotential(
          ranking.percentileRank,
          ranking.progressVelocity.currentRate,
          ranking.exercise
        );
        
        return {
          exercise: ranking.exercise,
          currentPercentile: ranking.percentileRank,
          potentialGain: improvement.requiredImprovement,
          timeToAchieve: improvement.estimatedTimeframe,
          difficulty: improvement.difficulty
        };
      });
  }

  private static determineStrengthProfile(exerciseRankings: PersonalBenchmark[]): {
    category: 'powerlifter' | 'bodybuilder' | 'athlete' | 'generalist';
    confidence: number;
    characteristics: string[];
  } {
    const characteristics: string[] = [];
    
    // Analyze lift ratios and patterns
    const benchRanking = exerciseRankings.find(r => r.exercise === 'Bench Press')?.percentileRank || 50;
    const squatRanking = exerciseRankings.find(r => r.exercise === 'Squat')?.percentileRank || 50;
    const deadliftRanking = exerciseRankings.find(r => r.exercise === 'Deadlift')?.percentileRank || 50;
    
    // Determine profile based on lift rankings
    let category: 'powerlifter' | 'bodybuilder' | 'athlete' | 'generalist';
    let confidence = 0.5;
    
    const avgMainLifts = (benchRanking + squatRanking + deadliftRanking) / 3;
    const variance = Math.sqrt(
      (Math.pow(benchRanking - avgMainLifts, 2) + 
       Math.pow(squatRanking - avgMainLifts, 2) + 
       Math.pow(deadliftRanking - avgMainLifts, 2)) / 3
    );
    
    if (avgMainLifts > 75 && variance < 15) {
      category = 'powerlifter';
      confidence = 0.8;
      characteristics.push('Strong in all main lifts', 'Consistent strength across movements');
    } else if (benchRanking > squatRanking + 20 && benchRanking > deadliftRanking + 15) {
      category = 'bodybuilder';
      confidence = 0.7;
      characteristics.push('Upper body dominant', 'Strong bench press focus');
    } else if (variance > 25) {
      category = 'athlete';
      confidence = 0.6;
      characteristics.push('Specialized strengths', 'Variable across movements');
    } else {
      category = 'generalist';
      confidence = 0.5;
      characteristics.push('Balanced development', 'Well-rounded strength');
    }

    return {
      category,
      confidence,
      characteristics
    };
  }

  private static getValueAtPercentile(percentile: number, benchmarkData: BenchmarkData): number {
    const { percentiles } = benchmarkData;
    
    if (percentile <= 10) return percentiles.p10;
    if (percentile <= 25) return percentiles.p10 + ((percentile - 10) / 15) * (percentiles.p25 - percentiles.p10);
    if (percentile <= 50) return percentiles.p25 + ((percentile - 25) / 25) * (percentiles.p50 - percentiles.p25);
    if (percentile <= 75) return percentiles.p50 + ((percentile - 50) / 25) * (percentiles.p75 - percentiles.p50);
    if (percentile <= 90) return percentiles.p75 + ((percentile - 75) / 15) * (percentiles.p90 - percentiles.p75);
    if (percentile <= 95) return percentiles.p90 + ((percentile - 90) / 5) * (percentiles.p95 - percentiles.p90);
    if (percentile <= 99) return percentiles.p95 + ((percentile - 95) / 4) * (percentiles.p99 - percentiles.p95);
    
    return percentiles.p99;
  }

  private static generateImprovementStrategies(
    exercise: string,
    currentPercentile: number,
    targetPercentile: number
  ): string[] {
    const baseStrategies = [
      'Increase training frequency for this exercise',
      'Focus on progressive overload with smaller increments',
      'Add accessory exercises targeting weak points',
      'Improve technique through form work and coaching'
    ];

    const exerciseSpecific: Record<string, string[]> = {
      'Bench Press': [
        'Strengthen triceps and shoulders',
        'Practice competition-style bench technique',
        'Add pause bench and close-grip variations'
      ],
      'Squat': [
        'Improve ankle and hip mobility',
        'Strengthen core and glutes',
        'Practice depth and bracing techniques'
      ],
      'Deadlift': [
        'Strengthen posterior chain',
        'Work on hip hinge pattern',
        'Add deficit and Romanian deadlift variations'
      ]
    };

    const specific = exerciseSpecific[exercise] || [];
    const allStrategies = [...baseStrategies, ...specific];
    
    // Return more strategies for bigger jumps
    const strategiesCount = targetPercentile - currentPercentile > 30 ? 6 : 4;
    return allStrategies.slice(0, strategiesCount);
  }
}