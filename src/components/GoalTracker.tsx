import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Target, Plus, Calendar as CalendarIcon, Trash2, Edit, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  title: string;
  type: 'strength' | 'weight' | 'endurance' | 'habit';
  current: number;
  target: number;
  unit: string;
  deadline: Date;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  notes?: string;
}

export const GoalTracker: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Bench Press 300lbs',
      type: 'strength',
      current: 225,
      target: 300,
      unit: 'lbs',
      deadline: new Date('2024-06-01'),
      status: 'active',
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      title: 'Lose Weight',
      type: 'weight',
      current: 195,
      target: 180,
      unit: 'lbs',
      deadline: new Date('2024-05-01'),
      status: 'active',
      createdAt: new Date('2024-01-15')
    },
    {
      id: '3',
      title: 'Run 5K under 25 minutes',
      type: 'endurance',
      current: 28,
      target: 25,
      unit: 'minutes',
      deadline: new Date('2024-04-01'),
      status: 'active',
      createdAt: new Date('2024-02-01')
    }
  ]);

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    type: 'strength' as Goal['type'],
    current: 0,
    target: 0,
    unit: '',
    deadline: new Date(),
    notes: ''
  });

  const calculateProgress = (goal: Goal) => {
    if (goal.type === 'weight' && goal.current > goal.target) {
      return Math.max(0, Math.min(100, ((goal.current - goal.target) / (goal.current - goal.target + 50)) * 100));
    }
    return Math.max(0, Math.min(100, (goal.current / goal.target) * 100));
  };

  const getDaysRemaining = (deadline: Date) => {
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (goal: Goal) => {
    const daysRemaining = getDaysRemaining(goal.deadline);
    const progress = calculateProgress(goal);
    
    if (goal.status === 'completed') return 'bg-green-500';
    if (progress >= 100) return 'bg-green-500';
    if (daysRemaining < 0) return 'bg-red-500';
    if (daysRemaining < 7) return 'bg-orange-500';
    if (progress >= 75) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const addGoal = () => {
    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      type: newGoal.type,
      current: newGoal.current,
      target: newGoal.target,
      unit: newGoal.unit,
      deadline: newGoal.deadline,
      status: 'active',
      createdAt: new Date(),
      notes: newGoal.notes
    };
    
    setGoals([...goals, goal]);
    setNewGoal({
      title: '',
      type: 'strength',
      current: 0,
      target: 0,
      unit: '',
      deadline: new Date(),
      notes: ''
    });
    setIsAddingGoal(false);
  };

  const updateGoalProgress = (goalId: string, newCurrent: number) => {
    setGoals(goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, current: newCurrent, status: newCurrent >= goal.target ? 'completed' : 'active' }
        : goal
    ));
  };

  const deleteGoal = (goalId: string) => {
    setGoals(goals.filter(goal => goal.id !== goalId));
  };

  const activeGoals = goals.filter(goal => goal.status === 'active');
  const completedGoals = goals.filter(goal => goal.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Goal Tracker</h2>
          <p className="text-muted-foreground">Set and track your fitness goals</p>
        </div>
        <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Goal</DialogTitle>
              <DialogDescription>
                Set a new fitness goal to track your progress
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g., Bench Press 300lbs"
                />
              </div>
              <div>
                <Label htmlFor="type">Goal Type</Label>
                <Select value={newGoal.type} onValueChange={(value) => setNewGoal({ ...newGoal, type: value as Goal['type'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="weight">Weight</SelectItem>
                    <SelectItem value="endurance">Endurance</SelectItem>
                    <SelectItem value="habit">Habit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="current">Current</Label>
                  <Input
                    id="current"
                    type="number"
                    value={newGoal.current}
                    onChange={(e) => setNewGoal({ ...newGoal, current: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    type="number"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    placeholder="lbs, kg, minutes..."
                  />
                </div>
              </div>
              <div>
                <Label>Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newGoal.deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newGoal.deadline ? format(newGoal.deadline, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newGoal.deadline}
                      onSelect={(date) => date && setNewGoal({ ...newGoal, deadline: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={addGoal} className="w-full">
                Add Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Active Goals ({activeGoals.length})</h3>
        <div className="grid gap-4">
          {activeGoals.map((goal) => {
            const progress = calculateProgress(goal);
            const daysRemaining = getDaysRemaining(goal.deadline);
            
            return (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full", getStatusColor(goal))} />
                      <div>
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <CardDescription>
                          {goal.current} / {goal.target} {goal.unit}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={daysRemaining < 0 ? "destructive" : daysRemaining < 7 ? "secondary" : "outline"}>
                        {daysRemaining < 0 ? "Overdue" : `${daysRemaining} days left`}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`update-${goal.id}`}>Update Progress:</Label>
                      <Input
                        id={`update-${goal.id}`}
                        type="number"
                        value={goal.current}
                        onChange={(e) => updateGoalProgress(goal.id, parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">{goal.unit}</span>
                      {progress >= 100 && (
                        <Badge variant="default" className="ml-auto">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed!
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Completed Goals ({completedGoals.length})</h3>
          <div className="grid gap-4">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <CardDescription>
                        Completed: {goal.current} {goal.unit}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};