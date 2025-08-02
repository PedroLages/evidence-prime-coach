import { PerformanceMetric, ProgressAnalysis } from '@/types/analytics';
import { PredictiveModelingEngine, PredictionModel, InjuryRiskAssessment, GoalAchievementPrediction } from '@/lib/analytics/predictiveModeling';
import { ComparativeAnalyticsEngine, CompetitiveAnalysis, PopulationStatistics } from '@/lib/analytics/comparativeAnalytics';
import { DynamicAnalyticsService, DynamicAnalyticsData } from './dynamicAnalytics';
import { ProgressAnalyzer } from '@/lib/analytics/progressAnalyzer';

export interface AdvancedReportConfig {
  userId: string;
  reportType: 'comprehensive' | 'performance' | 'comparative' | 'predictive' | 'injury_risk';
  timeframe: {
    start: string;
    end: string;
  };
  includeCharts: boolean;
  includePredictions: boolean;
  includeComparisons: boolean;
  exercises?: string[];
  customMetrics?: string[];
}

export interface ChartData {
  type: 'line' | 'bar' | 'scatter' | 'radar' | 'heatmap';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
      tension?: number;
    }[];
  };
  options?: any;
}

export interface AdvancedReport {
  id: string;
  userId: string;
  type: string;
  generatedAt: string;
  config: AdvancedReportConfig;
  summary: {
    overallScore: number;
    keyInsights: string[];
    recommendations: string[];
    riskFactors: string[];
  };
  sections: {
    performance: {
      dynamicAnalytics: DynamicAnalyticsData;
      progressAnalysis: ProgressAnalysis;
      keyMetrics: {
        metric: string;
        value: number;
        change: number;
        trend: 'up' | 'down' | 'stable';
        rank: number;
      }[];
    };
    predictions: {
      models: PredictionModel[];
      injuryRisk: InjuryRiskAssessment;
      goalPredictions: GoalAchievementPrediction[];
      plateauWarnings: {
        exercise: string;
        probability: number;
        estimatedDate: string | null;
      }[];
    };
    comparisons: {
      competitiveAnalysis: CompetitiveAnalysis;
      populationStats: PopulationStatistics;
      personalBenchmarks: {
        exercise: string;
        currentRank: number;
        potentialRank: number;
        improvementPlan: string[];
      }[];
    };
    visualizations: ChartData[];
  };
  metadata: {
    dataPoints: number;
    confidenceLevel: number;
    lastUpdated: string;
    version: string;
  };
}

export class AdvancedReportingService {
  
  // Generate comprehensive advanced analytics report
  static async generateAdvancedReport(config: AdvancedReportConfig): Promise<AdvancedReport> {
    const reportId = `report_${config.userId}_${Date.now()}`;
    
    try {
      // Gather all necessary data
      const [
        dynamicAnalytics,
        performanceMetrics
      ] = await Promise.all([
        DynamicAnalyticsService.getDynamicAnalytics(config.userId),
        this.getPerformanceMetrics(config.userId, config.timeframe)
      ]);

      // Generate progress analysis
      const progressAnalysis = ProgressAnalyzer.analyzeProgress(performanceMetrics);

      // Generate predictions
      const predictions = this.generatePredictions(performanceMetrics, config);

      // Generate comparisons
      const comparisons = this.generateComparisons(performanceMetrics, config);

      // Generate visualizations
      const visualizations = this.generateVisualizations(
        dynamicAnalytics, 
        performanceMetrics, 
        progressAnalysis,
        config
      );

      // Generate summary insights
      const summary = this.generateReportSummary(
        dynamicAnalytics,
        progressAnalysis,
        predictions,
        comparisons
      );

      // Build performance section
      const performance = {
        dynamicAnalytics,
        progressAnalysis,
        keyMetrics: this.extractKeyMetrics(dynamicAnalytics, progressAnalysis)
      };

      const report: AdvancedReport = {
        id: reportId,
        userId: config.userId,
        type: config.reportType,
        generatedAt: new Date().toISOString(),
        config,
        summary,
        sections: {
          performance,
          predictions,
          comparisons,
          visualizations
        },
        metadata: {
          dataPoints: performanceMetrics.length,
          confidenceLevel: this.calculateOverallConfidence(predictions, comparisons),
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      return report;

    } catch (error) {
      console.error('Error generating advanced report:', error);
      throw new Error(`Failed to generate report: ${error}`);
    }
  }

  // Generate specific report types
  static async generatePerformanceReport(userId: string, timeframe: any): Promise<Partial<AdvancedReport>> {
    const config: AdvancedReportConfig = {
      userId,
      reportType: 'performance',
      timeframe,
      includeCharts: true,
      includePredictions: false,
      includeComparisons: false
    };

    const fullReport = await this.generateAdvancedReport(config);
    
    return {
      id: fullReport.id,
      type: 'performance',
      generatedAt: fullReport.generatedAt,
      summary: fullReport.summary,
      sections: {
        performance: fullReport.sections.performance,
        visualizations: fullReport.sections.visualizations.filter(chart => 
          chart.type === 'line' || chart.type === 'bar'
        )
      }
    };
  }

  static async generatePredictiveReport(userId: string, exercises: string[]): Promise<Partial<AdvancedReport>> {
    const config: AdvancedReportConfig = {
      userId,
      reportType: 'predictive',
      timeframe: {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      includeCharts: true,
      includePredictions: true,
      includeComparisons: false,
      exercises
    };

    const fullReport = await this.generateAdvancedReport(config);
    
    return {
      id: fullReport.id,
      type: 'predictive',
      generatedAt: fullReport.generatedAt,
      summary: {
        ...fullReport.summary,
        keyInsights: fullReport.summary.keyInsights.filter(insight => 
          insight.includes('predict') || insight.includes('forecast') || insight.includes('expect')
        )
      },
      sections: {
        predictions: fullReport.sections.predictions,
        visualizations: fullReport.sections.visualizations.filter(chart => 
          chart.title.includes('Prediction') || chart.title.includes('Forecast')
        )
      }
    };
  }

  static async generateComparativeReport(userId: string): Promise<Partial<AdvancedReport>> {
    const config: AdvancedReportConfig = {
      userId,
      reportType: 'comparative',
      timeframe: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      includeCharts: true,
      includePredictions: false,
      includeComparisons: true
    };

    const fullReport = await this.generateAdvancedReport(config);
    
    return {
      id: fullReport.id,
      type: 'comparative',
      generatedAt: fullReport.generatedAt,
      summary: {
        ...fullReport.summary,
        keyInsights: fullReport.summary.keyInsights.filter(insight => 
          insight.includes('rank') || insight.includes('compare') || insight.includes('percentile')
        )
      },
      sections: {
        comparisons: fullReport.sections.comparisons,
        visualizations: fullReport.sections.visualizations.filter(chart => 
          chart.type === 'radar' || chart.title.includes('Ranking') || chart.title.includes('Comparison')
        )
      }
    };
  }

  // Export report to different formats
  static async exportReport(report: AdvancedReport, format: 'json' | 'csv' | 'pdf'): Promise<Blob> {
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      
      case 'csv':
        const csvData = this.convertReportToCSV(report);
        return new Blob([csvData], { type: 'text/csv' });
      
      case 'pdf':
        // In a real implementation, you would use a PDF library like jsPDF
        const pdfContent = this.generatePDFContent(report);
        return new Blob([pdfContent], { type: 'application/pdf' });
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // Private helper methods
  private static async getPerformanceMetrics(
    userId: string, 
    timeframe: { start: string; end: string }
  ): Promise<PerformanceMetric[]> {
    // In a real implementation, this would fetch from the database
    // For now, return mock data
    const mockMetrics: PerformanceMetric[] = [
      {
        date: '2024-01-01',
        exercise: 'Bench Press',
        weight: 185,
        reps: 5,
        sets: 3,
        rpe: 8,
        volume: 2775,
        oneRM: 208,
        intensity: 89
      },
      {
        date: '2024-01-15',
        exercise: 'Bench Press',
        weight: 190,
        reps: 5,
        sets: 3,
        rpe: 8,
        volume: 2850,
        oneRM: 214,
        intensity: 89
      },
      // Add more mock data as needed
    ];

    return mockMetrics.filter(metric => {
      const metricDate = new Date(metric.date);
      return metricDate >= new Date(timeframe.start) && metricDate <= new Date(timeframe.end);
    });
  }

  private static generatePredictions(
    performanceMetrics: PerformanceMetric[],
    config: AdvancedReportConfig
  ): AdvancedReport['sections']['predictions'] {
    const exerciseGroups = this.groupMetricsByExercise(performanceMetrics);
    const models: PredictionModel[] = [];
    const goalPredictions: GoalAchievementPrediction[] = [];
    const plateauWarnings: any[] = [];

    // Generate predictions for each exercise
    Object.entries(exerciseGroups).forEach(([exercise, metrics]) => {
      if (config.exercises && !config.exercises.includes(exercise)) return;

      // Generate predictive models
      const exerciseModels = PredictiveModelingEngine.predictPerformance(metrics);
      models.push(...exerciseModels);

      // Generate goal predictions
      const currentValue = metrics[metrics.length - 1]?.oneRM || 0;
      const targetValue = currentValue * 1.15; // 15% improvement goal
      const goalPrediction = PredictiveModelingEngine.predictGoalAchievement(
        currentValue,
        targetValue,
        metrics,
        'strength'
      );
      goalPredictions.push(goalPrediction);

      // Generate plateau warnings
      const plateauPrediction = PredictiveModelingEngine.predictPlateau(metrics);
      plateauWarnings.push({
        exercise,
        probability: plateauPrediction.plateauProbability,
        estimatedDate: plateauPrediction.estimatedPlateauDate
      });
    });

    // Generate injury risk assessment
    const injuryRisk = PredictiveModelingEngine.assessInjuryRisk(performanceMetrics);

    return {
      models,
      injuryRisk,
      goalPredictions,
      plateauWarnings
    };
  }

  private static generateComparisons(
    performanceMetrics: PerformanceMetric[],
    config: AdvancedReportConfig
  ): AdvancedReport['sections']['comparisons'] {
    // Generate competitive analysis
    const competitiveAnalysis = ComparativeAnalyticsEngine.generateCompetitiveAnalysis(
      performanceMetrics,
      {} // Mock user profile
    );

    // Get population statistics
    const populationStats = ComparativeAnalyticsEngine.getPopulationStatistics();

    // Generate personal benchmarks with improvement plans
    const personalBenchmarks = competitiveAnalysis.exerciseRankings.map(ranking => {
      const improvement = ComparativeAnalyticsEngine.calculateRankingImprovementPotential(
        ranking.percentileRank,
        ranking.progressVelocity.currentRate,
        ranking.exercise
      );

      return {
        exercise: ranking.exercise,
        currentRank: ranking.percentileRank,
        potentialRank: improvement.targetPercentile,
        improvementPlan: improvement.strategies
      };
    });

    return {
      competitiveAnalysis,
      populationStats,
      personalBenchmarks
    };
  }

  private static generateVisualizations(
    dynamicAnalytics: DynamicAnalyticsData,
    performanceMetrics: PerformanceMetric[],
    progressAnalysis: ProgressAnalysis,
    config: AdvancedReportConfig
  ): ChartData[] {
    const charts: ChartData[] = [];

    // Performance trend chart
    charts.push(this.createPerformanceTrendChart(performanceMetrics));

    // Volume progression chart
    charts.push(this.createVolumeProgressionChart(performanceMetrics));

    // Strength comparison radar chart
    charts.push(this.createStrengthRadarChart(dynamicAnalytics.exercisePerformance));

    // RPE heatmap
    charts.push(this.createRPEHeatmap(performanceMetrics));

    // Prediction confidence chart
    if (config.includePredictions) {
      charts.push(this.createPredictionChart(performanceMetrics));
    }

    // Ranking comparison chart
    if (config.includeComparisons) {
      charts.push(this.createRankingChart(dynamicAnalytics.exercisePerformance));
    }

    return charts;
  }

  private static createPerformanceTrendChart(metrics: PerformanceMetric[]): ChartData {
    const exerciseGroups = this.groupMetricsByExercise(metrics);
    const datasets = Object.entries(exerciseGroups).map(([exercise, exerciseMetrics], index) => {
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
      const sortedMetrics = exerciseMetrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      return {
        label: exercise,
        data: sortedMetrics.map(m => m.oneRM),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.4
      };
    });

    const allDates = [...new Set(metrics.map(m => m.date))].sort();

    return {
      type: 'line',
      title: 'Performance Trends - Estimated 1RM',
      data: {
        labels: allDates.map(date => new Date(date).toLocaleDateString()),
        datasets
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Weight (lbs)'
            }
          }
        }
      }
    };
  }

  private static createVolumeProgressionChart(metrics: PerformanceMetric[]): ChartData {
    const exerciseGroups = this.groupMetricsByExercise(metrics);
    const datasets = Object.entries(exerciseGroups).map(([exercise, exerciseMetrics], index) => {
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
      const sortedMetrics = exerciseMetrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      return {
        label: exercise,
        data: sortedMetrics.map(m => m.volume),
        backgroundColor: colors[index % colors.length]
      };
    });

    const allDates = [...new Set(metrics.map(m => m.date))].sort();

    return {
      type: 'bar',
      title: 'Volume Progression by Exercise',
      data: {
        labels: allDates.map(date => new Date(date).toLocaleDateString()),
        datasets
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Volume (lbs)'
            }
          }
        }
      }
    };
  }

  private static createStrengthRadarChart(exercisePerformance: any[]): ChartData {
    const exercises = exercisePerformance.slice(0, 6).map(e => e.exerciseName);
    const percentiles = exercisePerformance.slice(0, 6).map(e => {
      // Mock percentile calculation
      return Math.min(100, (e.maxWeight / 300) * 100);
    });

    return {
      type: 'radar',
      title: 'Strength Profile Radar',
      data: {
        labels: exercises,
        datasets: [{
          label: 'Your Strength Profile',
          data: percentiles,
          backgroundColor: '#3b82f620',
          borderColor: '#3b82f6',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    };
  }

  private static createRPEHeatmap(metrics: PerformanceMetric[]): ChartData {
    // Create a simplified heatmap representation
    const exerciseGroups = this.groupMetricsByExercise(metrics);
    const heatmapData: number[][] = [];
    const exercises = Object.keys(exerciseGroups);
    
    exercises.forEach((exercise, exerciseIndex) => {
      const exerciseMetrics = exerciseGroups[exercise];
      const weeklyRPE: number[] = [];
      
      // Group by weeks (simplified)
      for (let week = 0; week < 12; week++) {
        const weekMetrics = exerciseMetrics.filter((m, index) => Math.floor(index / 2) === week);
        const avgRPE = weekMetrics.length > 0 
          ? weekMetrics.reduce((sum, m) => sum + m.rpe, 0) / weekMetrics.length 
          : 0;
        weeklyRPE.push(avgRPE);
      }
      
      heatmapData.push(weeklyRPE);
    });

    return {
      type: 'heatmap',
      title: 'RPE Intensity Heatmap (Weekly)',
      data: {
        labels: Array.from({length: 12}, (_, i) => `Week ${i + 1}`),
        datasets: exercises.map((exercise, index) => ({
          label: exercise,
          data: heatmapData[index] || [],
          backgroundColor: '#3b82f6'
        }))
      }
    };
  }

  private static createPredictionChart(metrics: PerformanceMetric[]): ChartData {
    const exerciseGroups = this.groupMetricsByExercise(metrics);
    const exercise = Object.keys(exerciseGroups)[0]; // Use first exercise
    
    if (!exercise) {
      return {
        type: 'line',
        title: 'Performance Predictions',
        data: { labels: [], datasets: [] }
      };
    }

    const exerciseMetrics = exerciseGroups[exercise];
    const predictions = PredictiveModelingEngine.predictPerformance(exerciseMetrics);
    const bestModel = predictions[0];

    if (!bestModel) {
      return {
        type: 'line',
        title: 'Performance Predictions',
        data: { labels: [], datasets: [] }
      };
    }

    const labels = ['Current', '1 Week', '1 Month', '3 Months', '6 Months'];
    const currentValue = exerciseMetrics[exerciseMetrics.length - 1]?.oneRM || 0;
    const predictedValues = [
      currentValue,
      bestModel.predictions.oneWeek.value,
      bestModel.predictions.oneMonth.value,
      bestModel.predictions.threeMonths.value,
      bestModel.predictions.sixMonths.value
    ];

    return {
      type: 'line',
      title: `${exercise} Performance Predictions`,
      data: {
        labels,
        datasets: [{
          label: 'Predicted 1RM',
          data: predictedValues,
          borderColor: '#10b981',
          backgroundColor: '#10b98120',
          tension: 0.4
        }]
      }
    };
  }

  private static createRankingChart(exercisePerformance: any[]): ChartData {
    const exercises = exercisePerformance.slice(0, 6).map(e => e.exerciseName);
    const rankings = exercisePerformance.slice(0, 6).map(e => {
      // Mock ranking calculation
      return Math.min(100, (e.maxWeight / 250) * 100);
    });

    return {
      type: 'bar',
      title: 'Exercise Rankings (Percentile)',
      data: {
        labels: exercises,
        datasets: [{
          label: 'Percentile Rank',
          data: rankings,
          backgroundColor: '#f59e0b'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Percentile'
            }
          }
        }
      }
    };
  }

  private static extractKeyMetrics(
    dynamicAnalytics: DynamicAnalyticsData,
    progressAnalysis: ProgressAnalysis
  ): AdvancedReport['sections']['performance']['keyMetrics'] {
    const keyMetrics: any[] = [
      {
        metric: 'Total Volume',
        value: dynamicAnalytics.workoutStatistics.totalVolume,
        change: 15.2,
        trend: 'up' as const,
        rank: 72
      },
      {
        metric: 'Workout Frequency',
        value: dynamicAnalytics.workoutStatistics.recentWorkouts,
        change: -5.1,
        trend: 'down' as const,
        rank: 58
      },
      {
        metric: 'Training Intensity',
        value: dynamicAnalytics.workoutStatistics.trainingIntensity,
        change: 2.3,
        trend: 'up' as const,
        rank: 81
      },
      {
        metric: 'Progress Score',
        value: progressAnalysis.overallScore,
        change: 8.7,
        trend: 'up' as const,
        rank: 69
      }
    ];

    return keyMetrics;
  }

  private static generateReportSummary(
    dynamicAnalytics: DynamicAnalyticsData,
    progressAnalysis: ProgressAnalysis,
    predictions: any,
    comparisons: any
  ): AdvancedReport['summary'] {
    const keyInsights: string[] = [
      `Your overall progress score is ${Math.round(progressAnalysis.overallScore)}%, indicating ${progressAnalysis.overallScore > 75 ? 'excellent' : progressAnalysis.overallScore > 50 ? 'good' : 'moderate'} progress`,
      `You have ${progressAnalysis.trends.filter(t => t.direction === 'improving').length} exercises showing improvement trends`,
      `Training consistency is at ${Math.round(dynamicAnalytics.workoutStatistics.workoutConsistency)}%`,
      `Your strength profile shows ${comparisons.competitiveAnalysis.overallRank.description.toLowerCase()} level performance`
    ];

    const recommendations: string[] = [
      ...progressAnalysis.recommendations.slice(0, 3).map(r => r.action),
      'Consider incorporating periodization to break through plateaus',
      'Focus on consistency to maximize long-term progress'
    ];

    const riskFactors: string[] = [];
    if (predictions.injuryRisk.riskLevel === 'high' || predictions.injuryRisk.riskLevel === 'critical') {
      riskFactors.push(`Injury risk is ${predictions.injuryRisk.riskLevel} - consider deload`);
    }
    if (dynamicAnalytics.workoutStatistics.workoutConsistency < 70) {
      riskFactors.push('Low workout consistency may impact progress');
    }

    return {
      overallScore: progressAnalysis.overallScore,
      keyInsights,
      recommendations,
      riskFactors
    };
  }

  private static calculateOverallConfidence(predictions: any, comparisons: any): number {
    // Calculate confidence based on data quality and model performance
    const modelConfidences = predictions.models.map((m: PredictionModel) => m.rSquared);
    const avgModelConfidence = modelConfidences.length > 0 
      ? modelConfidences.reduce((a: number, b: number) => a + b, 0) / modelConfidences.length 
      : 0.5;
    
    return Math.round(avgModelConfidence * 100);
  }

  private static groupMetricsByExercise(metrics: PerformanceMetric[]): Record<string, PerformanceMetric[]> {
    return metrics.reduce((groups, metric) => {
      if (!groups[metric.exercise]) {
        groups[metric.exercise] = [];
      }
      groups[metric.exercise].push(metric);
      return groups;
    }, {} as Record<string, PerformanceMetric[]>);
  }

  private static convertReportToCSV(report: AdvancedReport): string {
    const headers = ['Metric', 'Value', 'Change', 'Trend', 'Rank'];
    const rows = report.sections.performance.keyMetrics.map(metric => [
      metric.metric,
      metric.value.toString(),
      metric.change.toString(),
      metric.trend,
      metric.rank.toString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private static generatePDFContent(report: AdvancedReport): string {
    // Simplified PDF content - in production, use a proper PDF library
    return `
ADVANCED FITNESS ANALYTICS REPORT
Generated: ${new Date(report.generatedAt).toLocaleDateString()}
User ID: ${report.userId}

SUMMARY
Overall Score: ${report.summary.overallScore}%

KEY INSIGHTS:
${report.summary.keyInsights.map(insight => `• ${insight}`).join('\n')}

RECOMMENDATIONS:
${report.summary.recommendations.map(rec => `• ${rec}`).join('\n')}

PERFORMANCE METRICS:
${report.sections.performance.keyMetrics.map(metric => 
  `${metric.metric}: ${metric.value} (${metric.change > 0 ? '+' : ''}${metric.change}%)`
).join('\n')}

Report generated by Evidence Prime Coach Analytics Engine v${report.metadata.version}
    `.trim();
  }
}