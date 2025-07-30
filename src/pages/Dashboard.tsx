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
  Activity,
  Brain
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReadinessTracker from '@/components/ReadinessTracker';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { AICoachPanel } from '@/components/AICoachPanel';
import { AICoachBadge } from '@/components/AICoachBadge';
import { CoachingFloatingButton } from '@/components/CoachingFloatingButton';

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Mock data for AI Coach components
  const mockInsights = [
    {
      id: '1',
      title: 'Strength Progress Detected',
      message: 'Your squat performance has improved 15% over the last month. Consider increasing intensity.',
      type: 'progress' as const,
      category: 'suggestion' as const,
      priority: 'medium' as const,
      confidence: 0.87,
      timestamp: new Date().toISOString(),
      evidence: ['15% strength increase in squats', '3 consecutive PRs'],
      actions: [
        { label: 'View Details', action: 'view_progress', data: { exercise: 'squat' } },
        { label: 'Adjust Program', action: 'modify_program', data: { type: 'intensity' } }
      ]
    }
  ];

  const handleDismissInsight = (id: string) => {
    console.log('Dismissing insight:', id);
  };

  const handleActionClick = (action: string, data?: any) => {
    console.log('Action clicked:', action, data);
  };

  const handleGuidanceRequest = () => {
    console.log('Guidance requested');
  };

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
        <div className="flex items-center gap-3">
          <AICoachBadge status="ready" insightCount={1} />
          <Link to="/workout">
            <Button size="lg">
              <Play className="mr-2 h-5 w-5" />
              Start Workout
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="coach" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Coach
          </TabsTrigger>
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

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Progress Score</span>
                      <span className="text-2xl font-bold text-primary">78%</span>
                    </div>
                    <Progress value={78} className="h-3" />
                    
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-lg font-bold">2</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Improving</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-yellow-600">
                          <Target className="h-4 w-4" />
                          <span className="text-lg font-bold">1</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Stable</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-red-600">
                          <TrendingUp className="h-4 w-4 rotate-180" />
                          <span className="text-lg font-bold">1</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Declining</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Link to="/analytics">
                <Button className="w-full">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Full Analytics
                </Button>
              </Link>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Recent Achievement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">New Bench Press PR!</h4>
                      <p className="text-sm text-muted-foreground">
                        Hit a new personal record of 185lbs
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Rare Achievement
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coach" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AICoachPanel 
              insights={mockInsights}
              onDismissInsight={handleDismissInsight}
              onActionClick={handleActionClick}
            />
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Coaching Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data Collection</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pattern Recognition</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Learning
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Recommendations</span>
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        Ready
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <CoachingFloatingButton 
        coaching={null}
        onGuidanceRequest={handleGuidanceRequest}
      />
    </div>
  );
}