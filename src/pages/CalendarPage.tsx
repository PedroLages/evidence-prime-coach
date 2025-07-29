import { useState } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2,
  Circle,
  Target,
  Dumbbell,
  Heart,
  Moon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CalendarDay {
  date: number;
  workoutType?: string;
  completed: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Mock calendar data
  const generateCalendarDays = (): CalendarDay[] => {
    const today = new Date();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const workoutSchedule = ['Upper Power', 'Lower Power', 'Rest', 'Upper Hypertrophy', 'Lower Hypertrophy', 'Arms', 'Rest'];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
      const isToday = date.toDateString() === today.toDateString();
      const workoutIndex = date.getDay();
      const workoutType = workoutSchedule[workoutIndex];
      const completed = date < today && workoutType !== 'Rest';
      
      days.push({
        date: date.getDate(),
        workoutType: workoutType === 'Rest' ? undefined : workoutType,
        completed,
        isToday,
        isCurrentMonth
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getWorkoutIcon = (workoutType: string) => {
    if (workoutType.includes('Power')) return Dumbbell;
    if (workoutType.includes('Hypertrophy')) return Target;
    if (workoutType.includes('Arms')) return Heart;
    return Circle;
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Training Calendar
        </h1>
        <p className="text-muted-foreground">
          Track your workout schedule and progress
        </p>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
            
            {calendarDays.map((day, index) => {
              const WorkoutIcon = day.workoutType ? getWorkoutIcon(day.workoutType) : Moon;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "relative p-2 text-center border rounded-lg transition-colors cursor-pointer",
                    day.isCurrentMonth ? "border-border" : "border-transparent",
                    day.isToday ? "bg-gradient-primary text-primary-foreground" : "",
                    !day.isCurrentMonth ? "text-muted-foreground/50" : "",
                    day.completed && !day.isToday ? "bg-success/10 border-success/20" : ""
                  )}
                >
                  <div className="text-sm font-medium">{day.date}</div>
                  
                  {day.workoutType && day.isCurrentMonth && (
                    <div className="flex items-center justify-center mt-1">
                      {day.completed ? (
                        <CheckCircle2 className="h-3 w-3 text-success" />
                      ) : (
                        <WorkoutIcon className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  
                  {!day.workoutType && day.isCurrentMonth && (
                    <div className="flex items-center justify-center mt-1">
                      <Moon className="h-3 w-3 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-sm">Power Days</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              <span className="text-sm">Hypertrophy</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-warning" />
              <span className="text-sm">Arms/Weak Points</span>
            </div>
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Rest Days</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { day: 'Monday', workout: 'Upper Power', description: '4-6 reps • 75-85% 1RM' },
              { day: 'Tuesday', workout: 'Lower Power', description: '4-6 reps • 75-85% 1RM' },
              { day: 'Wednesday', workout: 'Rest Day', description: 'Active recovery • Light cardio optional' },
              { day: 'Thursday', workout: 'Upper Hypertrophy', description: '8-12 reps • 65-75% 1RM' },
              { day: 'Friday', workout: 'Lower Hypertrophy', description: '8-12 reps • 65-75% 1RM' },
              { day: 'Saturday', workout: 'Arms & Weak Points', description: '15-20 reps • 60-70% 1RM' },
              { day: 'Sunday', workout: 'Rest Day', description: 'Complete rest • Focus on recovery' }
            ].map((schedule, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    schedule.workout.includes('Rest') ? "bg-muted" : "bg-gradient-primary"
                  )}>
                    {schedule.workout.includes('Rest') ? (
                      <Moon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Dumbbell className="h-5 w-5 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{schedule.day}</h4>
                    <p className="text-sm text-muted-foreground">{schedule.description}</p>
                  </div>
                </div>
                <Badge variant={schedule.workout.includes('Rest') ? 'secondary' : 'default'}>
                  {schedule.workout}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}