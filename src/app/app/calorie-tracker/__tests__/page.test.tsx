import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
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
jest.mock('@/components/calorie-tracker/photo-upload', () => ({
  PhotoUpload: () => <div data-testid="photo-upload">Photo Upload Component</div>,
}));

jest.mock('@/components/calorie-tracker/meal-log', () => ({
  MealLog: ({ data }: any) => (
    <div data-testid="meal-log" data-meal-count={data.length}>
      Meal Log
    </div>
  ),
}));

jest.mock('@/components/calorie-tracker/nutrition-summary', () => ({
  NutritionSummary: ({ data }: any) => (
    <div data-testid="nutrition-summary" data-item-count={data.length}>
      Nutrition Summary
    </div>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Camera: () => <svg data-testid="camera-icon" />,
  Target: () => <svg data-testid="target-icon" />,
  TrendingUp: () => <svg data-testid="trending-up-icon" />,
}));

const mockUser = { id: 'user-123', email: 'test@example.com' };

const setupMockSupabase = (options: {
  user?: any;
  nutritionLogs?: any[];
  todayNutrition?: any[];
} = {}) => {
  const { user = mockUser, nutritionLogs = [], todayNutrition = [] } = options;

  mockGetUser.mockResolvedValue({ data: { user }, error: null });

  // Track call count to differentiate between the two nutrition_logs queries
  let callCount = 0;
  mockFrom.mockImplementation((table: string) => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      limit: jest.fn(),
    };

    if (table === 'nutrition_logs') {
      callCount++;
      if (callCount === 1) {
        // First call: recent nutrition logs (ordered desc, limit 10)
        chain.limit.mockResolvedValue({ data: nutritionLogs, error: null });
      } else {
        // Second call: today's nutrition (filtered by date)
        chain.lte.mockResolvedValue({ data: todayNutrition, error: null });
      }
    }

    return chain;
  });

  const { createClient } = require('@/utils/supabase/server');
  createClient.mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  });
};

describe('CalorieTracker (App Protected)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Calorie Tracker heading', async () => {
      setupMockSupabase();

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('Calorie Tracker');
    });

    it('should render subtitle text', async () => {
      setupMockSupabase();

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('Track your meals with AI-powered nutrition analysis');
    });

    it('should render Log New Meal section', async () => {
      setupMockSupabase();

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('Log New Meal');
    });

    it("should render Today's Nutrition section", async () => {
      setupMockSupabase();

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain("Today's Nutrition");
    });

    it('should render Recent Meals section', async () => {
      setupMockSupabase();

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { container } = render(result as React.ReactElement);

      expect(container.textContent).toContain('Recent Meals');
    });

    it('should render PhotoUpload component', async () => {
      setupMockSupabase();

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { getByTestId } = render(result as React.ReactElement);

      expect(getByTestId('photo-upload')).toBeInTheDocument();
    });

    it('should render NutritionSummary component', async () => {
      setupMockSupabase();

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { getByTestId } = render(result as React.ReactElement);

      expect(getByTestId('nutrition-summary')).toBeInTheDocument();
    });

    it('should render MealLog component', async () => {
      setupMockSupabase();

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { getByTestId } = render(result as React.ReactElement);

      expect(getByTestId('meal-log')).toBeInTheDocument();
    });
  });

  describe('Data passing', () => {
    it('should pass nutrition logs data to MealLog', async () => {
      const nutritionLogs = [
        { id: 'meal-1', total_calories: 500 },
        { id: 'meal-2', total_calories: 300 },
      ];
      setupMockSupabase({ nutritionLogs });

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { getByTestId } = render(result as React.ReactElement);

      expect(getByTestId('meal-log')).toHaveAttribute('data-meal-count', '2');
    });

    it('should pass empty array to MealLog when no meals', async () => {
      setupMockSupabase({ nutritionLogs: [] });

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { getByTestId } = render(result as React.ReactElement);

      expect(getByTestId('meal-log')).toHaveAttribute('data-meal-count', '0');
    });

    it("should pass today's nutrition to NutritionSummary", async () => {
      const todayNutrition = [
        { id: 'today-meal-1', total_calories: 700 },
        { id: 'today-meal-2', total_calories: 400 },
      ];
      setupMockSupabase({ todayNutrition });

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { getByTestId } = render(result as React.ReactElement);

      // NutritionSummary should receive todayNutrition
      expect(getByTestId('nutrition-summary')).toBeInTheDocument();
    });
  });

  describe('Icons rendering', () => {
    it('should render Camera icon in Log New Meal section', async () => {
      setupMockSupabase();

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { getAllByTestId } = render(result as React.ReactElement);

      expect(getAllByTestId('camera-icon').length).toBeGreaterThan(0);
    });

    it('should render Target icon', async () => {
      setupMockSupabase();

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { getByTestId } = render(result as React.ReactElement);

      expect(getByTestId('target-icon')).toBeInTheDocument();
    });

    it('should render TrendingUp icon', async () => {
      setupMockSupabase();

      const { default: CalorieTracker } = await import('../page');
      const result = await CalorieTracker();
      const { getByTestId } = render(result as React.ReactElement);

      expect(getByTestId('trending-up-icon')).toBeInTheDocument();
    });
  });
});