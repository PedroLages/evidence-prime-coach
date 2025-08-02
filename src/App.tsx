import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ui/error-handling';
import Layout from "./components/Layout";
import AuthPage from "./pages/AuthPage";
import OnboardingFlow from "./components/OnboardingFlow";
import Dashboard from "./pages/Dashboard";
import AnalyticsPage from "./pages/AnalyticsPage";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import WorkoutPage from "./pages/WorkoutPage";
import ProgressPage from "./pages/ProgressPage";
import CalendarPage from "./pages/CalendarPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user needs onboarding
  const needsOnboarding = user && !localStorage.getItem('onboarding_completed');

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          {user ? (
            <>
              {needsOnboarding ? (
                <Route path="*" element={<OnboardingFlow />} />
              ) : (
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="advanced-analytics" element={<AdvancedAnalytics />} />
                  <Route path="workout" element={<WorkoutPage />} />
                  <Route path="progress" element={<ProgressPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              )}
            </>
          ) : (
            <Route path="*" element={<AuthPage />} />
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
