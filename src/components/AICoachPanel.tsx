import React from 'react';
import { WorkoutRecommendation } from './WorkoutRecommendation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';
import type { CoachingInsight } from '@/types/aiCoach';

interface AICoachPanelProps {
  insights: CoachingInsight[];
  onDismissInsight: (insightId: string) => void;
  onActionClick?: (action: string, data?: any) => void;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({
  insights,
  onDismissInsight,
  onActionClick
}) => {
  const activeInsights = insights.filter(insight => !insight.dismissed);

  if (activeInsights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI Coach</CardTitle>
          </div>
          <CardDescription>
            Your personal AI fitness coach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No insights available at the moment. Keep logging your workouts and readiness metrics!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI Coach Insights</CardTitle>
          </div>
          <CardDescription>
            Personalized recommendations based on your training data
          </CardDescription>
        </CardHeader>
      </Card>

      {activeInsights.map((insight) => (
        <WorkoutRecommendation
          key={insight.id}
          insight={insight}
          onDismiss={onDismissInsight}
          onApply={onActionClick ? (insight) => {
            if (insight.actions && insight.actions.length > 0) {
              onActionClick(insight.actions[0].action, insight.actions[0].data);
            }
          } : undefined}
        />
      ))}
    </div>
  );
};