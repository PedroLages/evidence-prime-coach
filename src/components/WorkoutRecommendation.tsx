import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Target, CheckCircle } from 'lucide-react';
import type { CoachingInsight } from '@/types/aiCoach';

interface WorkoutRecommendationProps {
  insight: CoachingInsight;
  onApply?: (insight: CoachingInsight) => void;
  onDismiss?: (insightId: string) => void;
}

export const WorkoutRecommendation: React.FC<WorkoutRecommendationProps> = ({
  insight,
  onApply,
  onDismiss
}) => {
  const getIcon = () => {
    switch (insight.category) {
      case 'suggestion':
        return <Target className="h-5 w-5" />;
      case 'celebration':
        return <CheckCircle className="h-5 w-5" />;
      case 'information':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getPriorityColor = () => {
    switch (insight.priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getTypeColor = () => {
    switch (insight.category) {
      case 'suggestion':
        return 'text-blue-600 dark:text-blue-400';
      case 'celebration':
        return 'text-green-600 dark:text-green-400';
      case 'information':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={getTypeColor()}>
              {getIcon()}
            </div>
            <div>
              <CardTitle className="text-base">{insight.title}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {insight.type}
              </CardDescription>
            </div>
          </div>
          <Badge variant={getPriorityColor()}>{insight.priority}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4">
          {insight.message}
        </p>

        {insight.evidence && insight.evidence.length > 0 && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
              Evidence
            </h4>
            <div className="space-y-1">
              {insight.evidence.map((evidence, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  • {evidence}
                </div>
              ))}
            </div>
          </div>
        )}

        {insight.actions && insight.actions.length > 0 && (
          <div className="flex gap-2 mb-4">
            {insight.actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                onClick={() => onApply && onApply(insight)}
                className="flex-1"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
        
        {onDismiss && (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDismiss(insight.id)}
            >
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};