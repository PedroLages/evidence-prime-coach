import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, Zap, Heart, Brain, Activity, Plus } from 'lucide-react';
import { readinessAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ReadinessMetrics {
  sleep_quality: number;
  energy_level: number;
  muscle_soreness: number;
  stress_level: number;
  motivation: number;
}

export default function ReadinessTracker() {
  const [todaysMetrics, setTodaysMetrics] = useState<ReadinessMetrics>({
    sleep_quality: 7,
    energy_level: 7,
    muscle_soreness: 3,
    stress_level: 3,
    motivation: 8
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [overallReadiness, setOverallReadiness] = useState(0);
  const [showInputDialog, setShowInputDialog] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    loadTodaysMetrics();
  }, []);

  useEffect(() => {
    calculateOverallReadiness();
  }, [todaysMetrics]);

  const loadTodaysMetrics = async () => {
    try {
      setIsLoading(true);
      const metrics = await readinessAPI.getTodaysMetrics();
      
      if (metrics) {
        setTodaysMetrics({
          sleep_quality: metrics.sleep_quality || 7,
          energy_level: metrics.energy_level || 7,
          muscle_soreness: metrics.muscle_soreness || 3,
          stress_level: metrics.stress_level || 3,
          motivation: metrics.motivation || 8
        });
        setHasSubmittedToday(true);
      }
    } catch (error) {
      console.error('Error loading readiness metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOverallReadiness = () => {
    // Weighted calculation of readiness
    const { sleep_quality, energy_level, muscle_soreness, stress_level, motivation } = todaysMetrics;
    
    // Convert soreness and stress to positive scale (lower is better)
    const adjustedSoreness = 11 - muscle_soreness;
    const adjustedStress = 11 - stress_level;
    
    // Weighted average (sleep and energy have higher weight)
    const weighted = (
      sleep_quality * 0.25 +
      energy_level * 0.25 +
      adjustedSoreness * 0.2 +
      adjustedStress * 0.15 +
      motivation * 0.15
    );
    
    setOverallReadiness(Math.round(weighted * 10) / 10);
  };

  const saveMetrics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await readinessAPI.saveMetrics({
        user_id: user?.id || '',
        date: today,
        ...todaysMetrics,
        overall_readiness: overallReadiness,
        hrv_score: null
      });
      
      setHasSubmittedToday(true);
      setShowInputDialog(false);
      toast.success('Readiness metrics saved!');
    } catch (error) {
      toast.error('Failed to save metrics');
      console.error('Error saving metrics:', error);
    }
  };

  const getReadinessLevel = (score: number) => {
    if (score >= 8.5) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-950' };
    if (score >= 7) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-950' };
    if (score >= 5.5) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-950' };
    return { label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-950' };
  };

  const getRecommendation = (score: number) => {
    if (score >= 8.5) return "You're feeling great! Perfect day for a challenging workout.";
    if (score >= 7) return "Good readiness. You can handle a normal intensity workout.";
    if (score >= 5.5) return "Moderate readiness. Consider a lighter workout or focus on technique.";
    return "Low readiness. Consider rest, mobility work, or very light activity.";
  };

  const metrics = [
    {
      key: 'sleep_quality' as keyof ReadinessMetrics,
      label: 'Sleep Quality',
      icon: Moon,
      description: 'How well did you sleep?',
      scale: 'Poor → Excellent'
    },
    {
      key: 'energy_level' as keyof ReadinessMetrics,
      label: 'Energy Level',
      icon: Zap,
      description: 'How energetic do you feel?',
      scale: 'Very Low → Very High'
    },
    {
      key: 'muscle_soreness' as keyof ReadinessMetrics,
      label: 'Muscle Soreness',
      icon: Activity,
      description: 'How sore are your muscles?',
      scale: 'No Soreness → Very Sore'
    },
    {
      key: 'stress_level' as keyof ReadinessMetrics,
      label: 'Stress Level',
      icon: Brain,
      description: 'How stressed do you feel?',
      scale: 'Very Relaxed → Very Stressed'
    },
    {
      key: 'motivation' as keyof ReadinessMetrics,
      label: 'Motivation',
      icon: Heart,
      description: 'How motivated are you to train?',
      scale: 'Very Low → Very High'
    }
  ];

  const readinessLevel = getReadinessLevel(overallReadiness);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Daily Readiness</h2>
        <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
          <DialogTrigger asChild>
            <Button variant={hasSubmittedToday ? "outline" : "default"}>
              <Plus className="mr-2 h-4 w-4" />
              {hasSubmittedToday ? 'Update' : 'Log'} Today's Metrics
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Daily Readiness Check-in</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {metrics.map((metric) => {
                const IconComponent = metric.icon;
                return (
                  <div key={metric.key} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <Label className="text-base font-medium">{metric.label}</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                    <div className="space-y-2">
                      <Slider
                        value={[todaysMetrics[metric.key]]}
                        onValueChange={(value) => setTodaysMetrics(prev => ({ ...prev, [metric.key]: value[0] }))}
                        min={1}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1</span>
                        <span className="font-medium">{todaysMetrics[metric.key]}</span>
                        <span>10</span>
                      </div>
                      <div className="text-xs text-center text-muted-foreground">
                        {metric.scale}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="border-t pt-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Overall Readiness Score</div>
                  <div className="text-3xl font-bold text-primary">{overallReadiness}/10</div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowInputDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveMetrics}>
                  Save Metrics
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Readiness Overview */}
      <Card className={`${readinessLevel.bgColor} border-2`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Readiness</span>
            <Badge variant="secondary" className={readinessLevel.color}>
              {readinessLevel.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold mb-2 text-primary">
              {overallReadiness}/10
            </div>
            <Progress value={overallReadiness * 10} className="h-3 mb-4" />
            <p className="text-muted-foreground">
              {getRecommendation(overallReadiness)}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.map((metric) => {
              const IconComponent = metric.icon;
              const value = todaysMetrics[metric.key];
              const isReverse = metric.key === 'muscle_soreness' || metric.key === 'stress_level';
              const displayValue = isReverse ? 11 - value : value;
              
              return (
                <div key={metric.key} className="text-center p-3 bg-background rounded-lg">
                  <IconComponent className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <div className="text-sm font-medium">{metric.label}</div>
                  <div className="text-lg font-bold">{value}/10</div>
                  <Progress value={displayValue * 10} className="h-1 mt-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {!hasSubmittedToday && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <Sun className="h-12 w-12 mx-auto mb-4 text-amber-600" />
              <h3 className="text-lg font-medium mb-2">Start Your Day Right</h3>
              <p className="text-muted-foreground mb-4">
                Log your daily readiness metrics to get personalized workout recommendations.
              </p>
              <Button onClick={() => setShowInputDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Today's Metrics
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}