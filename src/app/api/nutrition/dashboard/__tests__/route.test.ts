import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/utils/supabase/server');
jest.mock('date-fns', () => ({
  format: jest.fn((date, fmt) => {
    if (fmt === 'yyyy-MM-dd') {
      return new Date(date).toISOString().split('T')[0];
    }
    return new Date(date).toISOString();
  }),
  subDays: jest.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }),
}));

const mockUser = { id: 'user-123', email: 'test@example.com' };

const createMockSupabase = (overrides: Record<string, unknown> = {}) => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
    },
    from: jest.fn().mockReturnValue(mockChain),
    _chain: mockChain,
    ...overrides,
  };
};

describe('/api/nutrition/dashboard GET', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabase();
    const { createClient } = require('@/utils/supabase/server');
    createClient.mockResolvedValue(mockSupabase);
  });

  describe('Parameter validation', () => {
    it('should use default 7 days when no days parameter is provided', async () => {
      const dailySummaries = [
        { date: '2024-01-01', total_calories: 2000, meal_count: 3 },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn(),
        };

        if (table === 'daily_nutrition_summaries') {
          chain.order.mockResolvedValue({ data: dailySummaries, error: null });
        } else if (table === 'user_nutrition_goals') {
          chain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
        } else if (table === 'nutrition_logs') {
          chain.limit.mockResolvedValue({ data: [], error: null });
        }
        return chain;
      });

      const request = new NextRequest('http://localhost/api/nutrition/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should return 400 for days=0', async () => {
      const request = new NextRequest('http://localhost/api/nutrition/dashboard?days=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid days parameter');
    });

    it('should return 400 for days=31 (exceeds maximum)', async () => {
      const request = new NextRequest('http://localhost/api/nutrition/dashboard?days=31');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid days parameter');
    });

    it('should return 400 for negative days', async () => {
      const request = new NextRequest('http://localhost/api/nutrition/dashboard?days=-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid days parameter');
    });

    it('should return 400 for non-numeric days', async () => {
      const request = new NextRequest('http://localhost/api/nutrition/dashboard?days=abc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid days parameter');
    });

    it('should accept days=1 (minimum valid value)', async () => {
      mockSupabase.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        };
        return chain;
      });

      const request = new NextRequest('http://localhost/api/nutrition/dashboard?days=1');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should accept days=30 (maximum valid value)', async () => {
      mockSupabase.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        };
        return chain;
      });

      const request = new NextRequest('http://localhost/api/nutrition/dashboard?days=30');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { createClient } = require('@/utils/supabase/server');
      createClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: jest.fn(),
      });

      const request = new NextRequest('http://localhost/api/nutrition/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when auth error occurs', async () => {
      const { createClient } = require('@/utils/supabase/server');
      createClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Auth failed'),
          }),
        },
        from: jest.fn(),
      });

      const request = new NextRequest('http://localhost/api/nutrition/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Successful responses', () => {
    it('should return dashboard data with correct analytics', async () => {
      const dailySummaries = [
        { date: '2024-01-01', total_calories: 2000, meal_count: 3 },
        { date: '2024-01-02', total_calories: 1800, meal_count: 2 },
        { date: '2024-01-03', total_calories: 2200, meal_count: 4 },
      ];
      const userGoals = { daily_calorie_goal: 2000, user_id: 'user-123' };
      const recentMeals = [{ id: 'meal-1', total_calories: 500 }];

      mockSupabase.from.mockImplementation((table: string) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn(),
          limit: jest.fn(),
          single: jest.fn(),
        };

        if (table === 'daily_nutrition_summaries') {
          chain.order.mockResolvedValue({ data: dailySummaries, error: null });
        } else if (table === 'user_nutrition_goals') {
          chain.single.mockResolvedValue({ data: userGoals, error: null });
        } else if (table === 'nutrition_logs') {
          chain.limit.mockResolvedValue({ data: recentMeals, error: null });
        }
        return chain;
      });

      const request = new NextRequest('http://localhost/api/nutrition/dashboard?days=7');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.dailySummaries).toEqual(dailySummaries);
      expect(data.userGoals).toEqual(userGoals);
      expect(data.recentMeals).toEqual(recentMeals);
      expect(data.analytics.totalCalories).toBe(6000);
      expect(data.analytics.avgCalories).toBe(2000);
      expect(data.analytics.mealCount).toBe(9);
      expect(data.analytics.daysTracked).toBe(3);
    });

    it('should return zero analytics when no daily summaries exist', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        };
        return chain;
      });

      const request = new NextRequest('http://localhost/api/nutrition/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analytics.totalCalories).toBe(0);
      expect(data.analytics.avgCalories).toBe(0);
      expect(data.analytics.mealCount).toBe(0);
      expect(data.analytics.daysTracked).toBe(0);
    });

    it('should return null userGoals when PGRST116 error occurs (no goals set)', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        };
        return chain;
      });

      const request = new NextRequest('http://localhost/api/nutrition/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.userGoals).toBeNull();
    });

    it('should handle daily summaries with missing total_calories fields', async () => {
      const dailySummaries = [
        { date: '2024-01-01', total_calories: null, meal_count: 2 },
        { date: '2024-01-02', total_calories: 1500, meal_count: null },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        };
        if (table === 'daily_nutrition_summaries') {
          chain.order.mockResolvedValue({ data: dailySummaries, error: null });
        } else {
          chain.order.mockResolvedValue({ data: [], error: null });
        }
        return chain;
      });

      const request = new NextRequest('http://localhost/api/nutrition/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analytics.totalCalories).toBe(1500);
      expect(data.analytics.mealCount).toBe(2);
    });
  });

  describe('Error handling', () => {
    it('should return 500 when daily summaries query fails', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn(),
          limit: jest.fn(),
          single: jest.fn(),
        };
        if (table === 'daily_nutrition_summaries') {
          chain.order.mockResolvedValue({ data: null, error: new Error('DB error') });
        }
        return chain;
      });

      const request = new NextRequest('http://localhost/api/nutrition/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should return 500 when user goals query fails with non-PGRST116 error', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'OTHER_ERROR', message: 'DB error' } }),
        };
        return chain;
      });

      const request = new NextRequest('http://localhost/api/nutrition/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should return 500 when recent meals query fails', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn(),
          limit: jest.fn(),
          single: jest.fn(),
        };
        if (table === 'daily_nutrition_summaries') {
          chain.order.mockResolvedValue({ data: [], error: null });
        } else if (table === 'user_nutrition_goals') {
          chain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
        } else if (table === 'nutrition_logs') {
          chain.limit.mockResolvedValue({ data: null, error: new Error('DB error') });
        }
        return chain;
      });

      const request = new NextRequest('http://localhost/api/nutrition/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});