import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Brain, 
  Play, 
  Clock, 
  Target, 
  Zap,
  Activity,
  Dumbbell,
  Timer,
  TrendingUp
} from 'lucide-react';
import { getAIWorkoutTemplates, WorkoutTemplate, getTemplateExercises } from '@/services/database';
import ActiveWorkout from './ActiveWorkout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AIWorkoutExercise {
  exerciseId: string;
  exercise: {
    name: string;
    muscle_groups: string[];
    equipment: string[];
    instructions: string;
  };
  targetSets: number;
  targetReps: string;
  targetRPE: number;
  restTime: number;
  notes?: string;
  category?: 'warmup' | 'main' | 'cooldown';
}

interface AIWorkoutData {
  id: string;
  name: string;
  type: string;
  estimatedDuration: number;
  targetIntensity: number;
  exercises: AIWorkoutExercise[];
  warmup?: AIWorkoutExercise[];
  cooldown?: AIWorkoutExercise[];
}

interface AIWorkoutLauncherProps {
  workout: WorkoutTemplate;
  onWorkoutComplete?: () => void;
}

export const AIWorkoutLauncher: React.FC<AIWorkoutLauncherProps> = ({ 
  workout,
  onWorkoutComplete 
}) => {
  const { user } = useAuth();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [aiWorkoutData, setAIWorkoutData] = useState<AIWorkoutData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAIWorkoutData = async () => {
    if (!workout) return;

    try {
      setLoading(true);
      
      // Get template exercises which contain the AI workout structure
      const templateExercises = await getTemplateExercises(workout.id);
      
      // Parse AI metadata
      const aiMetadata = workout.ai_metadata;
      const generationParams = workout.generation_params;
      
      // Group exercises by category (warmup, main, cooldown)
      const exercisesByCategory = {
        warmup: [] as AIWorkoutExercise[],
        main: [] as AIWorkoutExercise[],
        cooldown: [] as AIWorkoutExercise[]
      };
      
      templateExercises.forEach((te, index) => {
        const exerciseData: AIWorkoutExercise = {
          exerciseId: te.exercise_id,
          exercise: {
            name: te.exercise.name,
            muscle_groups: te.exercise.muscle_groups || [],
            equipment: te.exercise.equipment || [],
            instructions: te.exercise.instructions || ''
          },
          targetSets: te.sets,
          targetReps: te.reps.toString(),
          targetRPE: parseFloat(te.notes?.match(/RPE:\s*(\d+(?:\.\d+)?)/)?.[1] || '7'),
          restTime: te.rest_seconds || 120,
          notes: te.notes || undefined
        };

        // Determine category based on order and AI metadata
        if (aiMetadata?.warmup_count && index < aiMetadata.warmup_count) {
          exerciseData.category = 'warmup';
          exercisesByCategory.warmup.push(exerciseData);
        } else if (aiMetadata?.cooldown_count && 
                   index >= templateExercises.length - aiMetadata.cooldown_count) {
          exerciseData.category = 'cooldown';
          exercisesByCategory.cooldown.push(exerciseData);
        } else {
          exerciseData.category = 'main';
          exercisesByCategory.main.push(exerciseData);
        }
      });

      const workoutData: AIWorkoutData = {
        id: workout.id,
        name: workout.name,
        type: workout.category || 'strength',
        estimatedDuration: workout.estimated_duration || 45,
        targetIntensity: 7, // Default intensity
        exercises: exercisesByCategory.main,
        warmup: exercisesByCategory.warmup.length > 0 ? exercisesByCategory.warmup : undefined,
        cooldown: exercisesByCategory.cooldown.length > 0 ? exercisesByCategory.cooldown : undefined
      };

      setAIWorkoutData(workoutData);
    } catch (error) {
      console.error('Error loading AI workout data:', error);
      toast({
        title: "Error",
        description: "Failed to load workout data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewWorkout = async () => {
    setIsPreviewOpen(true);
    await loadAIWorkoutData();
  };

  const handleStartWorkout = () => {
    if (aiWorkoutData) {
      setIsWorkoutActive(true);
      setIsPreviewOpen(false);
    }
  };

  const handleWorkoutComplete = () => {
    setIsWorkoutActive(false);
    setAIWorkoutData(null);
    onWorkoutComplete?.();
  };

  if (isWorkoutActive && aiWorkoutData) {
    return (
      <ActiveWorkout
        aiWorkout={aiWorkoutData}
        onComplete={handleWorkoutComplete}
      />
    );
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              {workout.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                AI Generated
              </Badge>
              {workout.ai_metadata?.confidence_score && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(workout.ai_metadata.confidence_score * 100)}% confidence
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {workout.description}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              ~{workout.estimated_duration}min
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              {workout.difficulty_level}
            </div>
            {workout.ai_metadata?.warmup_count && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="h-3 w-3" />
                Dynamic warmup
              </div>
            )}
            {workout.ai_metadata?.cooldown_count && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" />
                Cooldown routine
              </div>
            )}
          </div>

          {workout.ai_metadata?.reasoning && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-xs font-medium text-blue-600 mb-1">AI Reasoning</div>
              <div className="text-xs text-blue-600">
                {workout.ai_metadata.reasoning}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviewWorkout}
              className="flex-1"
            >
              Preview Workout
            </Button>
            <Button 
              size="sm" 
              onClick={handleStartWorkout}
              disabled={!aiWorkoutData}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-1" />
              Start Now
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              {workout.name} - Preview
            </DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          ) : aiWorkoutData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-sm font-medium">Duration</div>
                  <div className="text-lg font-bold text-blue-600">
                    ~{aiWorkoutData.estimatedDuration}min
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <Target className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-sm font-medium">Type</div>
                  <div className="text-lg font-bold text-green-600 capitalize">
                    {aiWorkoutData.type}
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-sm font-medium">Exercises</div>
                  <div className="text-lg font-bold text-purple-600">
                    {aiWorkoutData.exercises.length}
                    {aiWorkoutData.warmup && `+${aiWorkoutData.warmup.length}W`}
                    {aiWorkoutData.cooldown && `+${aiWorkoutData.cooldown.length}C`}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {aiWorkoutData.warmup && aiWorkoutData.warmup.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      Warmup ({aiWorkoutData.warmup.length} exercises)
                    </h3>
                    <div className="space-y-2 pl-6">
                      {aiWorkoutData.warmup.map((exercise, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b">
                          <span className="font-medium">{exercise.exercise.name}</span>
                          <div className="text-sm text-muted-foreground">
                            {exercise.targetSets} × {exercise.targetReps}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-blue-500" />
                    Main Workout ({aiWorkoutData.exercises.length} exercises)
                  </h3>
                  <div className="space-y-2 pl-6">
                    {aiWorkoutData.exercises.map((exercise, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-medium">{exercise.exercise.name}</span>
                          <div className="text-xs text-muted-foreground">
                            Rest: {Math.floor(exercise.restTime / 60)}:{(exercise.restTime % 60).toString().padStart(2, '0')}
                            {exercise.targetRPE && ` • RPE: ${exercise.targetRPE}`}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground text-right">
                          <div>{exercise.targetSets} × {exercise.targetReps}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {aiWorkoutData.cooldown && aiWorkoutData.cooldown.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      Cooldown ({aiWorkoutData.cooldown.length} exercises)
                    </h3>
                    <div className="space-y-2 pl-6">
                      {aiWorkoutData.cooldown.map((exercise, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b">
                          <span className="font-medium">{exercise.exercise.name}</span>
                          <div className="text-sm text-muted-foreground">
                            {exercise.targetSets} × {exercise.targetReps}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="flex-1">
                  Close Preview
                </Button>
                <Button onClick={handleStartWorkout} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Start This Workout
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Failed to load workout data</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIWorkoutLauncher;