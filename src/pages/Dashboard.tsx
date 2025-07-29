import { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  Zap, 
  Heart,
  Moon,
  Dumbbell,
  Play,
  CheckCircle2,
  Timer,
  Weight,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TodayStats {
  readinessScore: number;
  sleepHours: number;
  energyLevel: number;
  workoutScheduled: boolean;
  workoutType: string;
}

export default function Dashboard() {
  const [todayStats] = useState<TodayStats>({
    readinessScore: 8.2,
    sleepHours: 7.2,
    energyLevel: 8,
    workoutScheduled: true,
    workoutType: 'Upper Power'
  });

  const getReadinessColor = (score: number) => {
    if (score >= 8) return 'text-success';
    if (score >= 6) return 'text-warning';
    return 'text-destructive';
  };

  const getReadinessMessage = (score: number) => {
    if (score >= 8) return 'Excellent! Full intensity training recommended.';
    if (score >= 6) return 'Good. Consider moderate intensity today.';
    return 'Poor. Consider rest or light activity.';
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Good Morning, Pedro
        </h1>
        <p className="text-muted-foreground">
          Let's make today count towards your 80kg goal
        </p>
      </div>

      {/* Readiness Score */}
      <Card className="bg-gradient-subtle border-0 shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Training Readiness
            </CardTitle>
            <Badge variant="secondary" className="font-medium">
              Today
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-8 border-muted flex items-center justify-center">
                <div className="text-center">
                  <div className={cn("text-2xl font-bold", getReadinessColor(todayStats.readinessScore))}>
                    {todayStats.readinessScore}
                  </div>
                  <div className="text-xs text-muted-foreground">/ 10</div>
                </div>
              </div>
              <div 
                className={cn(
                  "absolute inset-0 rounded-full border-8 border-transparent",
                  todayStats.readinessScore >= 8 ? "border-t-success border-r-success" :
                  todayStats.readinessScore >= 6 ? "border-t-warning border-r-warning" :
                  "border-t-destructive"
                )}
                style={{
                  transform: `rotate(${(todayStats.readinessScore / 10) * 360 - 90}deg)`
                }}
              />
            </div>
          </div>
          <p className={cn(
            "text-center text-sm font-medium",
            getReadinessColor(todayStats.readinessScore)
          )}>
            {getReadinessMessage(todayStats.readinessScore)}
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Moon className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{todayStats.sleepHours}h</div>
            <p className="text-xs text-muted-foreground">Sleep Duration</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <Zap className="h-8 w-8 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold">{todayStats.energyLevel}/10</div>
            <p className="text-xs text-muted-foreground">Energy Level</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <Weight className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold">75.2</div>
            <p className="text-xs text-muted-foreground">kg Current</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">kg To Goal</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      <Card className="shadow-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Today's Workout
            </CardTitle>
            <Badge className="bg-gradient-primary text-primary-foreground">
              Week 12
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{todayStats.workoutType}</h3>
              <p className="text-sm text-muted-foreground">Power Phase • 4-6 reps • 75-85% 1RM</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                45-50 min
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" />
                5 exercises
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>0/5 exercises</span>
            </div>
            <Progress value={0} className="h-2" />
          </div>
          
          <Button className="w-full bg-gradient-primary hover:bg-primary/90 shadow-primary" size="lg">
            <Play className="h-5 w-5 mr-2" />
            Start Workout
          </Button>
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const isToday = index === 2; // Wednesday
              const isCompleted = index < 2;
              const isRest = index === 2 || index === 6;
              
              return (
                <div key={day} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{day}</div>
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mx-auto",
                      isToday ? "bg-gradient-primary text-primary-foreground" :
                      isCompleted ? "bg-success text-success-foreground" :
                      isRest ? "bg-muted text-muted-foreground" :
                      "border-2 border-muted"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isRest ? (
                      'R'
                    ) : (
                      index + 1
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Weekly Consistency</span>
              <span>2/5 workouts completed</span>
            </div>
            <Progress value={40} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Weight</p>
              <p className="text-2xl font-bold">75.2 kg</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Target Weight</p>
              <p className="text-2xl font-bold">80.0 kg</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Goal</span>
              <span>44% complete</span>
            </div>
            <Progress value={44} className="h-3" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="text-center">
              <p className="text-lg font-bold text-success">+2.2</p>
              <p className="text-xs text-muted-foreground">kg gained</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">12</p>
              <p className="text-xs text-muted-foreground">weeks elapsed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-accent">~8</p>
              <p className="text-xs text-muted-foreground">weeks to goal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Coach Insight */}
      <Card className="bg-gradient-accent text-accent-foreground border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Coach Alpha's Insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">
            "Excellent progress, Pedro! Your consistency is paying off. Today's power session 
            will build on last week's strength gains. Focus on controlled eccentrics 
            and maintain perfect form. Your sleep quality is good - keep it up!"
          </p>
        </CardContent>
      </Card>
    </div>
  );
}