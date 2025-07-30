import { Badge } from '@/components/ui/badge';
import { Brain, Activity, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AICoachBadgeProps {
  status: 'active' | 'learning' | 'ready' | 'offline';
  insightCount?: number;
  className?: string;
}

export const AICoachBadge = ({ status, insightCount = 0, className }: AICoachBadgeProps) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'active':
        return {
          icon: <Activity className="h-3 w-3" />,
          text: 'Active',
          variant: 'default' as const,
          className: 'bg-green-500 text-white animate-pulse'
        };
      case 'learning':
        return {
          icon: <Brain className="h-3 w-3" />,
          text: 'Learning',
          variant: 'secondary' as const,
          className: 'bg-primary/10 text-primary'
        };
      case 'ready':
        return {
          icon: <TrendingUp className="h-3 w-3" />,
          text: 'Ready',
          variant: 'outline' as const,
          className: 'border-primary text-primary'
        };
      default:
        return {
          icon: <Brain className="h-3 w-3 opacity-50" />,
          text: 'Offline',
          variant: 'secondary' as const,
          className: 'opacity-60'
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant={config.variant}
        className={cn("flex items-center gap-1.5 text-xs", config.className)}
      >
        {config.icon}
        {config.text}
        {insightCount > 0 && (
          <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
            {insightCount}
          </span>
        )}
      </Badge>
    </div>
  );
};