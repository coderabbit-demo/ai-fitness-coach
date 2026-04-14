import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, ...props }: any) => (
    <img src={src} alt={alt} width={width} height={height} {...props} />
  ),
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

// Mock dashboard preview components
jest.mock('@/components/dashboard-preview', () => ({
  WeightProgressChart: () => <div data-testid="weight-progress-chart">Weight Progress</div>,
  CalorieIntakeChart: () => <div data-testid="calorie-intake-chart">Calorie Intake</div>,
  MoodSleepChart: () => <div data-testid="mood-sleep-chart">Mood Sleep</div>,
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild) return children;
    return <button {...props}>{children}</button>;
  },
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>,
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Camera: () => <svg data-testid="camera-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
}));

const mockUser = { id: 'user-123', email: 'test@example.com' };

const setupMockSupabase = (options: {
  user?: any;
  profile?: any;
  recentNutrition?: any[];
} = {}) => {
  const { user = mockUser, profile = null, recentNutrition = [] } = options;

  mockGetUser.mockResolvedValue({ data: { user }, error: null });

  mockFrom.mockImplementation((table: string) => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn(),
      single: jest.fn(),
    };

    if (table === 'user_profiles') {
      chain.single.mockResolvedValue({ data: profile, error: null });
    } else if (table === 'nutrition_logs') {
      chain.limit.mockResolvedValue({ data: recentNutrition, error: null });
    }

    return chain;
  });

  const { createClient } = require('@/utils/supabase/server');
  createClient.mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  });
};

describe('AppDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering with authenticated user', () => {
    it('should render the welcome message with profile name', async () => {
      setupMockSupabase({ profile: { full_name: 'John Doe', fitness_goals: [] } });

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('Welcome back, John Doe!');
    });

    it('should render user email when no profile name is set', async () => {
      setupMockSupabase({ profile: null });

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('test@example.com');
    });

    it('should render Log Meal button', async () => {
      setupMockSupabase();

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { getByText } = render(result as React.ReactElement);

      expect(getByText('Log Meal')).toBeInTheDocument();
    });

    it('should render Log Meal button linking to /app/calorie-tracker', async () => {
      setupMockSupabase();

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { getByText } = render(result as React.ReactElement);

      const logMealLink = getByText('Log Meal').closest('a');
      expect(logMealLink).toHaveAttribute('href', '/app/calorie-tracker');
    });

    it("should render Today's Calories card", async () => {
      setupMockSupabase();

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain("Today's Calories");
    });

    it('should render Current Weight card', async () => {
      setupMockSupabase();

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('Current Weight');
    });

    it('should render Fitness Goals card', async () => {
      setupMockSupabase();

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('Fitness Goals');
    });

    it('should render WeightProgressChart', async () => {
      setupMockSupabase();

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { getByTestId } = render(result as React.ReactElement);

      expect(getByTestId('weight-progress-chart')).toBeInTheDocument();
    });

    it('should render CalorieIntakeChart', async () => {
      setupMockSupabase();

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { getByTestId } = render(result as React.ReactElement);

      expect(getByTestId('calorie-intake-chart')).toBeInTheDocument();
    });

    it('should render MoodSleepChart', async () => {
      setupMockSupabase();

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { getByTestId } = render(result as React.ReactElement);

      expect(getByTestId('mood-sleep-chart')).toBeInTheDocument();
    });
  });

  describe('Calories calculation', () => {
    it('should show 0 calories when no meals today', async () => {
      setupMockSupabase({ recentNutrition: [] });

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { container } = render(result as React.ReactElement);

      // First number found after Today's Calories title should be 0
      expect(container.textContent).toContain('0 meals logged');
    });

    it('should count meals logged', async () => {
      const recentNutrition = [
        { id: 'meal-1', total_calories: 500, created_at: new Date().toISOString() },
        { id: 'meal-2', total_calories: 300, created_at: new Date().toISOString() },
      ];
      setupMockSupabase({ recentNutrition });

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('2 meals logged');
    });
  });

  describe('Profile data display', () => {
    it("should display 'Not set' when weight is not in profile", async () => {
      setupMockSupabase({ profile: { full_name: 'John', fitness_goals: [] } });

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('Not set');
    });

    it('should display weight from profile', async () => {
      setupMockSupabase({ profile: { full_name: 'John', weight_kg: 80, fitness_goals: [] } });

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('80 kg');
    });

    it("should display 'None set' when fitness goals array is empty", async () => {
      setupMockSupabase({ profile: { full_name: 'John', fitness_goals: [] } });

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('None set');
    });

    it('should display fitness goal badges when goals exist', async () => {
      setupMockSupabase({
        profile: { full_name: 'John', fitness_goals: ['weight_loss', 'muscle_gain'] },
      });

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { getAllByTestId } = render(result as React.ReactElement);

      const badges = getAllByTestId('badge');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe('Empty meals state', () => {
    it('should show empty state message when no meals logged', async () => {
      setupMockSupabase({ recentNutrition: [] });

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('No meals logged yet');
    });

    it("should show 'Log Your First Meal' CTA when no meals logged", async () => {
      setupMockSupabase({ recentNutrition: [] });

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { getByText } = render(result as React.ReactElement);

      expect(getByText('Log Your First Meal')).toBeInTheDocument();
    });

    it("should link 'Log Your First Meal' to /app/calorie-tracker", async () => {
      setupMockSupabase({ recentNutrition: [] });

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { getByText } = render(result as React.ReactElement);

      const firstMealLink = getByText('Log Your First Meal').closest('a');
      expect(firstMealLink).toHaveAttribute('href', '/app/calorie-tracker');
    });
  });

  describe('Recent meals display', () => {
    it('should display recent meal entries', async () => {
      const recentNutrition = [
        {
          id: 'meal-1',
          total_calories: 650,
          created_at: new Date().toISOString(),
          food_items: 'Chicken Salad',
          image_url: null,
          confidence_score: 0.95,
        },
      ];
      setupMockSupabase({ recentNutrition });

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('650 cal');
    });

    it('should display confidence score when available', async () => {
      const recentNutrition = [
        {
          id: 'meal-1',
          total_calories: 400,
          created_at: new Date().toISOString(),
          food_items: 'Pizza',
          confidence_score: 0.85,
        },
      ];
      setupMockSupabase({ recentNutrition });

      const { default: AppDashboard } = await import('../page');
      const result = await AppDashboard();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('85% confident');
    });
  });
});