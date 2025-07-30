import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, Plus, Minus, Timer, Zap } from 'lucide-react';
import { workoutSessionAPI } from '@/services/api';
import { getTemplateExercises } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface WorkoutSet {
  setNumber: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  restSeconds?: number;
  completed: boolean;
}

interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  targetSets: number;
  targetReps?: number;
  targetWeight?: number;
}

interface ActiveWorkoutProps {
  templateId?: string;
  templateName?: string;
  onComplete?: () => void;
}

export default function ActiveWorkout({ templateId, templateName = "Custom Workout", onComplete }: ActiveWorkoutProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const restInterval = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

  useEffect(() => {
    loadTemplateExercises();
    return () => {
      if (restInterval.current) {
        clearInterval(restInterval.current);
      }
    };
  }, [templateId]);

  const loadTemplateExercises = async () => {
    try {
      setLoading(true);
      
      if (templateId) {
        // Load exercises from template
        const templateExercises = await getTemplateExercises(templateId);
        const workoutExercises: WorkoutExercise[] = templateExercises.map(te => ({
          id: te.exercise_id,
          name: te.exercise.name,
          targetSets: te.sets,
          targetReps: te.reps,
          targetWeight: te.weight || undefined,
          sets: Array.from({ length: te.sets }, (_, index) => ({
            setNumber: index + 1,
            completed: false,
            restSeconds: te.rest_seconds || undefined
          }))
        }));
        setExercises(workoutExercises);
      } else {
        // Default empty workout
        setExercises([
          {
            id: 'empty-1',
            name: 'Add Exercise',
            targetSets: 3,
            targetReps: 8,
            sets: [
              { setNumber: 1, completed: false },
              { setNumber: 2, completed: false },
              { setNumber: 3, completed: false }
            ]
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading template exercises:', error);
      // Fallback to default exercises
      setExercises([
        {
          id: 'fallback-1',
          name: 'Custom Exercise',
          targetSets: 3,
          targetReps: 8,
          sets: [
            { setNumber: 1, completed: false },
            { setNumber: 2, completed: false },
            { setNumber: 3, completed: false }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = async () => {
    try {
      const session = await workoutSessionAPI.createSession({
        user_id: user?.id || '',
        template_id: templateId || null,
        name: templateName,
        started_at: new Date().toISOString(),
        completed_at: null,
        duration_minutes: null,
        total_volume: null,
        average_rpe: null,
        notes: null
      });
      
      setSessionId(session.id);
      setIsActive(true);
      setWorkoutStartTime(new Date());
      toast({
        title: "Success",
        description: "Workout started!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start workout",
        variant: "destructive"
      });
      console.error('Error starting workout:', error);
    }
  };

  const completeWorkout = async () => {
    if (!sessionId || !workoutStartTime) return;

    try {
      const duration = Math.round((Date.now() - workoutStartTime.getTime()) / 1000 / 60);
      const completedSets = exercises.flatMap(ex => ex.sets.filter(set => set.completed));
      const totalVolume = completedSets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
      const averageRPE = completedSets.reduce((sum, set) => sum + (set.rpe || 0), 0) / completedSets.length || 0;

      await workoutSessionAPI.updateSession(sessionId, {
        completed_at: new Date().toISOString(),
        duration_minutes: duration,
        total_volume: totalVolume,
        average_rpe: averageRPE
      });

      setIsActive(false);
      setIsResting(false);
      if (restInterval.current) {
        clearInterval(restInterval.current);
      }
      
      toast({
        title: "Success",
        description: "Workout completed! Great job!"
      });
      onComplete?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save workout",
        variant: "destructive"
      });
      console.error('Error completing workout:', error);
    }
  };

  const completeSet = (exerciseIndex: number, setIndex: number, setData: Partial<WorkoutSet>) => {
    setExercises(prev => prev.map((exercise, exIndex) => {
      if (exIndex === exerciseIndex) {
        return {
          ...exercise,
          sets: exercise.sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
              return { ...set, ...setData, completed: true };
            }
            return set;
          })
        };
      }
      return exercise;
    }));

    // Auto-start rest timer
    const suggestedRest = getSuggestedRestTime(exerciseIndex);
    startRestTimer(suggestedRest);
    
    // Move to next set or exercise
    const currentExercise = exercises[exerciseIndex];
    if (setIndex < currentExercise.sets.length - 1) {
      setCurrentSetIndex(setIndex + 1);
    } else if (exerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(exerciseIndex + 1);
      setCurrentSetIndex(0);
    }
  };

  const startRestTimer = (seconds: number) => {
    setRestTimer(seconds);
    setIsResting(true);
    
    restInterval.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) {
          setIsResting(false);
          if (restInterval.current) {
            clearInterval(restInterval.current);
          }
          toast({
            title: "Rest Complete",
            description: "Rest period complete!"
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const getSuggestedRestTime = (exerciseIndex: number) => {
    // Compound movements typically need more rest
    const compoundExercises = ['bench press', 'squat', 'deadlift', 'overhead press'];
    const exerciseName = exercises[exerciseIndex]?.name.toLowerCase();
    
    if (compoundExercises.some(name => exerciseName.includes(name))) {
      return 180; // 3 minutes
    }
    return 120; // 2 minutes for isolation exercises
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentExercise = exercises[currentExerciseIndex];
  const currentSet = currentExercise?.sets[currentSetIndex];
  const workoutProgress = exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter(set => set.completed).length;
  }, 0);
  const totalSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            {templateName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Ready to start your workout?
            </p>
            <Button onClick={startWorkout} size="lg" className="w-full">
              <Play className="mr-2 h-5 w-5" />
              Start Workout
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Exercises ({exercises.length})</h4>
            <div className="space-y-2">
              {exercises.map((exercise, index) => (
                <div key={exercise.id} className="flex justify-between text-sm">
                  <span>{exercise.name}</span>
                  <span className="text-muted-foreground">
                    {exercise.targetSets} × {exercise.targetReps || '—'}
                    {exercise.targetWeight && ` @ ${exercise.targetWeight}lbs`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Workout Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              {templateName}
            </CardTitle>
            <Button variant="destructive" onClick={completeWorkout}>
              <Square className="mr-2 h-4 w-4" />
              Finish Workout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Progress: {workoutProgress}/{totalSets} sets completed
            </div>
            <div className="text-sm text-muted-foreground">
              {workoutStartTime && `Started ${workoutStartTime.toLocaleTimeString()}`}
            </div>
          </div>
          <Progress value={(workoutProgress / totalSets) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Rest Timer */}
      {isResting && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Timer className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-600">Rest Period</span>
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-4">
              {formatTime(restTimer)}
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsResting(false);
                if (restInterval.current) {
                  clearInterval(restInterval.current);
                }
              }}
            >
              Skip Rest
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current Exercise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{currentExercise?.name}</span>
            <Badge variant="secondary">
              Set {currentSetIndex + 1} of {currentExercise?.sets.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SetInput
            exercise={currentExercise}
            setIndex={currentSetIndex}
            onComplete={(setData) => completeSet(currentExerciseIndex, currentSetIndex, setData)}
          />
        </CardContent>
      </Card>

      {/* Exercise List */}
      <Card>
        <CardHeader>
          <CardTitle>All Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exercises.map((exercise, exerciseIndex) => (
              <div key={exercise.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">{exercise.name}</h4>
                  <Badge variant={exerciseIndex === currentExerciseIndex ? "default" : "secondary"}>
                    {exercise.sets.filter(set => set.completed).length}/{exercise.sets.length} sets
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className={`p-3 rounded border ${
                        set.completed 
                          ? 'bg-green-50 border-green-200 dark:bg-green-950/20' 
                          : exerciseIndex === currentExerciseIndex && setIndex === currentSetIndex
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">Set {set.setNumber}</div>
                      {set.completed ? (
                        <div className="text-xs space-y-1">
                          {set.weight && <div>Weight: {set.weight}lbs</div>}
                          {set.reps && <div>Reps: {set.reps}</div>}
                          {set.rpe && <div>RPE: {set.rpe}/10</div>}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Target: {exercise.targetReps || '—'} reps
                          {exercise.targetWeight && ` @ ${exercise.targetWeight}lbs`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SetInputProps {
  exercise: WorkoutExercise;
  setIndex: number;
  onComplete: (setData: Partial<WorkoutSet>) => void;
}

function SetInput({ exercise, setIndex, onComplete }: SetInputProps) {
  const [weight, setWeight] = useState(exercise.targetWeight || 0);
  const [reps, setReps] = useState(exercise.targetReps || 0);
  const [rpe, setRPE] = useState(7);

  const handleComplete = () => {
    onComplete({
      weight: weight || undefined,
      reps: reps || undefined,
      rpe: rpe || undefined
    });
  };

  const currentSet = exercise.sets[setIndex];
  
  if (currentSet?.completed) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 font-medium mb-2">Set Completed!</div>
        <div className="text-sm text-muted-foreground">
          {currentSet.weight}lbs × {currentSet.reps} reps @ RPE {currentSet.rpe}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="weight">Weight (lbs)</Label>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeight(Math.max(0, weight - 5))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeight(weight + 5)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="reps">Reps</Label>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReps(Math.max(0, reps - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="reps"
              type="number"
              value={reps}
              onChange={(e) => setReps(Number(e.target.value))}
              className="text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReps(reps + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="rpe">RPE (1-10)</Label>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRPE(Math.max(1, rpe - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="rpe"
              type="number"
              min="1"
              max="10"
              value={rpe}
              onChange={(e) => setRPE(Number(e.target.value))}
              className="text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRPE(Math.min(10, rpe + 1))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Button onClick={handleComplete} size="lg" className="w-full">
        Complete Set
      </Button>
    </div>
  );
}