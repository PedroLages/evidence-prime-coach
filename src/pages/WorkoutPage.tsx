import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Timer, 
  Target,
  TrendingUp,
  CheckCircle2,
  Plus,
  Minus,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { WorkoutModificationAlert } from '@/components/WorkoutModificationAlert';
import { CoachingFloatingButton } from '@/components/CoachingFloatingButton';
import { WorkoutModifier } from '@/lib/aiCoach/workoutModifier';
import { ReadinessAnalyzer } from '@/lib/aiCoach/readinessAnalyzer';
import { WorkoutModification, RealTimeCoaching, DailyMetrics } from '@/types/aiCoach';
import { cn } from '@/lib/utils';

interface Exercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
  targetWeight: number;
  currentSet: number;
  completed: boolean;
  restTime: number;
}

export default function WorkoutPage() {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [modifications, setModifications] = useState<WorkoutModification[]>([]);
  const [realtimeCoaching, setRealtimeCoaching] = useState<RealTimeCoaching | null>(null);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);

  // Mock readiness data
  const mockMetrics: DailyMetrics[] = [
    { id: '1', date: '2024-01-27', sleep: 6.5, energy: 6, soreness: 5, stress: 6 }
  ];

  const [exercises] = useState<Exercise[]>([
    {
      id: '1',
      name: 'Incline Barbell Bench Press',
      targetSets: 4,
      targetReps: '4-6',
      targetWeight: 75,
      currentSet: 0,
      completed: false,
      restTime: 180
    },
    {
      id: '2', 
      name: 'Bent-Over Barbell Row',
      targetSets: 4,
      targetReps: '4-6',
      targetWeight: 80,
      currentSet: 0,
      completed: false,
      restTime: 180
    },
    {
      id: '3',
      name: 'Overhead Press',
      targetSets: 3,
      targetReps: '5-6',
      targetWeight: 55,
      currentSet: 0,
      completed: false,
      restTime: 150
    },
    {
      id: '4',
      name: 'Weighted Pull-ups',
      targetSets: 3,
      targetReps: '4-6',
      targetWeight: 10,
      currentSet: 0,
      completed: false,
      restTime: 180
    },
    {
      id: '5',
      name: 'Close-Grip Bench Press',
      targetSets: 3,
      targetReps: '6-8',
      targetWeight: 65,
      currentSet: 0,
      completed: false,
      restTime: 120
    }
  ]);

  const [currentSet, setCurrentSet] = useState({
    reps: 0,
    weight: exercises[currentExercise]?.targetWeight || 0,
    rpe: 0
  });

  const completedExercises = exercises.filter(ex => ex.completed).length;
  const totalSets = exercises.reduce((acc, ex) => acc + ex.targetSets, 0);
  const completedSets = exercises.reduce((acc, ex) => acc + ex.currentSet, 0);

  useEffect(() => {
    // Generate workout modifications on workout start
    if (isWorkoutActive && modifications.length === 0) {
      const readiness = ReadinessAnalyzer.analyzeReadiness(mockMetrics);
      const plannedWorkout = { sets: 4, reps: 8, intensity: 100 };
      const suggestedMods = WorkoutModifier.suggestWorkoutModifications(plannedWorkout, readiness);
      setModifications(suggestedMods);
    }
  }, [isWorkoutActive]);

  const startWorkout = () => {
    setIsWorkoutActive(true);
    setWorkoutStartTime(Date.now());
  };

  const completeSet = () => {
    if (currentSet.reps === 0) return;
    
    
    // Generate real-time coaching
    const timeElapsed = workoutStartTime ? (Date.now() - workoutStartTime) / 1000 : 0;
    const coaching = WorkoutModifier.provideRealTimeCoaching(
      exercises[currentExercise].currentSet + 1,
      exercises[currentExercise].name,
      currentSet.rpe,
      timeElapsed
    );
    setRealtimeCoaching(coaching);

    // Logic to complete current set
    setIsResting(true);
    setRestTimer(exercises[currentExercise].restTime);
    
    // Increment set count
    const updatedExercises = [...exercises];
    updatedExercises[currentExercise].currentSet++;
    
    // Check if exercise is complete
    if (updatedExercises[currentExercise].currentSet >= updatedExercises[currentExercise].targetSets) {
      updatedExercises[currentExercise].completed = true;
      // Move to next exercise
      if (currentExercise < exercises.length - 1) {
        setCurrentExercise(currentExercise + 1);
      }
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const handleAcceptModification = (modification: WorkoutModification) => {
    console.log('Accepted modification:', modification);
    setModifications(prev => prev.filter(m => m !== modification));
  };

  const handleDismissModification = (modification: WorkoutModification) => {
    setModifications(prev => prev.filter(m => m !== modification));
  };

  const handleModifyModification = (modification: WorkoutModification) => {
    console.log('Modify modification:', modification);
  };

  const handleGuidanceRequest = () => {
    console.log('User requested guidance');
  };

  if (!isWorkoutActive) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* AI Workout Modifications for Pre-Workout */}
          {modifications.length > 0 && (
            <WorkoutModificationAlert
              modifications={modifications}
              onAccept={handleAcceptModification}
              onDismiss={handleDismissModification}
              onModify={handleModifyModification}
            />
          )}

          {/* Workout Header */}
          <div className="text-center space-y-4">
            <Badge className="bg-gradient-primary text-primary-foreground">
              Week 12 • Power Phase
            </Badge>
            <h1 className="text-3xl font-bold">Upper Power</h1>
            <p className="text-muted-foreground">
              4-6 reps • 75-85% 1RM • Focus on explosive power
            </p>
          </div>

          {/* Readiness Check */}
          <Card className="bg-gradient-subtle border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Pre-Workout Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">8.2</div>
                  <p className="text-xs text-muted-foreground">Readiness</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">7.2h</div>
                  <p className="text-xs text-muted-foreground">Sleep</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">8/10</div>
                  <p className="text-xs text-muted-foreground">Energy</p>
                </div>
              </div>
              <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                <p className="text-sm text-success-foreground">
                  ✓ Excellent readiness! Full intensity training recommended.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Exercise Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Exercises</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {exercises.map((exercise, index) => (
                <div key={exercise.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{exercise.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {exercise.targetSets} sets × {exercise.targetReps} reps @ {exercise.targetWeight}kg
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Start Button */}
          <Card className="bg-gradient-primary text-primary-foreground border-0">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    45-50 min
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    5 exercises
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="w-full bg-white text-primary hover:bg-white/90"
                  onClick={startWorkout}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Workout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Workout Progress Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Timer className="h-4 w-4" />
              {Math.floor(workoutTime / 60)}:{(workoutTime % 60).toString().padStart(2, '0')}
            </div>
            <div>Exercise {currentExercise + 1} of {exercises.length}</div>
          </div>
          <Progress value={(completedSets / totalSets) * 100} className="h-2" />
        </div>

        {/* Current Exercise */}
        <Card className="shadow-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{exercises[currentExercise]?.name}</CardTitle>
                <p className="text-muted-foreground">
                  Set {exercises[currentExercise]?.currentSet + 1} of {exercises[currentExercise]?.targetSets}
                </p>
              </div>
              <Badge variant="secondary">
                {exercises[currentExercise]?.targetReps} reps
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Weight Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Weight (kg)</label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentSet(prev => ({ ...prev, weight: Math.max(0, prev.weight - 2.5) }))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input 
                  type="number" 
                  value={currentSet.weight}
                  onChange={(e) => setCurrentSet(prev => ({ ...prev, weight: Number(e.target.value) }))}
                  className="text-center text-lg font-bold"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentSet(prev => ({ ...prev, weight: prev.weight + 2.5 }))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Reps Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reps Completed</label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentSet(prev => ({ ...prev, reps: Math.max(0, prev.reps - 1) }))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input 
                  type="number" 
                  value={currentSet.reps}
                  onChange={(e) => setCurrentSet(prev => ({ ...prev, reps: Number(e.target.value) }))}
                  className="text-center text-lg font-bold"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentSet(prev => ({ ...prev, reps: prev.reps + 1 }))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* RPE Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">RPE (Rate of Perceived Exertion)</label>
              <div className="grid grid-cols-5 gap-2">
                {[6, 7, 8, 9, 10].map((rpe) => (
                  <Button
                    key={rpe}
                    variant={currentSet.rpe === rpe ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentSet(prev => ({ ...prev, rpe }))}
                    className={cn(
                      currentSet.rpe === rpe && "bg-gradient-primary text-primary-foreground"
                    )}
                  >
                    {rpe}
                  </Button>
                ))}
              </div>
            </div>

            {/* Complete Set Button */}
            <Button 
              className="w-full bg-gradient-success hover:bg-success/90 shadow-primary" 
              size="lg"
              onClick={completeSet}
              disabled={currentSet.reps === 0}
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Complete Set
            </Button>
          </CardContent>
        </Card>

        {/* Rest Timer */}
        {isResting && (
          <Card className="bg-gradient-accent text-accent-foreground border-0">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Rest Time</h3>
                <div className="text-4xl font-bold">
                  {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    className="flex-1"
                    onClick={skipRest}
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    Skip Rest
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setRestTimer(restTimer + 30)}
                  >
                    +30s
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercise List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Exercise Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div 
                  key={exercise.id} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    index === currentExercise ? "bg-primary/10 border-primary" :
                    exercise.completed ? "bg-success/10 border-success" :
                    "bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      index === currentExercise ? "bg-primary text-primary-foreground" :
                      exercise.completed ? "bg-success text-success-foreground" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {exercise.completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{exercise.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {exercise.currentSet}/{exercise.targetSets} sets completed
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    exercise.completed ? "default" : 
                    index === currentExercise ? "secondary" : 
                    "outline"
                  }>
                    {exercise.targetWeight}kg
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
          <Button variant="outline" className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Notes
          </Button>
          <Button variant="outline" className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
        </div>

        {/* Real-time AI Coaching */}
        <CoachingFloatingButton
          coaching={realtimeCoaching}
          onGuidanceRequest={handleGuidanceRequest}
        />
      </div>
    );
  }