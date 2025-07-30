import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react';
import { PerformanceMetric, TrendAnalysis } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PerformanceChartProps {
  metrics: PerformanceMetric[];
  trends: TrendAnalysis[];
  className?: string;
}

export function PerformanceChart({ metrics, trends, className }: PerformanceChartProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<'oneRM' | 'volume' | 'rpe'>('oneRM');
  const [timeframe, setTimeframe] = useState<number>(90);

  // Get unique exercises
  const exercises = ['all', ...new Set(metrics.map(m => m.exercise))];

  // Filter and prepare data
  const filteredMetrics = metrics
    .filter(m => {
      const isWithinTimeframe = new Date(m.date) >= new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
      const isSelectedExercise = selectedExercise === 'all' || m.exercise === selectedExercise;
      return isWithinTimeframe && isSelectedExercise;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Aggregate data by date if showing all exercises
  const chartData = selectedExercise === 'all' 
    ? aggregateByDate(filteredMetrics, selectedMetric)
    : filteredMetrics.map(m => ({
        date: new Date(m.date).toLocaleDateString(),
        value: m[selectedMetric],
        exercise: m.exercise,
        rpe: m.rpe,
        volume: m.volume,
        oneRM: m.oneRM
      }));

  // Get trend for selected exercise
  const selectedTrend = selectedExercise !== 'all' 
    ? trends.find(t => t.exercise === selectedExercise)
    : null;

  const getTrendColor = (direction?: string) => {
    switch (direction) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getTrendIcon = (direction?: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-4 w-4" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getMetricUnit = (metric: 'oneRM' | 'volume' | 'rpe') => {
    switch (metric) {
      case 'oneRM':
        return 'lbs';
      case 'volume':
        return 'lbs';
      case 'rpe':
        return '/10';
    }
  };

  const getMetricLabel = (metric: 'oneRM' | 'volume' | 'rpe') => {
    switch (metric) {
      case 'oneRM':
        return '1RM';
      case 'volume':
        return 'Volume';
      case 'rpe':
        return 'RPE';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Performance Chart
          </CardTitle>
          
          <div className="flex flex-wrap gap-2">
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exercises.map(exercise => (
                  <SelectItem key={exercise} value={exercise}>
                    {exercise === 'all' ? 'All Exercises' : exercise}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedMetric} onValueChange={(value: 'oneRM' | 'volume' | 'rpe') => setSelectedMetric(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oneRM">1RM</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="rpe">RPE</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeframe.toString()} onValueChange={(value) => setTimeframe(Number(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
                <SelectItem value="180">6 Months</SelectItem>
                <SelectItem value="365">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Trend Summary */}
        {selectedTrend && (
          <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
            <div className={cn("flex items-center gap-2", getTrendColor(selectedTrend.direction))}>
              {getTrendIcon(selectedTrend.direction)}
              <span className="font-medium capitalize">{selectedTrend.direction}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Confidence: {Math.round(selectedTrend.confidence * 100)}%</span>
              <span>Data Points: {selectedTrend.dataPoints}</span>
              <span>Timeframe: {selectedTrend.timeframe}</span>
            </div>
            
            {selectedTrend.direction === 'improving' && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                +{selectedTrend.projectedGains.oneMonth.toFixed(1)} {getMetricUnit(selectedMetric)} / month
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {selectedMetric === 'rpe' ? (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    domain={selectedMetric === 'rpe' ? [0, 10] : ['auto', 'auto']}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-md">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm text-muted-foreground">
                              {getMetricLabel(selectedMetric)}: {payload[0].value} {getMetricUnit(selectedMetric)}
                            </p>
                            {data.exercise && selectedExercise === 'all' && (
                              <p className="text-xs text-muted-foreground">Exercise: {data.exercise}</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-md">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm text-muted-foreground">
                              {getMetricLabel(selectedMetric)}: {payload[0].value} {getMetricUnit(selectedMetric)}
                            </p>
                            {data.exercise && selectedExercise === 'all' && (
                              <p className="text-xs text-muted-foreground">Exercise: {data.exercise}</p>
                            )}
                            {selectedExercise !== 'all' && (
                              <>
                                <p className="text-xs text-muted-foreground">RPE: {data.rpe}/10</p>
                                <p className="text-xs text-muted-foreground">Volume: {data.volume} lbs</p>
                              </>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No data available for the selected timeframe</p>
                <p className="text-sm">Try adjusting your filters or timeframe</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to aggregate metrics by date for "all exercises" view
function aggregateByDate(metrics: PerformanceMetric[], metricType: 'oneRM' | 'volume' | 'rpe') {
  const groupedByDate = metrics.reduce((acc, metric) => {
    const date = new Date(metric.date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(metric);
    return acc;
  }, {} as Record<string, PerformanceMetric[]>);

  return Object.entries(groupedByDate).map(([date, dayMetrics]) => {
    let value: number;
    
    switch (metricType) {
      case 'oneRM':
        value = Math.max(...dayMetrics.map(m => m.oneRM));
        break;
      case 'volume':
        value = dayMetrics.reduce((sum, m) => sum + m.volume, 0);
        break;
      case 'rpe':
        value = dayMetrics.reduce((sum, m) => sum + m.rpe, 0) / dayMetrics.length;
        break;
    }
    
    return {
      date,
      value: Math.round(value * 100) / 100,
      exercise: `${dayMetrics.length} exercises`,
      dataPoints: dayMetrics.length
    };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}