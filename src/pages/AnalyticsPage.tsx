import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Brain, RefreshCw } from 'lucide-react';
import { AnalyticsOverview } from '@/components/AnalyticsOverview';
import { WorkoutAnalyticsDashboard } from '@/components/WorkoutAnalyticsDashboard';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAICoaching } from '@/hooks/useAICoaching';
import { AICoachPanel } from '@/components/AICoachPanel';

export default function AnalyticsPage() {
  const { analysis, loading: analyticsLoading, refreshAnalytics } = useAnalytics();
  const { insights, loading: aiLoading, dismissInsight, refreshInsights } = useAICoaching();

  const handleRefreshAll = () => {
    refreshAnalytics();
    refreshInsights();
  };

  if (analyticsLoading || aiLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">AI-powered fitness insights</p>
        </div>
        <Button variant="outline" onClick={handleRefreshAll}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="workouts">
            <TrendingUp className="h-4 w-4 mr-2" />
            Workouts
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="h-4 w-4 mr-2" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {analysis ? (
            <AnalyticsOverview analysis={analysis} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No analytics data available yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workouts">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Workout analytics coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <AICoachPanel 
            insights={insights}
            onDismissInsight={dismissInsight}
            onActionClick={(action, data) => console.log('Action:', action, data)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}