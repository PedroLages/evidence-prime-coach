import { useState } from 'react';
import { 
  User, 
  Settings, 
  Target, 
  Calendar,
  TrendingUp,
  Award,
  Edit,
  Save,
  X,
  Bell,
  Moon,
  Sun
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Pedro',
    age: 44,
    height: 187, // cm
    currentWeight: 75.2,
    targetWeight: 80,
    trainingExperience: 'Intermediate',
    maxWorkoutDays: 5,
    sleepTarget: 7
  });

  const [preferences, setPreferences] = useState({
    notifications: true,
    autoProgression: true,
    darkMode: false,
    units: 'metric'
  });

  const achievements = [
    { title: 'First Month Complete', description: 'Completed your first 30 days', date: '2 months ago' },
    { title: 'Consistency Champion', description: '4 weeks without missing a workout', date: '1 month ago' },
    { title: 'Strength Milestone', description: 'Bench pressed 75kg for the first time', date: '3 weeks ago' },
    { title: 'Weight Goal Progress', description: 'Reached 75kg milestone', date: '1 week ago' }
  ];

  const saveProfile = () => {
    setIsEditing(false);
    // Save profile logic here
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <Avatar className="w-24 h-24 mx-auto">
          <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
            P
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <p className="text-muted-foreground">Evidence-Based Training Journey</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="achievements">Awards</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <Button
                  variant={isEditing ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile(prev => ({ ...prev, age: Number(e.target.value) }))}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={profile.height}
                    onChange={(e) => setProfile(prev => ({ ...prev, height: Number(e.target.value) }))}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="experience">Training Experience</Label>
                  <Input
                    id="experience"
                    value={profile.trainingExperience}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              {isEditing && (
                <Button onClick={saveProfile} className="w-full bg-gradient-primary">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Current Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Current Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Weight</p>
                  <p className="text-2xl font-bold">{profile.currentWeight} kg</p>
                </div>
                <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                  <p className="text-sm text-muted-foreground">Target Weight</p>
                  <p className="text-2xl font-bold">{profile.targetWeight} kg</p>
                </div>
                <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                  <p className="text-sm text-muted-foreground">BMI</p>
                  <p className="text-2xl font-bold">{((profile.currentWeight / (profile.height/100))**2).toFixed(1)}</p>
                </div>
                <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                  <p className="text-sm text-muted-foreground">Training Days</p>
                  <p className="text-2xl font-bold">{profile.maxWorkoutDays}/week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Training Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Primary Goal: Muscle Gain</h4>
                    <Badge className="bg-gradient-primary text-primary-foreground">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Gain lean muscle mass while maintaining body composition
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>2.2kg / 7.0kg gained</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-primary h-2 rounded-full" style={{ width: '31%' }} />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Strength Milestone</h4>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Reach intermediate strength standards for age group
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Bench: 77.5kg / 80kg</div>
                    <div>Squat: 95kg / 100kg</div>
                    <div>Deadlift: 120kg / 125kg</div>
                    <div>OHP: 55kg / 60kg</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{achievement.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                App Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive workout reminders and progress updates
                  </p>
                </div>
                <Switch 
                  checked={preferences.notifications}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, notifications: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Progression</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically increase weights based on performance
                  </p>
                </div>
                <Switch 
                  checked={preferences.autoProgression}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, autoProgression: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    {preferences.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    Dark Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch 
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, darkMode: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Export Progress Data
                </Button>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Export Workout Logs
                </Button>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  All your workout data is stored locally and can be exported at any time. 
                  Your privacy is our priority.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}