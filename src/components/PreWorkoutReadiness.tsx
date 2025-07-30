import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Heart, Battery, Target } from 'lucide-react';

interface ReadinessScore {
  overall: number;
  sleep: number;
  energy: number;
  soreness: number;
  stress: number;
  recommendation: 'high' | 'moderate' | 'light' | 'rest';
}

interface PreWorkoutReadinessProps {
  onReadinessUpdate?: (score: ReadinessScore) => void;
}

export const PreWorkoutReadiness: React.FC<PreWorkoutReadinessProps> = ({
  onReadinessUpdate
}) => {
  const { user } = useAuth();
  const [readinessScore, setReadinessScore] = useState<ReadinessScore | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTodaysReadiness = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todaysMetrics } = await supabase
        .from('readiness_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (todaysMetrics) {
        const score = calculateReadinessScore(todaysMetrics);
        setReadinessScore(score);
        onReadinessUpdate?.(score);
      } else {
        // No readiness data for today
        setReadinessScore(null);
      }
    } catch (error) {
      console.error('Error fetching readiness:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateReadinessScore = (metrics: any): ReadinessScore => {
    const sleep = metrics.sleep_quality || 7;
    const energy = metrics.energy_level || 7;
    const soreness = 10 - (metrics.muscle_soreness || 3); // Invert soreness (lower is better)
    const stress = 10 - (metrics.stress_level || 3); // Invert stress (lower is better)
    
    const overall = (sleep + energy + soreness + stress) / 4;
    
    let recommendation: ReadinessScore['recommendation'];
    if (overall >= 8) recommendation = 'high';
    else if (overall >= 6.5) recommendation = 'moderate';
    else if (overall >= 5) recommendation = 'light';
    else recommendation = 'rest';

    return {
      overall,
      sleep,
      energy,
      soreness,
      stress,
      recommendation
    };
  };

  const getRecommendationColor = (rec: ReadinessScore['recommendation']) => {
    switch (rec) {
      case 'high': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'light': return 'bg-orange-500';
      case 'rest': return 'bg-red-500';
    }
  };

  const getRecommendationText = (rec: ReadinessScore['recommendation']) => {
    switch (rec) {
      case 'high': return 'High Intensity Training';
      case 'moderate': return 'Moderate Intensity Training';
      case 'light': return 'Light Training Recommended';
      case 'rest': return 'Rest Day Recommended';
    }
  };

  const getRecommendationDescription = (rec: ReadinessScore['recommendation']) => {
    switch (rec) {
      case 'high': return 'You\'re feeling great! Perfect time for heavy lifting or high-intensity training.';
      case 'moderate': return 'Good energy levels. Stick to your planned workout with normal intensity.';
      case 'light': return 'Consider reducing intensity by 20-30% or focus on mobility work.';
      case 'rest': return 'Your body needs recovery. Consider taking a rest day or doing very light activity.';
    }
  };

  useEffect(() => {
    fetchTodaysReadiness();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Pre-Workout Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!readinessScore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Pre-Workout Readiness
          </CardTitle>
          <CardDescription>
            Track your readiness to optimize your workout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              No readiness data for today. Log your daily metrics to get personalized workout recommendations.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/settings'}>
              Log Readiness Metrics
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Pre-Workout Readiness
        </CardTitle>
        <CardDescription>
          Based on today's readiness metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="text-3xl font-bold">
              {readinessScore.overall.toFixed(1)}
            </div>
            <div className="text-muted-foreground">/10</div>
          </div>
          <Badge 
            className={`${getRecommendationColor(readinessScore.recommendation)} text-white`}
          >
            {getRecommendationText(readinessScore.recommendation)}
          </Badge>
        </div>

        <Separator />

        {/* Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Sleep Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={readinessScore.sleep * 10} className="w-20" />
              <span className="text-sm font-mono w-8">
                {readinessScore.sleep.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4 text-green-500" />
              <span className="text-sm">Energy Level</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={readinessScore.energy * 10} className="w-20" />
              <span className="text-sm font-mono w-8">
                {readinessScore.energy.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Recovery</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={readinessScore.soreness * 10} className="w-20" />
              <span className="text-sm font-mono w-8">
                {readinessScore.soreness.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              <span className="text-sm">Stress Level</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={readinessScore.stress * 10} className="w-20" />
              <span className="text-sm font-mono w-8">
                {readinessScore.stress.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Recommendation */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {getRecommendationDescription(readinessScore.recommendation)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};