/**
 * AI Workout Generator Component
 * 
 * Integrates with the ML workout generation system to create
 * personalized workouts based on user data, equipment, and preferences.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Zap, 
  Clock, 
  Target, 
  Settings, 
  Loader2,
  CheckCircle,
  Play,
  RefreshCw,
  AlertTriangle,
  Activity,
  Dumbbell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateAIWorkout } from '@/services/mlService';

interface WorkoutPreferences {
  workoutName?: string;
  workoutType: 'strength' | 'hypertrophy' | 'power' | 'endurance' | 'recovery';
  targetDuration: number;
  availableEquipment: string[];
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  targetMuscleGroups?: string[];
  excludeExercises?: string[];
  intensityPreference?: 'low' | 'moderate' | 'high';
}

interface GeneratedWorkout {
  id: string;
  name: string;
  type: string;
  estimatedDuration: number;
  targetIntensity: number;
  exercises: Array<{
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
    alternatives: Array<{
      exercise: { name: string };
      reason: string;
    }>;
  }>;
  adaptations: {
    readinessAdjustments: string[];
    equipmentSubstitutions: string[];
    progressiveOverload: string[];
  };
  confidence: number;
  reasoning: string[];
  metadata: {
    totalVolume: number;
    averageIntensity: number;
    muscleGroupBalance: Record<string, number>;
    generatedAt: string;
  };
}

const EQUIPMENT_OPTIONS = [
  'barbell', 'dumbbell', 'kettlebell', 'resistance_bands', 'pull_up_bar',
  'cable_machine', 'leg_press', 'lat_pulldown', 'rowing_machine', 'treadmill',
  'stationary_bike', 'bodyweight', 'medicine_ball', 'foam_roller'
];

const MUSCLE_GROUP_OPTIONS = [
  'chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps',
  'legs', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'abs'
];

export function AIWorkoutGenerator({ onWorkoutGenerated }: { onWorkoutGenerated?: (workout: GeneratedWorkout) => void }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<WorkoutPreferences>({
    workoutName: '',
    workoutType: 'strength',
    targetDuration: 60,
    availableEquipment: ['barbell', 'dumbbell', 'bodyweight'],
    fitnessLevel: 'intermediate'
  });
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      availableEquipment: checked 
        ? [...prev.availableEquipment, equipment]
        : prev.availableEquipment.filter(e => e !== equipment)
    }));
  };

  const handleMuscleGroupChange = (muscleGroup: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      targetMuscleGroups: checked
        ? [...(prev.targetMuscleGroups || []), muscleGroup]
        : (prev.targetMuscleGroups || []).filter(m => m !== muscleGroup)
    }));
  };

  const generateWorkout = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const workout = await generateAIWorkout(
        user.id,
        preferences.workoutType,
        preferences.targetDuration,
        preferences.availableEquipment,
        preferences.fitnessLevel,
        {
          workoutName: preferences.workoutName,
          targetMuscleGroups: preferences.targetMuscleGroups,
          excludeExercises: preferences.excludeExercises,
          intensityPreference: preferences.intensityPreference
        }
      );

      setGeneratedWorkout(workout);
      onWorkoutGenerated?.(workout);
    } catch (err) {
      console.error('Failed to generate workout:', err);
      setError('Failed to generate workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return 'text-red-600';
    if (intensity >= 6) return 'text-orange-600';
    if (intensity >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 8) return 'High';
    if (intensity >= 6) return 'Moderate';
    if (intensity >= 4) return 'Light';
    return 'Recovery';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Workout Generator
          </h2>
          <p className="text-muted-foreground">
            Generate personalized workouts using machine learning
          </p>
        </div>
      </div>

      <Tabs defaultValue="preferences" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="workout" disabled={!generatedWorkout}>Generated Workout</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Workout Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workoutName">Workout Name (Optional)</Label>
                  <Input
                    type="text"
                    placeholder="e.g., Upper Body Strength, Push Day, etc."
                    value={preferences.workoutName || ''}
                    onChange={(e) => setPreferences(prev => ({ ...prev, workoutName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workoutType">Workout Type</Label>
                  <Select 
                    value={preferences.workoutType} 
                    onValueChange={(value: any) => setPreferences(prev => ({ ...prev, workoutType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Strength Training</SelectItem>
                      <SelectItem value="hypertrophy">Hypertrophy (Muscle Building)</SelectItem>
                      <SelectItem value="power">Power Development</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                      <SelectItem value="recovery">Recovery Session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Target Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={preferences.targetDuration}
                    onChange={(e) => setPreferences(prev => ({ ...prev, targetDuration: parseInt(e.target.value) || 60 }))}
                    min="15"
                    max="180"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fitnessLevel">Fitness Level</Label>
                  <Select 
                    value={preferences.fitnessLevel} 
                    onValueChange={(value: any) => setPreferences(prev => ({ ...prev, fitnessLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intensityPreference">Intensity Preference</Label>
                  <Select 
                    value={preferences.intensityPreference || 'moderate'} 
                    onValueChange={(value: any) => setPreferences(prev => ({ ...prev, intensityPreference: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Intensity</SelectItem>
                      <SelectItem value="moderate">Moderate Intensity</SelectItem>
                      <SelectItem value="high">High Intensity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Equipment Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  Available Equipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {EQUIPMENT_OPTIONS.map((equipment) => (
                    <div key={equipment} className="flex items-center space-x-2">
                      <Checkbox
                        id={equipment}
                        checked={preferences.availableEquipment.includes(equipment)}
                        onCheckedChange={(checked) => handleEquipmentChange(equipment, !!checked)}
                      />
                      <Label htmlFor={equipment} className="text-sm capitalize">
                        {equipment.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Target Muscle Groups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Target Muscle Groups (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {MUSCLE_GROUP_OPTIONS.map((muscleGroup) => (
                  <div key={muscleGroup} className="flex items-center space-x-2">
                    <Checkbox
                      id={muscleGroup}
                      checked={preferences.targetMuscleGroups?.includes(muscleGroup)}
                      onCheckedChange={(checked) => handleMuscleGroupChange(muscleGroup, !!checked)}
                    />
                    <Label htmlFor={muscleGroup} className="text-sm capitalize">
                      {muscleGroup}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button 
              onClick={generateWorkout} 
              disabled={loading || preferences.availableEquipment.length === 0}
              size="lg"
              className="w-full max-w-md"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Workout...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-5 w-5" />
                  Generate AI Workout
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="workout" className="space-y-6">
          {generatedWorkout && (
            <>
              {/* Workout Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      {generatedWorkout.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-green-600">
                      {Math.round(generatedWorkout.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-bold">{generatedWorkout.estimatedDuration}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Minutes</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Zap className={`h-4 w-4 ${getIntensityColor(generatedWorkout.targetIntensity)}`} />
                        <span className="text-lg font-bold">{generatedWorkout.targetIntensity}/10</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{getIntensityLabel(generatedWorkout.targetIntensity)}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-bold">{generatedWorkout.exercises.length}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Exercises</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-bold">{Math.round(generatedWorkout.metadata.totalVolume)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Volume</p>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">AI Reasoning:</h4>
                    {generatedWorkout.reasoning.map((reason, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Brain className="h-4 w-4 text-primary mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Exercise List */}
              <Card>
                <CardHeader>
                  <CardTitle>Exercise Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generatedWorkout.exercises.map((exercise, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{exercise.exercise.name}</h4>
                          <Badge variant="outline">
                            {exercise.exercise.muscle_groups.join(', ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Sets:</span>
                            <span className="ml-2 font-medium">{exercise.targetSets}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reps:</span>
                            <span className="ml-2 font-medium">{exercise.targetReps}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">RPE:</span>
                            <span className="ml-2 font-medium">{Math.round(exercise.targetRPE * 10) / 10}/10</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rest:</span>
                            <span className="ml-2 font-medium">{Math.round(exercise.restTime / 60)}min</span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground">{exercise.exercise.instructions}</p>

                        {exercise.notes && (
                          <div className="bg-muted p-2 rounded text-sm">
                            <strong>Note:</strong> {exercise.notes}
                          </div>
                        )}

                        {exercise.alternatives.length > 0 && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-primary">Alternative Exercises</summary>
                            <div className="mt-2 space-y-1">
                              {exercise.alternatives.map((alt, altIndex) => (
                                <div key={altIndex} className="flex items-center justify-between pl-4">
                                  <span>{alt.exercise.name}</span>
                                  <Badge variant="outline" className="text-xs">{alt.reason}</Badge>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Adaptations */}
              {(generatedWorkout.adaptations.readinessAdjustments.length > 0 ||
                generatedWorkout.adaptations.equipmentSubstitutions.length > 0 ||
                generatedWorkout.adaptations.progressiveOverload.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-primary" />
                      AI Adaptations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {generatedWorkout.adaptations.readinessAdjustments.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Readiness Adjustments:</h4>
                          {generatedWorkout.adaptations.readinessAdjustments.map((adjustment, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <Zap className="h-4 w-4 text-yellow-500 mt-0.5" />
                              <span>{adjustment}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {generatedWorkout.adaptations.equipmentSubstitutions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Equipment Substitutions:</h4>
                          {generatedWorkout.adaptations.equipmentSubstitutions.map((substitution, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <Settings className="h-4 w-4 text-blue-500 mt-0.5" />
                              <span>{substitution}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {generatedWorkout.adaptations.progressiveOverload.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Progressive Overload:</h4>
                          {generatedWorkout.adaptations.progressiveOverload.map((overload, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <Target className="h-4 w-4 text-green-500 mt-0.5" />
                              <span>{overload}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button onClick={() => generateWorkout()} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate New
                </Button>
                <Button>
                  <Play className="mr-2 h-4 w-4" />
                  Start Workout
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIWorkoutGenerator;