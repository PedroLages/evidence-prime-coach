import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Dumbbell, 
  TrendingUp, 
  User, 
  Calendar,
  Target,
  Users,
  Scale
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useWeightProgress } from '@/hooks/useWeightProgress';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Today', href: '/workout', icon: Dumbbell },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Community', href: '/community', icon: Users },
  { name: 'Profile', href: '/profile', icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";
  const { 
    formattedCurrent, 
    formattedGoal, 
    formattedRemaining, 
    progressPercentage, 
    remainingKg,
    loading: progressLoading 
  } = useWeightProgress();

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg text-foreground">Pedro's Coach</h1>
              <p className="text-xs text-muted-foreground">Evidence-Based Training</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={item.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        <Icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.name}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!isCollapsed && (
        <SidebarFooter className="p-4 border-t">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Weight Progress</span>
            </div>
            
            {progressLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Weight</span>
                  <span className="font-medium text-foreground">
                    {formattedCurrent || '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Goal Weight</span>
                  <span className="font-medium text-foreground">
                    {formattedGoal || '--'}
                  </span>
                </div>
                
                {progressPercentage !== null && (
                  <>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {remainingKg !== null && remainingKg > 0 
                        ? `${formattedRemaining} to go • ${progressPercentage}% complete`
                        : remainingKg !== null && remainingKg < 0
                        ? `${Math.abs(remainingKg!).toFixed(1)} ${formattedRemaining.split(' ')[1]} over goal • ${progressPercentage}% complete`
                        : `${progressPercentage}% complete`
                      }
                    </p>
                  </>
                )}
                
                {progressPercentage === null && formattedCurrent !== '--' && formattedGoal === '--' && (
                  <p className="text-xs text-muted-foreground text-center">
                    Set a goal weight to track progress
                  </p>
                )}
                
                {formattedCurrent === '--' && (
                  <p className="text-xs text-muted-foreground text-center">
                    Add weight measurements to track progress
                  </p>
                )}
              </>
            )}
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}