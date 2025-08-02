import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Brain, 
  Target, 
  Activity, 
  Coffee, 
  Moon, 
  TrendingUp,
  Utensils,
  AlertCircle,
  CheckCircle,
  Clock,
  Lightbulb,
  ArrowRight,
  Send
} from 'lucide-react';
import { useAICoaching, GuidanceResponse } from '@/hooks/useAICoaching';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const guidanceContexts = [
  {
    id: 'user_requested_general_guidance',
    label: 'General Guidance',
    description: 'Overall training and lifestyle advice',
    icon: Brain,
    color: 'blue'
  },
  {
    id: 'pre_workout_guidance',
    label: 'Pre-Workout',
    description: 'Guidance before starting your workout',
    icon: Activity,
    color: 'green'
  },
  {
    id: 'during_workout_guidance',
    label: 'During Workout',
    description: 'Real-time workout adjustments',
    icon: Target,
    color: 'orange'
  },
  {
    id: 'post_workout_guidance',
    label: 'Post-Workout',
    description: 'Recovery and next steps after training',
    icon: CheckCircle,
    color: 'purple'
  },
  {
    id: 'recovery_guidance',
    label: 'Recovery Focus',
    description: 'Sleep, rest, and recovery optimization',
    icon: Moon,
    color: 'indigo'
  },
  {
    id: 'plateau_guidance',
    label: 'Plateau Breaking',
    description: 'Overcome training plateaus',
    icon: TrendingUp,
    color: 'red'
  },
  {
    id: 'nutrition_guidance',
    label: 'Nutrition Advice',
    description: 'Dietary recommendations for your goals',
    icon: Utensils,
    color: 'yellow'
  },
  {
    id: 'goal_adjustment_guidance',
    label: 'Goal Strategy',
    description: 'Goal setting and achievement planning',
    icon: Target,
    color: 'pink'
  }
];

export const AIGuidancePanel: React.FC = () => {
  const { requestGuidance, loading } = useAICoaching();
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [workoutType, setWorkoutType] = useState('');
  const [currentExercise, setCurrentExercise] = useState('');
  const [currentSet, setCurrentSet] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentGuidance, setCurrentGuidance] = useState<GuidanceResponse | null>(null);
  const [requesting, setRequesting] = useState(false);

  const handleGuidanceRequest = async () => {
    if (!selectedContext) {
      toast({
        title: "Please select a guidance type",
        description: "Choose what kind of guidance you need.",
        variant: "destructive"
      });
      return;
    }

    try {
      setRequesting(true);
      
      const options = {
        workoutType: workoutType || undefined,
        currentExercise: currentExercise || undefined,
        currentSet: currentSet ? parseInt(currentSet) : undefined,
        userQuestion: customQuestion || undefined,
        urgency
      };

      const guidance = await requestGuidance(selectedContext, options);
      
      setCurrentGuidance(guidance);
      setIsDialogOpen(false);
      
      toast({
        title: "Guidance received!",
        description: "AI Coach has analyzed your situation and provided recommendations."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get guidance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRequesting(false);
    }
  };

  const resetForm = () => {
    setSelectedContext('');
    setCustomQuestion('');
    setWorkoutType('');
    setCurrentExercise('');
    setCurrentSet('');
    setUrgency('medium');
  };

  const getContextColor = (color: string) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20',
      green: 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20',
      orange: 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/20',
      purple: 'border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/20',
      indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20',
      red: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20',
      yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20',
      pink: 'border-pink-200 bg-pink-50 text-pink-700 dark:bg-pink-950/20'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Request Guidance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Request AI Guidance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {guidanceContexts.map((context) => {
              const Icon = context.icon;
              return (
                <Dialog key={context.id} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-auto p-4 flex flex-col items-center gap-2 text-center",
                        "hover:border-primary transition-colors"
                      )}
                      onClick={() => {
                        setSelectedContext(context.id);
                        setIsDialogOpen(true);
                      }}
                    >
                      <div className={cn(
                        "p-2 rounded-full",
                        getContextColor(context.color)
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{context.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {context.description}
                        </div>
                      </div>
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {context.label} Guidance
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {context.description}
                      </p>
                      
                      {/* Context-specific fields */}
                      {(selectedContext === 'pre_workout_guidance' || 
                        selectedContext === 'during_workout_guidance') && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Workout Type</label>
                            <Select value={workoutType} onValueChange={setWorkoutType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select workout type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="strength">Strength Training</SelectItem>
                                <SelectItem value="cardio">Cardio</SelectItem>
                                <SelectItem value="hiit">HIIT</SelectItem>
                                <SelectItem value="yoga">Yoga/Flexibility</SelectItem>
                                <SelectItem value="sports">Sports Specific</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {selectedContext === 'during_workout_guidance' && (
                            <>
                              <div>
                                <label className="text-sm font-medium">Current Exercise</label>
                                <input
                                  type="text"
                                  value={currentExercise}
                                  onChange={(e) => setCurrentExercise(e.target.value)}
                                  placeholder="e.g., Bench Press, Squats"
                                  className="w-full p-2 border rounded-md"
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Current Set Number</label>
                                <input
                                  type="number"
                                  value={currentSet}
                                  onChange={(e) => setCurrentSet(e.target.value)}
                                  placeholder="e.g., 3"
                                  min="1"
                                  max="20"
                                  className="w-full p-2 border rounded-md"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* Custom question */}
                      <div>
                        <label className="text-sm font-medium">Additional Question (Optional)</label>
                        <Textarea
                          value={customQuestion}
                          onChange={(e) => setCustomQuestion(e.target.value)}
                          placeholder="Ask a specific question or provide more context..."
                          rows={3}
                        />
                      </div>
                      
                      {/* Urgency */}
                      <div>
                        <label className="text-sm font-medium">Urgency Level</label>
                        <Select value={urgency} onValueChange={(value: 'low' | 'medium' | 'high') => setUrgency(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - General advice</SelectItem>
                            <SelectItem value="medium">Medium - Timely guidance</SelectItem>
                            <SelectItem value="high">High - Urgent help needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsDialogOpen(false);
                            resetForm();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleGuidanceRequest}
                          disabled={requesting || loading}
                          className="flex items-center gap-2"
                        >
                          {requesting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Getting Guidance...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Get Guidance
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Guidance Display */}
      {currentGuidance && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Guidance Response
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(currentGuidance.priority)}>
                  {currentGuidance.priority} priority
                </Badge>
                <Badge variant="outline">
                  {Math.round(currentGuidance.confidence * 100)}% confidence
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Generated at {new Date(currentGuidance.timestamp).toLocaleString()}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Recommendations */}
            {currentGuidance.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {currentGuidance.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Action Items */}
            {currentGuidance.actionItems.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <ArrowRight className="h-4 w-4 text-blue-500" />
                  Action Items
                </h4>
                <ul className="space-y-2">
                  {currentGuidance.actionItems.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Insights */}
            {currentGuidance.insights.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Key Insights
                </h4>
                <ul className="space-y-2">
                  {currentGuidance.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentGuidance(null)}
              >
                Dismiss
              </Button>
              
              <Button 
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Ask Follow-up
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};