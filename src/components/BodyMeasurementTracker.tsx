import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, TrendingUp, TrendingDown, Calendar, Ruler, Scale, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getBodyMeasurements, 
  createBodyMeasurement, 
  updateBodyMeasurement, 
  BodyMeasurement 
} from '@/services/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const measurementFields = [
  { key: 'weight', label: 'Weight', icon: Scale, unit: { metric: 'kg', imperial: 'lbs' } },
  { key: 'body_fat_percentage', label: 'Body Fat %', icon: Eye, unit: { metric: '%', imperial: '%' } },
  { key: 'muscle_mass', label: 'Muscle Mass', icon: Scale, unit: { metric: 'kg', imperial: 'lbs' } },
  { key: 'waist', label: 'Waist', icon: Ruler, unit: { metric: 'cm', imperial: 'in' } },
  { key: 'chest', label: 'Chest', icon: Ruler, unit: { metric: 'cm', imperial: 'in' } },
  { key: 'arms', label: 'Arms', icon: Ruler, unit: { metric: 'cm', imperial: 'in' } },
  { key: 'thighs', label: 'Thighs', icon: Ruler, unit: { metric: 'cm', imperial: 'in' } },
  { key: 'hips', label: 'Hips', icon: Ruler, unit: { metric: 'cm', imperial: 'in' } },
  { key: 'neck', label: 'Neck', icon: Ruler, unit: { metric: 'cm', imperial: 'in' } },
  { key: 'height', label: 'Height', icon: Ruler, unit: { metric: 'cm', imperial: 'in' } }
];

export default function BodyMeasurementTracker() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [newMeasurement, setNewMeasurement] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    body_fat_percentage: '',
    muscle_mass: '',
    waist: '',
    chest: '',
    arms: '',
    thighs: '',
    hips: '',
    neck: '',
    height: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadMeasurements();
    }
  }, [user]);

  const loadMeasurements = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getBodyMeasurements(user.id);
      setMeasurements(data);
      
      // Set unit system from latest measurement
      if (data.length > 0) {
        setUnitSystem(data[0].unit_system);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load body measurements",
        variant: "destructive"
      });
      console.error('Error loading measurements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Check if at least one measurement is provided
    const hasData = Object.entries(newMeasurement).some(([key, value]) => 
      key !== 'date' && key !== 'notes' && value !== ''
    );

    if (!hasData) {
      toast({
        title: "Error",
        description: "Please enter at least one measurement",
        variant: "destructive"
      });
      return;
    }

    try {
      const measurementData = {
        user_id: user.id,
        date: newMeasurement.date,
        unit_system: unitSystem,
        notes: newMeasurement.notes || null,
        weight: newMeasurement.weight ? parseFloat(newMeasurement.weight) : null,
        body_fat_percentage: newMeasurement.body_fat_percentage ? parseFloat(newMeasurement.body_fat_percentage) : null,
        muscle_mass: newMeasurement.muscle_mass ? parseFloat(newMeasurement.muscle_mass) : null,
        waist: newMeasurement.waist ? parseFloat(newMeasurement.waist) : null,
        chest: newMeasurement.chest ? parseFloat(newMeasurement.chest) : null,
        arms: newMeasurement.arms ? parseFloat(newMeasurement.arms) : null,
        thighs: newMeasurement.thighs ? parseFloat(newMeasurement.thighs) : null,
        hips: newMeasurement.hips ? parseFloat(newMeasurement.hips) : null,
        neck: newMeasurement.neck ? parseFloat(newMeasurement.neck) : null,
        height: newMeasurement.height ? parseFloat(newMeasurement.height) : null
      };

      await createBodyMeasurement(measurementData);
      
      toast({
        title: "Success",
        description: "Body measurements saved successfully!"
      });

      setNewMeasurement({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        body_fat_percentage: '',
        muscle_mass: '',
        waist: '',
        chest: '',
        arms: '',
        thighs: '',
        hips: '',
        neck: '',
        height: '',
        notes: ''
      });
      setIsAddingMeasurement(false);
      loadMeasurements();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save measurements",
        variant: "destructive"
      });
      console.error('Error saving measurements:', error);
    }
  };

  const getChartData = (metric: string) => {
    return measurements
      .filter(m => m[metric as keyof BodyMeasurement] !== null)
      .reverse()
      .map(m => ({
        date: new Date(m.date).toLocaleDateString(),
        value: m[metric as keyof BodyMeasurement] as number
      }));
  };

  const getTrend = (metric: string) => {
    const data = getChartData(metric);
    if (data.length < 2) return 'neutral';
    
    const latest = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    
    return latest > previous ? 'up' : latest < previous ? 'down' : 'neutral';
  };

  const getLatestValue = (metric: string) => {
    const latest = measurements.find(m => m[metric as keyof BodyMeasurement] !== null);
    return latest ? latest[metric as keyof BodyMeasurement] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Body Measurements</h2>
        <div className="flex items-center space-x-2">
          <Select value={unitSystem} onValueChange={(value: 'metric' | 'imperial') => setUnitSystem(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">Metric</SelectItem>
              <SelectItem value="imperial">Imperial</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAddingMeasurement} onOpenChange={setIsAddingMeasurement}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Measurements
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record Body Measurements</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="measurement-date">Date</Label>
                    <Input
                      id="measurement-date"
                      type="date"
                      value={newMeasurement.date}
                      onChange={(e) => setNewMeasurement(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit-system">Unit System</Label>
                    <Select value={unitSystem} onValueChange={(value: 'metric' | 'imperial') => setUnitSystem(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                        <SelectItem value="imperial">Imperial (lbs, in)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {measurementFields.map(field => (
                    <div key={field.key}>
                      <Label htmlFor={field.key}>
                        {field.label} ({field.unit[unitSystem]})
                      </Label>
                      <Input
                        id={field.key}
                        type="number"
                        step="0.1"
                        value={newMeasurement[field.key as keyof typeof newMeasurement]}
                        onChange={(e) => setNewMeasurement(prev => ({ 
                          ...prev, 
                          [field.key]: e.target.value 
                        }))}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <Label htmlFor="measurement-notes">Notes</Label>
                  <Textarea
                    id="measurement-notes"
                    value={newMeasurement.notes}
                    onChange={(e) => setNewMeasurement(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes about these measurements..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => setIsAddingMeasurement(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>
                    Save Measurements
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {measurementFields.slice(0, 4).map(field => {
          const latest = getLatestValue(field.key);
          const trend = getTrend(field.key);
          const IconComponent = field.icon;
          
          return (
            <Card key={field.key} className="hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => setSelectedMetric(field.key)}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
                    <p className="text-2xl font-bold">
                      {latest ? `${latest} ${field.unit[unitSystem]}` : 'No data'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    {trend !== 'neutral' && (
                      trend === 'up' ? 
                        <TrendingUp className="h-4 w-4 text-green-600" /> : 
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      {measurements.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {measurementFields.find(f => f.key === selectedMetric)?.label} Trend
              </CardTitle>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {measurementFields.map(field => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData(selectedMetric)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [
                      `${value} ${measurementFields.find(f => f.key === selectedMetric)?.unit[unitSystem]}`,
                      measurementFields.find(f => f.key === selectedMetric)?.label
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Measurements */}
      {measurements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {measurements.slice(0, 5).map(measurement => (
                <div key={measurement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{new Date(measurement.date).toLocaleDateString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {measurement.notes && `Note: ${measurement.notes}`}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {measurementFields.map(field => {
                      const value = measurement[field.key as keyof BodyMeasurement];
                      if (value !== null) {
                        return (
                          <Badge key={field.key} variant="outline">
                            {field.label}: {value} {field.unit[measurement.unit_system]}
                          </Badge>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {measurements.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Scale className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No measurements yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your body measurements to see your progress over time.
            </p>
            <Button onClick={() => setIsAddingMeasurement(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Measurement
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}