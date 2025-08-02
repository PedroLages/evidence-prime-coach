import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Palette, 
  Moon, 
  Sun,
  Download,
  Trash2,
  AlertTriangle,
  FileText,
  Calendar,
  Scale
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/hooks/useSettings';
import { useUnits } from '@/hooks/useUnits';
import { useAuth } from '@/contexts/AuthContext';
import { DataExportService } from '@/services/dataExport';
import { toast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/useUserSettings';

const EQUIPMENT_OPTIONS = [
  'barbell', 'dumbbell', 'kettlebell', 'resistance_bands', 'pull_up_bar',
  'cable_machine', 'leg_press', 'lat_pulldown', 'rowing_machine', 'treadmill',
  'stationary_bike', 'bodyweight', 'medicine_ball', 'foam_roller'
];

const WORKOUT_TYPES = [
  'strength', 'hypertrophy', 'power', 'endurance', 'recovery', 'cardio', 'flexibility'
];

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { 
    notifications, 
    privacy, 
    loading: settingsLoading, 
    error: settingsError,
    updateNotification,
    updatePrivacy 
  } = useSettings();
  const { unitSystem, setUnitSystem } = useUnits();
  const { 
    settings: userSettings, 
    updatePreference,
    loading: userSettingsLoading 
  } = useUserSettings();
  
  const [exportingProgress, setExportingProgress] = useState(false);
  const [exportingWorkouts, setExportingWorkouts] = useState(false);

  const handleUnitSystemChange = (system: 'metric' | 'imperial') => {
    setUnitSystem(system);
    toast({
      title: "Units updated",
      description: `Changed to ${system} system (${system === 'metric' ? 'kg, cm' : 'lbs, in'})`
    });
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    try {
      await updateNotification(key as keyof typeof notifications, value);
      toast({
        title: "Settings updated",
        description: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification setting. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePrivacyChange = async (key: string, value: boolean) => {
    try {
      await updatePrivacy(key as keyof typeof privacy, value);
      toast({
        title: "Privacy settings updated",
        description: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update privacy setting. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportProgressData = async (format: 'csv' | 'json' | 'pdf' = 'json') => {
    if (!user) return;
    
    try {
      setExportingProgress(true);
      await DataExportService.exportProgressData(user.id, format);
      toast({
        title: "Export successful",
        description: `Your progress data has been downloaded as ${format.toUpperCase()}.`
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export progress data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExportingProgress(false);
    }
  };

  const exportWorkoutLogs = async (format: 'csv' | 'json' | 'pdf' = 'csv') => {
    if (!user) return;
    
    try {
      setExportingWorkouts(true);
      await DataExportService.exportWorkoutLogs(user.id, format);
      toast({
        title: "Export successful",
        description: `Your workout logs have been downloaded as ${format.toUpperCase()}.`
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export workout logs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExportingWorkouts(false);
    }
  };

  const deleteAccount = () => {
    toast({
      title: "Account deletion",
      description: "Please contact support to delete your account.",
      variant: "destructive"
    });
  };

  const handlePreferenceUpdate = async (key: string, value: any) => {
    try {
      await updatePreference(key as any, value);
      toast({
        title: "Preferences updated",
        description: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} updated successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive"
      });
    }
  };

  const toggleEquipment = (equipment: string) => {
    if (!userSettings?.preferences?.defaultEquipment) return;
    
    const current = userSettings.preferences.defaultEquipment;
    const updated = current.includes(equipment)
      ? current.filter(e => e !== equipment)
      : [...current, equipment];
    
    handlePreferenceUpdate('defaultEquipment', updated);
  };

  const toggleWorkoutType = (type: string) => {
    if (!userSettings?.preferences?.preferredWorkoutTypes) return;
    
    const current = userSettings.preferences.preferredWorkoutTypes;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    
    handlePreferenceUpdate('preferredWorkoutTypes', updated);
  };

  if (settingsLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-destructive">Error loading settings: {settingsError}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account preferences and privacy settings
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Choose between light and dark mode
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="flex items-center gap-2"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? 'Light' : 'Dark'} Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Units & Measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Units & Measurements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Unit System</Label>
              <p className="text-sm text-muted-foreground">
                Choose between metric (kg, cm) or imperial (lbs, in) units
              </p>
            </div>
            <Select 
              value={unitSystem} 
              onValueChange={handleUnitSystemChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                <SelectItem value="imperial">Imperial (lbs, in)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Fitness Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Fitness Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Equipment */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Default Equipment</Label>
              <p className="text-sm text-muted-foreground">
                Equipment you typically have access to for AI workout generation
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map(equipment => (
                <Badge
                  key={equipment}
                  variant={userSettings?.preferences?.defaultEquipment?.includes(equipment) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => toggleEquipment(equipment)}
                >
                  {equipment.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Preferred Workout Types */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Preferred Workout Types</Label>
              <p className="text-sm text-muted-foreground">
                Types of workouts you enjoy most for AI recommendations
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {WORKOUT_TYPES.map(type => (
                <Badge
                  key={type}
                  variant={userSettings?.preferences?.preferredWorkoutTypes?.includes(type) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => toggleWorkoutType(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Additional Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto Progress Photos</Label>
                <p className="text-sm text-muted-foreground">
                  Remind to take progress photos weekly
                </p>
              </div>
              <Switch
                checked={userSettings?.preferences?.autoProgressPhotos || false}
                onCheckedChange={(value) => handlePreferenceUpdate('autoProgressPhotos', value)}
                disabled={userSettingsLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Rest Timer Sound</Label>
                <p className="text-sm text-muted-foreground">
                  Audio alerts for rest periods during workouts
                </p>
              </div>
              <Switch
                checked={userSettings?.preferences?.restTimerSound ?? true}
                onCheckedChange={(value) => handlePreferenceUpdate('restTimerSound', value)}
                disabled={userSettingsLoading}
              />
            </div>
          </div>

          {userSettingsLoading && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
              Loading preferences...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Workout Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded about scheduled workouts
                </p>
              </div>
              <Switch
                checked={notifications.workoutReminders}
                onCheckedChange={(value) => handleNotificationChange('workoutReminders', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Progress Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications when you hit new personal records
                </p>
              </div>
              <Switch
                checked={notifications.progressUpdates}
                onCheckedChange={(value) => handleNotificationChange('progressUpdates', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>AI Insights</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new coaching insights
                </p>
              </div>
              <Switch
                checked={notifications.aiInsights}
                onCheckedChange={(value) => handleNotificationChange('aiInsights', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly progress summary emails
                </p>
              </div>
              <Switch
                checked={notifications.weeklyReports}
                onCheckedChange={(value) => handleNotificationChange('weeklyReports', value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Share Progress</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to see your workout progress
                </p>
              </div>
              <Switch
                checked={privacy.shareProgress}
                onCheckedChange={(value) => handlePrivacyChange('shareProgress', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Public Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Make your profile visible to other users
                </p>
              </div>
              <Switch
                checked={privacy.publicProfile}
                onCheckedChange={(value) => handlePrivacyChange('publicProfile', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Analytics Data</Label>
                <p className="text-sm text-muted-foreground">
                  Help improve the app with anonymous usage data
                </p>
              </div>
              <Switch
                checked={privacy.analyticsData}
                onCheckedChange={(value) => handlePrivacyChange('analyticsData', value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Progress Data */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Export Progress Data
              </Label>
              <p className="text-sm text-muted-foreground">
                Download your weight progress, body measurements, photos, and goals
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportProgressData('json')}
                disabled={exportingProgress}
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                {exportingProgress ? 'Exporting...' : 'JSON'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportProgressData('csv')}
                disabled={exportingProgress}
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportProgressData('pdf')}
                disabled={exportingProgress}
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                PDF Report
              </Button>
            </div>
          </div>

          {/* Export Workout Logs */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Export Workout Logs
              </Label>
              <p className="text-sm text-muted-foreground">
                Download detailed workout history with exercises, sets, reps, and weights
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportWorkoutLogs('csv')}
                disabled={exportingWorkouts}
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                {exportingWorkouts ? 'Exporting...' : 'CSV'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportWorkoutLogs('json')}
                disabled={exportingWorkouts}
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                JSON
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportWorkoutLogs('pdf')}
                disabled={exportingWorkouts}
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                PDF Log
              </Button>
            </div>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              📊 <strong>Export Formats:</strong><br/>
              • <strong>CSV:</strong> Spreadsheet-friendly format for analysis<br/>
              • <strong>JSON:</strong> Complete data with full structure<br/>
              • <strong>PDF:</strong> Formatted report for sharing or printing
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-destructive">Delete Account</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={deleteAccount}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Warning</p>
                <p className="text-muted-foreground">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <Badge variant="outline">1.0.0</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm">January 2025</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}