import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Zap, 
  Play,
  Clock,
  Award,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReadinessTracker from '@/components/ReadinessTracker';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  // Mock data - replace with real data from your API
  const weeklyGoal = {
    target: 4,
    completed: 2,
    percentage: 50
  };

  const recentWorkouts = [
    {
      id: '1',
      name: 'Upper Body Strength',
      date: '2024-01-15',
      duration: 45,
      exercises: 5
    },
    {
      id: '2',
      name: 'Lower Body Power', 
      date: '2024-01-13',
      duration: 52,
      exercises: 4
    }
  ];

  const quickActions = [
    {
      title: 'Start Quick Workout',
      description: 'Begin a pre-designed workout',
      icon: Play,
      href: '/workout',
      color: 'text-green-600'
    },
    {
      title: 'View Progress',
      description: 'Check your fitness analytics',
      icon: TrendingUp,
      href: '/progress',
      color: 'text-blue-600'
    },
    {
      title: 'Schedule Workout',
      description: 'Plan your next session',
      icon: Calendar,
      href: '/calendar',
      color: 'text-purple-600'
    }
  ];


  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Ready to crush your fitness goals today?
          </p>
        </div>
        <Link to="/workout">
          <Button size="lg">
            <Play className="mr-2 h-5 w-5" />
            Start Workout
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.title} to={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <IconComponent className={`h-8 w-8 ${action.color}`} />
                        <div>
                          <h3 className="font-medium">{action.title}</h3>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Weekly Goal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Weekly Workout Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Progress this week</span>
                  <span className="font-medium">
                    {weeklyGoal.completed}/{weeklyGoal.target} workouts
                  </span>
                </div>
                <Progress value={weeklyGoal.percentage} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{weeklyGoal.percentage}% complete</span>
                  <span>{weeklyGoal.target - weeklyGoal.completed} workouts remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Workouts
                </CardTitle>
                <Link to="/workout">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentWorkouts.map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{workout.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{new Date(workout.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {workout.duration} min
                        </span>
                        <span>{workout.exercises} exercises</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Play className="h-3 w-3 mr-1" />
                      Repeat
                    </Button>
                  </div>
                ))}
                {recentWorkouts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent workouts. Start your first workout today!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readiness">
          <ReadinessTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}