import { useState, useEffect } from 'react';
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
  Sun,
  Scale,
  Camera
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GoalsManager from '@/components/GoalsManager';
import BodyMeasurementTracker from '@/components/BodyMeasurementTracker';
import ProgressPhotoManager from '@/components/ProgressPhotoManager';
import { useProfile } from '@/hooks/useProfile';
import { updateProfile } from '@/services/database';
import { UnitSystem, convertWeight, convertHeight, getDefaultUnits, formatWeight, formatHeight, calculateBMI, validateWeight, validateHeight, decimalFeetToFeetInches, feetInchesToDecimalFeet } from '@/lib/units';
import { toast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { profile: dbProfile, loading, error, refetch } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    full_name: '',
    age: null as number | null,
    height: null as number | null,
    weight: null as number | null,
    target_weight: null as number | null,
    unit_system: 'metric' as UnitSystem,
    fitness_level: 'beginner',
    experience_level: 'beginner'
  });
  
  const [heightDisplay, setHeightDisplay] = useState({ feet: 0, inches: 0 });
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    notifications: true,
    autoProgression: false,
    darkMode: false
  });

  // Update local state when profile loads
  useEffect(() => {
    if (dbProfile) {
      const defaultUnits = getDefaultUnits(dbProfile.unit_system || 'metric');
      setEditedProfile({
        full_name: dbProfile.full_name || '',
        age: dbProfile.age,
        height: dbProfile.height,
        weight: dbProfile.weight,
        target_weight: dbProfile.target_weight,
        unit_system: dbProfile.unit_system || 'metric',
        fitness_level: dbProfile.fitness_level || 'beginner',
        experience_level: (dbProfile as any).experience_level || 'beginner'
      });
      
      // Set height display for imperial
      if (dbProfile.height && dbProfile.unit_system === 'imperial') {
        const { feet, inches } = decimalFeetToFeetInches(dbProfile.height);
        setHeightDisplay({ feet, inches });
      }
    }
  }, [dbProfile]);

  const currentUnits = getDefaultUnits(editedProfile.unit_system);
  const bmi = calculateBMI(editedProfile.weight, editedProfile.height, currentUnits.weightUnit, currentUnits.heightUnit);

  const achievements = [
    { title: 'First Month Complete', description: 'Completed your first 30 days', date: '2 months ago' },
    { title: 'Consistency Champion', description: '4 weeks without missing a workout', date: '1 month ago' },
    { title: 'Strength Milestone', description: 'Bench pressed 75kg for the first time', date: '3 weeks ago' },
    { title: 'Weight Goal Progress', description: 'Reached 75kg milestone', date: '1 week ago' }
  ];

  const handleUnitSystemChange = (newSystem: UnitSystem) => {
    if (!editedProfile.unit_system) return;
    
    const oldUnits = getDefaultUnits(editedProfile.unit_system);
    const newUnits = getDefaultUnits(newSystem);
    
    let newHeight = editedProfile.height;
    let newWeight = editedProfile.weight;
    let newTargetWeight = editedProfile.target_weight;
    
    // Convert existing values to new unit system
    if (editedProfile.height) {
      newHeight = convertHeight(editedProfile.height, oldUnits.heightUnit, newUnits.heightUnit);
    }
    if (editedProfile.weight) {
      newWeight = convertWeight(editedProfile.weight, oldUnits.weightUnit, newUnits.weightUnit);
    }
    if (editedProfile.target_weight) {
      newTargetWeight = convertWeight(editedProfile.target_weight, oldUnits.weightUnit, newUnits.weightUnit);
    }
    
    setEditedProfile(prev => ({
      ...prev,
      unit_system: newSystem,
      height: newHeight,
      weight: newWeight,
      target_weight: newTargetWeight
    }));
    
    // Update height display for imperial
    if (newSystem === 'imperial' && newHeight) {
      const { feet, inches } = decimalFeetToFeetInches(newHeight);
      setHeightDisplay({ feet, inches });
    }
  };

  const handleHeightChange = (value: number) => {
    setEditedProfile(prev => ({ ...prev, height: value }));
  };

  const handleImperialHeightChange = (feet: number, inches: number) => {
    const decimalFeet = feetInchesToDecimalFeet(feet, inches);
    setHeightDisplay({ feet, inches });
    setEditedProfile(prev => ({ ...prev, height: decimalFeet }));
  };

  const saveProfile = async () => {
    if (!dbProfile) return;
    
    try {
      setSaving(true);
      
      // Validate inputs
      if (editedProfile.weight && !validateWeight(editedProfile.weight, currentUnits.weightUnit)) {
        toast({
          title: "Invalid weight",
          description: `Please enter a valid weight between ${currentUnits.weightUnit === 'kg' ? '20-300 kg' : '44-660 lbs'}`,
          variant: "destructive"
        });
        return;
      }
      
      if (editedProfile.height && !validateHeight(editedProfile.height, currentUnits.heightUnit)) {
        toast({
          title: "Invalid height",
          description: `Please enter a valid height`,
          variant: "destructive"
        });
        return;
      }
      
      await updateProfile(dbProfile.id, {
        full_name: editedProfile.full_name,
        age: editedProfile.age,
        height: editedProfile.height,
        weight: editedProfile.weight,
        target_weight: editedProfile.target_weight,
        unit_system: editedProfile.unit_system,
        height_unit: currentUnits.heightUnit,
        weight_unit: currentUnits.weightUnit,
        fitness_level: editedProfile.fitness_level,
        experience_level: editedProfile.experience_level
      });
      
      await refetch();
      setIsEditing(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated."
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-destructive">Error loading profile: {error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <Avatar className="w-24 h-24 mx-auto">
          <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
            {editedProfile.full_name ? editedProfile.full_name.charAt(0).toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{editedProfile.full_name || 'User'}</h1>
          <p className="text-muted-foreground">Evidence-Based Training Journey</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="measurements">
            <Scale className="h-4 w-4 mr-1" />
            Measurements
          </TabsTrigger>
          <TabsTrigger value="photos">
            <Camera className="h-4 w-4 mr-1" />
            Photos
          </TabsTrigger>
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
            <CardContent className="space-y-6">
              {/* Unit System Toggle */}
              {isEditing && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Unit System</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose between metric (kg/cm) or imperial (lbs/in) units
                      </p>
                    </div>
                    <Select 
                      value={editedProfile.unit_system} 
                      onValueChange={(value: UnitSystem) => handleUnitSystemChange(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Metric</SelectItem>
                        <SelectItem value="imperial">Imperial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={editedProfile.full_name}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="13"
                    max="120"
                    value={editedProfile.age || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, age: e.target.value ? Number(e.target.value) : null }))}
                    disabled={!isEditing}
                    placeholder="Your age"
                  />
                </div>
                
                {/* Height Input - Different for Imperial vs Metric */}
                {editedProfile.unit_system === 'imperial' ? (
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          min="3"
                          max="8"
                          value={heightDisplay.feet || ''}
                          onChange={(e) => handleImperialHeightChange(Number(e.target.value) || 0, heightDisplay.inches)}
                          disabled={!isEditing}
                          placeholder="Feet"
                        />
                        <Label className="text-xs text-muted-foreground">Feet</Label>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          min="0"
                          max="11"
                          value={heightDisplay.inches || ''}
                          onChange={(e) => handleImperialHeightChange(heightDisplay.feet, Number(e.target.value) || 0)}
                          disabled={!isEditing}
                          placeholder="Inches"
                        />
                        <Label className="text-xs text-muted-foreground">Inches</Label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="100"
                      max="250"
                      value={editedProfile.height || ''}
                      onChange={(e) => handleHeightChange(Number(e.target.value) || 0)}
                      disabled={!isEditing}
                      placeholder="Height in centimeters"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Current Weight ({currentUnits.weightUnit})</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min={currentUnits.weightUnit === 'kg' ? '20' : '44'}
                    max={currentUnits.weightUnit === 'kg' ? '300' : '660'}
                    value={editedProfile.weight || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, weight: e.target.value ? Number(e.target.value) : null }))}
                    disabled={!isEditing}
                    placeholder={`Weight in ${currentUnits.weightUnit}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-weight">Target Weight ({currentUnits.weightUnit})</Label>
                  <Input
                    id="target-weight"
                    type="number"
                    step="0.1"
                    min={currentUnits.weightUnit === 'kg' ? '20' : '44'}
                    max={currentUnits.weightUnit === 'kg' ? '300' : '660'}
                    value={editedProfile.target_weight || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, target_weight: e.target.value ? Number(e.target.value) : null }))}
                    disabled={!isEditing}
                    placeholder={`Target weight in ${currentUnits.weightUnit}`}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fitness-level">Fitness Level</Label>
                  <Select 
                    value={editedProfile.fitness_level} 
                    onValueChange={(value) => setEditedProfile(prev => ({ ...prev, fitness_level: value }))}
                    disabled={!isEditing}
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
                  <Label htmlFor="training-experience">Training Experience</Label>
                  <Select 
                    value={editedProfile.experience_level} 
                    onValueChange={(value) => setEditedProfile(prev => ({ ...prev, experience_level: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your training experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                      <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {isEditing && (
                <Button 
                  onClick={saveProfile} 
                  className="w-full bg-gradient-primary"
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
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
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="text-2xl font-bold">
                    {formatHeight(editedProfile.height, currentUnits.heightUnit)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Weight</p>
                  <p className="text-2xl font-bold">
                    {formatWeight(editedProfile.weight, currentUnits.weightUnit)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                  <p className="text-sm text-muted-foreground">Target Weight</p>
                  <p className="text-2xl font-bold">
                    {formatWeight(editedProfile.target_weight, currentUnits.weightUnit)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                  <p className="text-sm text-muted-foreground">BMI</p>
                  <p className="text-2xl font-bold">
                    {bmi ? bmi.toFixed(1) : '--'}
                  </p>
                </div>
              </div>
              
              {!isEditing && editedProfile.unit_system && (
                <div className="mt-4 flex justify-center">
                  <Badge variant="outline" className="text-xs">
                    Using {editedProfile.unit_system === 'metric' ? 'Metric' : 'Imperial'} units
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <GoalsManager />
        </TabsContent>

        <TabsContent value="measurements" className="space-y-6">
          <BodyMeasurementTracker />
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          <ProgressPhotoManager />
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