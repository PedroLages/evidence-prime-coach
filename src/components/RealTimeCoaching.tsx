import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  Timer, 
  Target,
  Lightbulb,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachingSuggestion {
  id: string;
  type: 'weight' | 'rest' | 'form' | 'motivation' | 'recovery' | 'intensity';
  message: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    value: any;
  };
  reasoning: string;
}

interface RealTimeCoachingProps {
  currentExercise: string;
  currentSet: number;
  totalSets: number;
  lastSetData?: {
    weight: number;
    reps: number;
    rpe: number;
  };
  readinessScore: number;
  workoutProgress: number;
  onApplySuggestion?: (suggestion: CoachingSuggestion) => void;
}

export const RealTimeCoaching: React.FC<RealTimeCoachingProps> = ({
  currentExercise,
  currentSet,
  totalSets,
  lastSetData,
  readinessScore,
  workoutProgress,
  onApplySuggestion
}) => {
  const [suggestions, setSuggestions] = useState<CoachingSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    generateSuggestions();
  }, [currentExercise, currentSet, lastSetData, readinessScore, workoutProgress]);

  const generateSuggestions = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newSuggestions: CoachingSuggestion[] = [];

    // Weight recommendations based on RPE
    if (lastSetData) {
      const { weight, reps, rpe } = lastSetData;
      
      if (rpe <= 6 && reps >= 8) {
        newSuggestions.push({
          id: 'weight-increase',
          type: 'weight',
          message: `Increase weight to ${weight + 5}lbs for next set`,
          confidence: 0.85,
          urgency: 'medium',
          action: {
            label: 'Apply Weight',
            value: weight + 5
          },
          reasoning: `Your RPE was ${rpe}/10 with ${reps} reps, indicating you can handle more weight`
        });
      } else if (rpe >= 9 && reps < 6) {
        newSuggestions.push({
          id: 'weight-decrease',
          type: 'weight',
          message: `Consider reducing weight to ${weight - 5}lbs`,
          confidence: 0.75,
          urgency: 'high',
          action: {
            label: 'Reduce Weight',
            value: weight - 5
          },
          reasoning: `High RPE (${rpe}/10) with low reps suggests weight is too heavy`
        });
      }
    }

    // Rest time optimization based on readiness
    if (readinessScore < 7) {
      newSuggestions.push({
        id: 'extended-rest',
        type: 'rest',
        message: 'Take 30 seconds extra rest between sets',
        confidence: 0.8,
        urgency: 'medium',
        reasoning: `Your readiness score (${readinessScore}/10) suggests you need more recovery time`
      });
    }

    // Form reminders for specific exercises
    const formReminders: Record<string, string> = {
      'squat': 'Keep chest up, knees in line with toes',
      'deadlift': 'Brace your core, keep bar close to shins',
      'bench press': 'Retract shoulder blades, drive through feet',
      'overhead press': 'Brace core, keep bar path straight'
    };

    const exerciseKey = currentExercise.toLowerCase();
    for (const [exercise, reminder] of Object.entries(formReminders)) {
      if (exerciseKey.includes(exercise)) {
        newSuggestions.push({
          id: 'form-reminder',
          type: 'form',
          message: reminder,
          confidence: 0.9,
          urgency: 'low',
          reasoning: 'Form reminder for optimal technique and safety'
        });
        break;
      }
    }

    // Motivation based on progress
    if (workoutProgress > 0.7) {
      newSuggestions.push({
        id: 'motivation-finish',
        type: 'motivation',
        message: 'You\'re in the final stretch! Push through these last sets',
        confidence: 0.95,
        urgency: 'low',
        reasoning: 'High workout completion rate indicates good momentum'
      });
    }

    // Recovery suggestions for high intensity
    if (lastSetData?.rpe && lastSetData.rpe >= 9) {
      newSuggestions.push({
        id: 'recovery-focus',
        type: 'recovery',
        message: 'Focus on controlled breathing and muscle relaxation',
        confidence: 0.8,
        urgency: 'medium',
        reasoning: 'High RPE indicates intense effort - prioritize recovery'
      });
    }

    setSuggestions(newSuggestions);
    setIsAnalyzing(false);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'weight':
        return <TrendingUp className="h-4 w-4" />;
      case 'rest':
        return <Timer className="h-4 w-4" />;
      case 'form':
        return <Target className="h-4 w-4" />;
      case 'motivation':
        return <Heart className="h-4 w-4" />;
      case 'recovery':
        return <Zap className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            AI Coach
          </CardTitle>
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Analyzing...
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Context */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{currentExercise}</span>
            <Badge variant="secondary">
              Set {currentSet} of {totalSets}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Readiness: {readinessScore}/10</span>
            <span>Progress: {Math.round(workoutProgress * 100)}%</span>
            {lastSetData && (
              <span>Last: {lastSetData.weight}lbs × {lastSetData.reps} @ RPE {lastSetData.rpe}</span>
            )}
          </div>
        </div>

        {/* Coaching Suggestions */}
        {suggestions.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Suggestions</h4>
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={cn(
                  "p-3 rounded-lg border transition-all hover:shadow-sm",
                  getUrgencyColor(suggestion.urgency)
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSuggestionIcon(suggestion.type)}
                    <span className="font-medium text-sm">{suggestion.message}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getConfidenceColor(suggestion.confidence))}
                    >
                      {Math.round(suggestion.confidence * 100)}% confident
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {suggestion.urgency}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3">
                  {suggestion.reasoning}
                </p>
                
                {suggestion.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onApplySuggestion?.(suggestion)}
                    className="w-full"
                  >
                    {suggestion.action.label}
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No specific recommendations at this time</p>
            <p className="text-xs">Keep up the great work!</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h4>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={generateSuggestions}
              disabled={isAnalyzing}
              className="flex-1"
            >
              <Brain className="h-3 w-3 mr-1" />
              Get Advice
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Report Issue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 