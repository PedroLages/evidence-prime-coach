import { Brain, MessageSquare, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AICoachBadgeProps {
  message: string;
  type?: 'insight' | 'recommendation' | 'warning' | 'celebration';
  className?: string;
}

export default function AICoachBadge({ 
  message, 
  type = 'insight', 
  className 
}: AICoachBadgeProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'recommendation':
        return {
          bg: 'bg-primary/10 border-primary/20',
          icon: <TrendingUp className="h-4 w-4 text-primary" />,
          badge: 'Coach Recommendation'
        };
      case 'warning':
        return {
          bg: 'bg-warning/10 border-warning/20',
          icon: <MessageSquare className="h-4 w-4 text-warning" />,
          badge: 'Coach Alert'
        };
      case 'celebration':
        return {
          bg: 'bg-success/10 border-success/20',
          icon: <TrendingUp className="h-4 w-4 text-success" />,
          badge: 'Achievement!'
        };
      default:
        return {
          bg: 'bg-accent/10 border-accent/20',
          icon: <Brain className="h-4 w-4 text-accent" />,
          badge: 'Coach Alpha'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Card className={cn("border-0", styles.bg, className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {styles.icon}
          </div>
          <div className="flex-1 space-y-2">
            <Badge variant="secondary" className="text-xs">
              {styles.badge}
            </Badge>
            <p className="text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}