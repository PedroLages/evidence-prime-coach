# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Evidence Prime Coach is a React-based fitness coaching application with AI-powered insights. Built with TypeScript, Vite, and Supabase backend. The app provides workout tracking, progress analytics, AI coaching recommendations, and comprehensive fitness data management.

## Development Commands

### Core Development
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Dependencies
- `npm i` - Install dependencies (uses npm, not yarn/pnpm)

## Architecture Overview

### Frontend Structure
- **React 18** with TypeScript and Vite
- **shadcn/ui** component library with Radix UI primitives
- **TailwindCSS** for styling
- **React Router** for navigation with protected routes
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation

### State Management
- **AuthContext** (`src/contexts/AuthContext.tsx`) - Handles Supabase authentication
- **Custom hooks** in `src/hooks/` for feature-specific state
- **TanStack Query** for server state caching

### Backend Integration
- **Supabase** as backend-as-a-service
- Client configured in `src/integrations/supabase/client.ts`
- Database functions in `src/services/database.ts`
- Migration files in `supabase/migrations/`

### Key Features Architecture

#### AI Coaching System
- `src/lib/aiCoach/` - Core AI coaching logic
  - `insightGenerator.ts` - Generates personalized coaching insights
  - `dataAnalyzer.ts` - Analyzes workout and health data patterns
  - `readinessAnalyzer.ts` - Evaluates user readiness for training
  - `workoutModifier.ts` - Modifies workouts based on readiness

#### Analytics & Progress Tracking
- `src/lib/analytics/progressAnalyzer.ts` - Progress pattern analysis
- `src/services/dynamicAnalytics.ts` - Dynamic analytics processing
- Performance metrics, body measurements, and progress photos tracking

#### Auto Progression System
- `src/lib/autoProgression/` - Automatic workout progression
  - `progressionEngine.ts` - Core progression logic
  - `plateauDetector.ts` - Detects training plateaus
  - `oneRMCalculators.ts` - One-rep max calculations

### Data Models

#### Workout System
- **WorkoutSession** - Individual workout sessions
- **WorkoutTemplate** - Reusable workout templates
- **Exercise** - Exercise definitions with instructions
- **WorkoutSet** - Individual sets with reps/weight/RPE

#### User Data
- **Profile** - User profile and fitness goals
- **DailyMetric** - Daily readiness metrics (sleep, stress, soreness)
- **BodyMeasurement** - Body composition tracking
- **PerformanceMetric** - Exercise performance tracking

### Component Structure
- **Pages** (`src/pages/`) - Route components
- **Components** (`src/components/`) - Feature components
- **UI Components** (`src/components/ui/`) - shadcn/ui components
- **Hooks** (`src/hooks/`) - Custom React hooks

### Navigation & Layout
- `src/components/Layout.tsx` - Main app layout with sidebar
- `src/components/AppSidebar.tsx` - Navigation sidebar
- Protected routes require authentication
- Onboarding flow for new users

## Development Notes

### Error Handling
- Global ErrorBoundary wraps the app
- Supabase errors logged to console
- Form validation with React Hook Form and Zod

### Authentication Flow
- Supabase auth with email/password
- AuthContext provides user state globally
- Automatic redirect to `/auth` when unauthenticated
- Onboarding flow checks `localStorage.getItem('onboarding_completed')`

### Database Patterns
- All database functions return consistent error patterns
- Use upsert for metrics that should be unique per user/date
- Foreign key relationships maintained in Supabase

### Disabled Features
- Several services have `.disabled` versions indicating features under development or temporarily disabled
- Check for `.temp.disabled` and `.ts.disabled` files before implementing related features

### Styling Conventions
- TailwindCSS utility classes
- shadcn/ui design system
- Responsive design with mobile-first approach
- Dark/light theme support via next-themes

### Performance Considerations
- TanStack Query for efficient data fetching and caching
- Lazy loading with React.lazy where appropriate
- Optimistic updates for user interactions

## Common Patterns

### Data Fetching
```typescript
// Use custom hooks for data fetching
const { data, error, isLoading } = useQuery({
  queryKey: ['key'],
  queryFn: () => supabaseFunction()
})
```

### Form Handling
```typescript
// React Hook Form with Zod validation
const form = useForm<FormType>({
  resolver: zodResolver(schema)
})
```

### Component Structure
- Use TypeScript interfaces for props
- Export default for page components
- Named exports for utility components
- Consistent error boundaries and loading states