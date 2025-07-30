import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Calendar, TrendingUp, Target } from 'lucide-react';
import WorkoutLibrary from '@/components/WorkoutLibrary';
import ActiveWorkout from '@/components/ActiveWorkout';
import { useAuth } from '@/contexts/AuthContext';

export default function WorkoutPage() {
  const [activeView, setActiveView] = useState<'library' | 'active'>('library');
  const [selectedTemplate, setSelectedTemplate] = useState<{id: string, name: string} | null>(null);
  const { user } = useAuth();

  // Mock recent workouts data
  const recentWorkouts = [
    {
      id: '1',
      name: 'Upper Body Strength',
      date: '2024-01-15',
      duration: 45,
      volume: 12500,
      exercises: 5
    },
    {
      id: '2', 
      name: 'Lower Body Power',
      date: '2024-01-13',
      duration: 52,
      volume: 18200,
      exercises: 4
    },
    {
      id: '3',
      name: 'Full Body Circuit',
      date: '2024-01-11',
      duration: 38,
      volume: 8900,
      exercises: 8
    }
  ];

  const handleStartWorkout = (templateId?: string, templateName?: string) => {
    setSelectedTemplate(templateId && templateName ? { id: templateId, name: templateName } : null);
    setActiveView('active');
  };

  const handleWorkoutComplete = () => {
    setActiveView('library');
    setSelectedTemplate(null);
  };

  if (activeView === 'active') {
    return (
      <div className="container mx-auto p-6">
        <ActiveWorkout
          templateId={selectedTemplate?.id}
          templateName={selectedTemplate?.name}
          onComplete={handleWorkoutComplete}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="library" className="space-y-6">
        <TabsList>
          <TabsTrigger value="library">Workout Library</TabsTrigger>
          <TabsTrigger value="quick-start">Quick Start</TabsTrigger>
          <TabsTrigger value="history">Recent Workouts</TabsTrigger>
        </TabsList>

        <TabsContent value="library">
          <WorkoutLibrary />
        </TabsContent>

        <TabsContent value="quick-start" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleStartWorkout()}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Empty Workout
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Start a blank workout and add exercises as you go.
                </p>
                <Button className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Start Now
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleStartWorkout('quick-upper', 'Quick Upper Body')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Quick Upper Body
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  30-minute upper body strength workout.
                </p>
                <div className="flex justify-between text-xs text-muted-foreground mb-4">
                  <span>4 exercises</span>
                  <span>~30 minutes</span>
                </div>
                <Button className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Start Workout
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleStartWorkout('quick-lower', 'Quick Lower Body')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Quick Lower Body
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  35-minute lower body strength workout.
                </p>
                <div className="flex justify-between text-xs text-muted-foreground mb-4">
                  <span>5 exercises</span>
                  <span>~35 minutes</span>
                </div>
                <Button className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Start Workout
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentWorkouts.map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{workout.name}</h4>
                        <Badge variant="secondary">{workout.exercises} exercises</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(workout.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {workout.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {workout.volume.toLocaleString()} lbs
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Repeat Workout
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}