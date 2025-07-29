import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Dumbbell, 
  TrendingUp, 
  User, 
  Calendar,
  Target,
  Activity,
  Moon,
  Sun,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Today', href: '/workout', icon: Dumbbell },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function Layout() {
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={cn("min-h-screen bg-background", isDark && "dark")}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Pedro's Coach</h1>
              <p className="text-xs text-muted-foreground">Evidence-Based Training</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        <main className="flex-1 pb-20 md:pb-4">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t md:hidden">
        <div className="grid grid-cols-5 h-16">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5",
                  isActive && "drop-shadow-sm"
                )} />
                <span className="text-[10px]">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:fixed md:left-0 md:top-16 md:bottom-0 md:w-64 md:flex md:flex-col md:bg-card md:border-r">
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
        
        {/* Quick Stats - Desktop Sidebar */}
        <div className="p-4 border-t">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Weight</span>
              <span className="font-medium text-foreground">75.2 kg</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Goal</span>
              <span className="font-medium text-foreground">80 kg</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-primary h-2 rounded-full transition-all" 
                style={{ width: '44%' }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              4.8 kg to go • 44% complete
            </p>
          </div>
        </div>
      </aside>

      {/* Spacer for desktop sidebar */}
      <div className="hidden md:block md:w-64" />
    </div>
  );
}