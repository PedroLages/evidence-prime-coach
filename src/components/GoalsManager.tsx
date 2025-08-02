import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Trophy, 
  Calendar,
  TrendingUp,
  Weight,
  Dumbbell,
  Heart,
  Timer,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGoals } from '@/hooks/useGoals';
import { Goal } from '@/services/database';

// Interface moved to database.ts - using import instead

const goalCategories = [
  { id: 'strength', label: 'Strength', icon: Dumbbell, color: 'bg-red-500' },
  { id: 'muscle_gain', label: 'Muscle Gain', icon: TrendingUp, color: 'bg-blue-500' },
  { id: 'weight_loss', label: 'Weight Loss', icon: Weight, color: 'bg-green-500' },
  { id: 'endurance', label: 'Endurance', icon: Heart, color: 'bg-purple-500' },
  { id: 'health', label: 'Health', icon: Target, color: 'bg-orange-500' },
  { id: 'skill', label: 'Skill', icon: Trophy, color: 'bg-yellow-500' }
];

const goalTemplates = {
  strength: [
    { title: 'Bench Press 1RM', unit: 'kg', description: 'Increase bench press one-rep max' },
    { title: 'Squat 1RM', unit: 'kg', description: 'Increase squat one-rep max' },
    { title: 'Deadlift 1RM', unit: 'kg', description: 'Increase deadlift one-rep max' },
    { title: 'Pull-ups', unit: 'reps', description: 'Consecutive pull-ups without assistance' }
  ],
  muscle_gain: [
    { title: 'Lean Body Mass', unit: 'kg', description: 'Gain lean muscle mass' },
    { title: 'Arm Circumference', unit: 'cm', description: 'Increase arm size' },
    { title: 'Chest Circumference', unit: 'cm', description: 'Increase chest size' }
  ],
  weight_loss: [
    { title: 'Body Weight', unit: 'kg', description: 'Reach target body weight' },
    { title: 'Body Fat %', unit: '%', description: 'Reduce body fat percentage' },
    { title: 'Waist Circumference', unit: 'cm', description: 'Reduce waist measurement' }
  ],
  endurance: [
    { title: '5K Run Time', unit: 'minutes', description: 'Improve 5K running time' },
    { title: 'Max Push-ups', unit: 'reps', description: 'Maximum push-ups in one set' },
    { title: 'Plank Hold', unit: 'seconds', description: 'Maximum plank hold time' }
  ],
  health: [
    { title: 'Resting Heart Rate', unit: 'bpm', description: 'Lower resting heart rate' },
    { title: 'Sleep Quality', unit: 'hours', description: 'Consistent quality sleep' },
    { title: 'Workout Frequency', unit: 'days/week', description: 'Maintain workout consistency' }
  ],
  skill: [
    { title: 'Handstand Hold', unit: 'seconds', description: 'Freestanding handstand duration' },
    { title: 'Pistol Squats', unit: 'reps', description: 'Single-leg pistol squats per leg' },
    { title: 'Muscle-up', unit: 'reps', description: 'Strict muscle-ups' }
  ]
};

export default function GoalsManager() {
  const {
    goals,
    goalStats,
    loading,
    error,
    createGoal: createNewGoal,
    updateGoal: updateExistingGoal,
    deleteGoal: deleteExistingGoal,
    addProgress
  } = useGoals();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const createGoal = async (goalData: Partial<Goal>) => {
    try {
      await createNewGoal({
        title: goalData.title || '',
        description: goalData.description || null,
        category: goalData.category as Goal['category'] || 'strength',
        target_value: goalData.target_value || 0,
        current_value: goalData.current_value || 0,
        unit: goalData.unit || '',
        target_date: goalData.target_date || null,
        priority: goalData.priority || 'medium'
      });
      
      toast({
        title: "Goal created",
        description: `${goalData.title} has been added to your goals.`
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      await updateExistingGoal(goalId, updates);
      
      toast({
        title: "Goal updated",
        description: "Your goal has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateGoalProgress = async (goalId: string, newValue: number, notes?: string) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const wasCompleted = goal.current_value >= goal.target_value;
      const isNowCompleted = newValue >= goal.target_value;

      // Add progress entry
      await addProgress(goalId, newValue, undefined, notes);

      if (!wasCompleted && isNowCompleted) {
        toast({
          title: "🎉 Goal Achieved!",
          description: `Congratulations! You've reached your goal: ${goal.title}`,
        });
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      await deleteExistingGoal(goalId);
      
      toast({
        title: "Goal deleted",
        description: "Goal has been removed from your list."
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: Goal['category']) => {
    const categoryData = goalCategories.find(c => c.id === category);
    return categoryData?.icon || Target;
  };

  const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'paused');
  const completedGoals = goals.filter(g => g.status === 'completed');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading your goals...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error loading goals</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Goals Manager
          </h2>
          <p className="text-muted-foreground">
            Track your progress and achieve your fitness goals
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <GoalForm 
              onSubmit={(data) => {
                createGoal(data);
                setIsCreateDialogOpen(false);
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Goals</p>
                <p className="text-2xl font-bold">{goalStats.active}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{goalStats.completed}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round(goalStats.completionRate)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdateProgress={updateGoalProgress}
                onEdit={setEditingGoal}
                onDelete={deleteGoal}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              Completed Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdateProgress={updateGoalProgress}
                onEdit={setEditingGoal}
                onDelete={deleteGoal}
                readOnly
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first fitness goal to track your progress
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Goal Dialog */}
      {editingGoal && (
        <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Goal</DialogTitle>
            </DialogHeader>
            <GoalForm 
              goal={editingGoal}
              onSubmit={(data) => {
                updateGoal(editingGoal.id, data);
                setEditingGoal(null);
              }}
              onCancel={() => setEditingGoal(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Goal Card Component
interface GoalCardProps {
  goal: Goal;
  onUpdateProgress: (goalId: string, value: number, notes?: string) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  readOnly?: boolean;
}

function GoalCard({ goal, onUpdateProgress, onEdit, onDelete, readOnly = false }: GoalCardProps) {
  const [progressInput, setProgressInput] = useState(goal.current_value.toString());
  const [progressNotes, setProgressNotes] = useState('');
  
  const getCategoryIcon = (category: Goal['category']) => {
    const categoryData = goalCategories.find(c => c.id === category);
    return categoryData?.icon || Target;
  };
  
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };
  
  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const CategoryIcon = getCategoryIcon(goal.category);
  const progressPercentage = getProgressPercentage(goal.current_value, goal.target_value);

  const handleProgressUpdate = () => {
    const newValue = parseFloat(progressInput);
    if (!isNaN(newValue)) {
      onUpdateProgress(goal.id, newValue, progressNotes || undefined);
      setProgressNotes(''); // Clear notes after update
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${goalCategories.find(c => c.id === goal.category)?.color} text-white`}>
            <CategoryIcon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-semibold">{goal.title}</h4>
            <p className="text-sm text-muted-foreground">{goal.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(goal.status)}>
            {goal.status}
          </Badge>
          {!readOnly && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onEdit(goal)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(goal.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="text-xs text-muted-foreground">
          {Math.round(progressPercentage)}% complete
        </div>
      </div>

      {!readOnly && goal.status !== 'completed' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={progressInput}
              onChange={(e) => setProgressInput(e.target.value)}
              placeholder="Update progress"
              className="flex-1"
            />
            <Button size="sm" onClick={handleProgressUpdate}>
              Update
            </Button>
          </div>
          <Input
            value={progressNotes}
            onChange={(e) => setProgressNotes(e.target.value)}
            placeholder="Add notes (optional)"
            className="text-sm"
          />
        </div>
      )}

      {goal.target_date && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Target: {new Date(goal.target_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

// Goal Form Component
interface GoalFormProps {
  goal?: Goal;
  onSubmit: (data: Partial<Goal>) => void;
  onCancel: () => void;
}

function GoalForm({ goal, onSubmit, onCancel }: GoalFormProps) {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    category: goal?.category || 'strength',
    target_value: goal?.target_value?.toString() || '',
    current_value: goal?.current_value?.toString() || '0',
    unit: goal?.unit || '',
    target_date: goal?.target_date?.split('T')[0] || '',
    priority: goal?.priority || 'medium'
  });

  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleTemplateSelect = (template: any) => {
    setFormData(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      unit: template.unit
    }));
    setSelectedTemplate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.target_value || !formData.unit) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    onSubmit({
      ...formData,
      target_value: parseFloat(formData.target_value),
      current_value: parseFloat(formData.current_value)
    });
  };

  const templates = goalTemplates[formData.category as keyof typeof goalTemplates] || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Goal Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter goal title"
          />
        </div>
        
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value: Goal['category']) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {goalCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {templates.length > 0 && (
        <div>
          <Label>Quick Templates</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {templates.map((template, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTemplateSelect(template)}
                className="justify-start"
              >
                {template.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your goal"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="target_value">Target Value *</Label>
          <Input
            id="target_value"
            type="number"
            value={formData.target_value}
            onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
            placeholder="100"
          />
        </div>
        
        <div>
          <Label htmlFor="current_value">Current Value</Label>
          <Input
            id="current_value"
            type="number"
            value={formData.current_value}
            onChange={(e) => setFormData(prev => ({ ...prev, current_value: e.target.value }))}
            placeholder="0"
          />
        </div>
        
        <div>
          <Label htmlFor="unit">Unit *</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
            placeholder="kg, reps, minutes"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="target_date">Target Date</Label>
          <Input
            id="target_date"
            type="date"
            value={formData.target_date}
            onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
          />
        </div>
        
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value: Goal['priority']) => setFormData(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {goal ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
}