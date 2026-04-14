import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock Next.js navigation
const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

// Mock Supabase server
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

// Mock calorie tracker components
jest.mock('@/components/calorie-tracker/PhotoUpload', () => ({
  __esModule: true,
  default: () => <div data-testid="photo-upload">PhotoUpload</div>,
}));

jest.mock('@/components/calorie-tracker/DailyCalorieSummary', () => ({
  DailyCalorieSummary: ({ summary, goals }: any) => (
    <div data-testid="daily-calorie-summary">
      Summary: {summary ? 'present' : 'null'}, Goals: {goals ? 'present' : 'null'}
    </div>
  ),
}));

jest.mock('@/components/calorie-tracker/WeeklyTrendsChart', () => ({
  WeeklyTrendsChart: ({ userId }: any) => (
    <div data-testid="weekly-trends-chart" data-user-id={userId}>
      Weekly Trends
    </div>
  ),
}));

jest.mock('@/components/calorie-tracker/QuickActions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
}));

jest.mock('@/components/calorie-tracker/RecentMeals', () => ({
  RecentMeals: ({ meals }: any) => (
    <div data-testid="recent-meals" data-meal-count={meals.length}>
      Recent Meals
    </div>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className }: any) => (
    <div data-testid="alert" className={className}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: any) => (
    <div data-testid="alert-description">{children}</div>
  ),
}));

jest.mock('lucide-react', () => ({
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
}));

// Mock React Suspense for PhotoUpload in add view
jest.mock('react', () => ({
  ...jest.requireActual('react') as object,
  Suspense: ({ children }: any) => children,
}));

const mockUser = { id: 'user-123', email: 'test@example.com' };

const setupMockSupabase = (options: {
  user?: any;
  authError?: any;
  dailySummary?: any;
  userGoals?: any;
  recentMeals?: any;
} = {}) => {
  const { user = mockUser, authError = null, dailySummary = null, userGoals = null, recentMeals = [] } = options;

  mockGetUser.mockResolvedValue({ data: { user }, error: authError });

  mockFrom.mockImplementation((table: string) => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };

    if (table === 'daily_nutrition_summaries') {
      chain.maybeSingle.mockResolvedValue({ data: dailySummary, error: null });
    } else if (table === 'user_nutrition_goals') {
      chain.maybeSingle.mockResolvedValue({ data: userGoals, error: null });
    } else if (table === 'nutrition_logs') {
      chain.limit.mockResolvedValue({ data: recentMeals, error: null });
    }

    return chain;
  });

  const { createClient } = require('@/utils/supabase/server');
  createClient.mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  });
};

describe('CalorieTrackerPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should redirect to /login when user is not authenticated', async () => {
      setupMockSupabase({ user: null });

      const { default: CalorieTrackerPage } = await import('../page');
      await CalorieTrackerPage({
        searchParams: Promise.resolve({}),
      });

      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });

    it('should redirect to /login when auth error occurs', async () => {
      setupMockSupabase({ user: null, authError: new Error('Auth failed') });

      const { default: CalorieTrackerPage } = await import('../page');
      await CalorieTrackerPage({
        searchParams: Promise.resolve({}),
      });

      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });
  });

  describe('Dashboard view (default)', () => {
    it('should render Calorie Tracker heading', async () => {
      setupMockSupabase();

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({}),
      });

      const { container } = render(result as React.ReactElement);
      expect(container.textContent).toContain('Calorie Tracker');
    });

    it('should render DailyCalorieSummary component', async () => {
      setupMockSupabase();

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({}),
      });

      const { getByTestId } = render(result as React.ReactElement);
      expect(getByTestId('daily-calorie-summary')).toBeInTheDocument();
    });

    it('should render WeeklyTrendsChart with user id', async () => {
      setupMockSupabase();

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({}),
      });

      const { getByTestId } = render(result as React.ReactElement);
      expect(getByTestId('weekly-trends-chart')).toHaveAttribute('data-user-id', 'user-123');
    });

    it('should render QuickActions component', async () => {
      setupMockSupabase();

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({}),
      });

      const { getByTestId } = render(result as React.ReactElement);
      expect(getByTestId('quick-actions')).toBeInTheDocument();
    });

    it('should render RecentMeals with empty meals when none fetched', async () => {
      setupMockSupabase({ recentMeals: [] });

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({}),
      });

      const { getByTestId } = render(result as React.ReactElement);
      expect(getByTestId('recent-meals')).toHaveAttribute('data-meal-count', '0');
    });

    it('should render RecentMeals with meal data', async () => {
      const recentMeals = [
        { id: 'meal-1', total_calories: 500 },
        { id: 'meal-2', total_calories: 300 },
      ];
      setupMockSupabase({ recentMeals });

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({}),
      });

      const { getByTestId } = render(result as React.ReactElement);
      expect(getByTestId('recent-meals')).toHaveAttribute('data-meal-count', '2');
    });

    it('should NOT show success message in default view without success param', async () => {
      setupMockSupabase();

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({}),
      });

      const { queryByTestId } = render(result as React.ReactElement);
      expect(queryByTestId('alert')).not.toBeInTheDocument();
    });

    it('should show success message when success=true param is provided', async () => {
      setupMockSupabase();

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({ success: 'true' }),
      });

      const { getByTestId } = render(result as React.ReactElement);
      expect(getByTestId('alert')).toBeInTheDocument();
    });
  });

  describe('Add view', () => {
    it('should render PhotoUpload in add view', async () => {
      setupMockSupabase();

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({ view: 'add' }),
      });

      const { getByTestId } = render(result as React.ReactElement);
      expect(getByTestId('photo-upload')).toBeInTheDocument();
    });

    it('should NOT render DailyCalorieSummary in add view', async () => {
      setupMockSupabase();

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({ view: 'add' }),
      });

      const { queryByTestId } = render(result as React.ReactElement);
      expect(queryByTestId('daily-calorie-summary')).not.toBeInTheDocument();
    });

    it('should show success message in add view when success=true', async () => {
      setupMockSupabase();

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({ view: 'add', success: 'true' }),
      });

      const { getByTestId } = render(result as React.ReactElement);
      expect(getByTestId('alert')).toBeInTheDocument();
    });

    it('should NOT show success message in add view when success is not true', async () => {
      setupMockSupabase();

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({ view: 'add' }),
      });

      const { queryByTestId } = render(result as React.ReactElement);
      expect(queryByTestId('alert')).not.toBeInTheDocument();
    });
  });

  describe('Data passing to components', () => {
    it('should pass dailySummary data to DailyCalorieSummary', async () => {
      const dailySummary = { date: '2024-01-01', total_calories: 1800 };
      setupMockSupabase({ dailySummary });

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({}),
      });

      const { getByTestId } = render(result as React.ReactElement);
      expect(getByTestId('daily-calorie-summary').textContent).toContain('present');
    });

    it('should handle null dailySummary gracefully', async () => {
      setupMockSupabase({ dailySummary: null });

      const { default: CalorieTrackerPage } = await import('../page');
      const result = await CalorieTrackerPage({
        searchParams: Promise.resolve({}),
      });

      const { getByTestId } = render(result as React.ReactElement);
      expect(getByTestId('daily-calorie-summary').textContent).toContain('null');
    });
  });
});