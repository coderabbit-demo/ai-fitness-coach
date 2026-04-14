import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/utils/supabase/server');

const mockUser = { id: 'user-123', email: 'test@example.com' };

const createMockSupabase = (authUser = mockUser) => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: authUser },
        error: null,
      }),
    },
    from: jest.fn().mockReturnValue(mockChain),
    _chain: mockChain,
  };
};

describe('/api/nutrition/goals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/nutrition/goals', () => {
    it('should return user goals when authenticated', async () => {
      const mockGoals = {
        user_id: 'user-123',
        daily_calorie_goal: 2000,
        daily_protein_goal_g: 150,
        daily_carbs_goal_g: 250,
        daily_fat_goal_g: 65,
        daily_fiber_goal_g: 25,
      };

      const mockSupabase = createMockSupabase();
      mockSupabase._chain.single.mockResolvedValue({ data: mockGoals, error: null });
      const { createClient } = require('@/utils/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new NextRequest('http://localhost/api/nutrition/goals');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.goals).toEqual(mockGoals);
    });

    it('should return null goals when no goals exist (PGRST116)', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase._chain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' },
      });
      const { createClient } = require('@/utils/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new NextRequest('http://localhost/api/nutrition/goals');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.goals).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
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

      const request = new NextRequest('http://localhost/api/nutrition/goals');
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

      const request = new NextRequest('http://localhost/api/nutrition/goals');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 500 when DB query fails with non-PGRST116 error', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase._chain.single.mockResolvedValue({
        data: null,
        error: { code: 'DB_ERROR', message: 'Connection failed' },
      });
      const { createClient } = require('@/utils/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new NextRequest('http://localhost/api/nutrition/goals');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/nutrition/goals', () => {
    const validGoalsPayload = {
      daily_calorie_goal: 2000,
      daily_protein_goal_g: 150,
      daily_carbs_goal_g: 250,
      daily_fat_goal_g: 65,
      daily_fiber_goal_g: 25,
      activity_level: 'moderately_active',
      weight_goal: 'maintain',
    };

    it('should create/update goals with valid payload', async () => {
      const savedGoals = { ...validGoalsPayload, user_id: 'user-123' };
      const mockSupabase = createMockSupabase();
      mockSupabase._chain.single.mockResolvedValue({ data: savedGoals, error: null });
      const { createClient } = require('@/utils/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new NextRequest('http://localhost/api/nutrition/goals', {
        method: 'POST',
        body: JSON.stringify(validGoalsPayload),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.goals).toEqual(savedGoals);
    });

    it('should return 401 when not authenticated', async () => {
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

      const request = new NextRequest('http://localhost/api/nutrition/goals', {
        method: 'POST',
        body: JSON.stringify(validGoalsPayload),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    describe('Required field validation', () => {
      it('should return 400 when daily_calorie_goal is missing', async () => {
        const { daily_calorie_goal, ...payload } = validGoalsPayload;
        const mockSupabase = createMockSupabase();
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('daily_calorie_goal');
      });

      it('should return 400 when daily_protein_goal_g is missing', async () => {
        const { daily_protein_goal_g, ...payload } = validGoalsPayload;
        const mockSupabase = createMockSupabase();
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('daily_protein_goal_g');
      });

      it('should return 400 when daily_carbs_goal_g is missing', async () => {
        const { daily_carbs_goal_g, ...payload } = validGoalsPayload;
        const mockSupabase = createMockSupabase();
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('daily_carbs_goal_g');
      });

      it('should return 400 when daily_fat_goal_g is missing', async () => {
        const { daily_fat_goal_g, ...payload } = validGoalsPayload;
        const mockSupabase = createMockSupabase();
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('daily_fat_goal_g');
      });

      it('should return 400 when daily_fiber_goal_g is missing', async () => {
        const { daily_fiber_goal_g, ...payload } = validGoalsPayload;
        const mockSupabase = createMockSupabase();
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('daily_fiber_goal_g');
      });
    });

    describe('Numeric field validation', () => {
      it('should return 400 when daily_calorie_goal is a string', async () => {
        const mockSupabase = createMockSupabase();
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify({ ...validGoalsPayload, daily_calorie_goal: 'two thousand' }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('daily_calorie_goal');
      });

      it('should return 400 when daily_protein_goal_g is negative', async () => {
        const mockSupabase = createMockSupabase();
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify({ ...validGoalsPayload, daily_protein_goal_g: -10 }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('daily_protein_goal_g');
      });

      it('should return 400 when daily_calorie_goal is Infinity', async () => {
        const mockSupabase = createMockSupabase();
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify({ ...validGoalsPayload, daily_calorie_goal: Infinity }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);
        const data = await response.json();

        // JSON.stringify converts Infinity to null, which fails missing field validation
        expect(response.status).toBe(400);
      });

      it('should accept zero values for numeric fields', async () => {
        const savedGoals = { ...validGoalsPayload, daily_fiber_goal_g: 0, user_id: 'user-123' };
        const mockSupabase = createMockSupabase();
        mockSupabase._chain.single.mockResolvedValue({ data: savedGoals, error: null });
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify({ ...validGoalsPayload, daily_fiber_goal_g: 0 }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);

        expect(response.status).toBe(200);
      });
    });

    describe('Activity level validation', () => {
      it.each([
        'sedentary',
        'lightly_active',
        'moderately_active',
        'very_active',
        'super_active',
      ])('should accept valid activity_level: %s', async (activityLevel) => {
        const savedGoals = { ...validGoalsPayload, activity_level: activityLevel, user_id: 'user-123' };
        const mockSupabase = createMockSupabase();
        mockSupabase._chain.single.mockResolvedValue({ data: savedGoals, error: null });
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify({ ...validGoalsPayload, activity_level: activityLevel }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);

        expect(response.status).toBe(200);
      });

      it('should return 400 for invalid activity_level', async () => {
        const mockSupabase = createMockSupabase();
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify({ ...validGoalsPayload, activity_level: 'very_lazy' }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Invalid activity_level');
      });

      it('should accept missing activity_level (optional field)', async () => {
        const { activity_level, ...payloadWithoutActivity } = validGoalsPayload;
        const savedGoals = { ...payloadWithoutActivity, user_id: 'user-123' };
        const mockSupabase = createMockSupabase();
        mockSupabase._chain.single.mockResolvedValue({ data: savedGoals, error: null });
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify(payloadWithoutActivity),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);

        expect(response.status).toBe(200);
      });
    });

    describe('Weight goal validation', () => {
      it.each(['lose', 'maintain', 'gain'])(
        'should accept valid weight_goal: %s',
        async (weightGoal) => {
          const savedGoals = { ...validGoalsPayload, weight_goal: weightGoal, user_id: 'user-123' };
          const mockSupabase = createMockSupabase();
          mockSupabase._chain.single.mockResolvedValue({ data: savedGoals, error: null });
          const { createClient } = require('@/utils/supabase/server');
          createClient.mockResolvedValue(mockSupabase);

          const request = new NextRequest('http://localhost/api/nutrition/goals', {
            method: 'POST',
            body: JSON.stringify({ ...validGoalsPayload, weight_goal: weightGoal }),
            headers: { 'Content-Type': 'application/json' },
          });
          const response = await POST(request);

          expect(response.status).toBe(200);
        },
      );

      it('should return 400 for invalid weight_goal', async () => {
        const mockSupabase = createMockSupabase();
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify({ ...validGoalsPayload, weight_goal: 'bulk' }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Invalid weight_goal');
      });

      it('should accept missing weight_goal (optional field)', async () => {
        const { weight_goal, ...payloadWithoutGoal } = validGoalsPayload;
        const savedGoals = { ...payloadWithoutGoal, user_id: 'user-123' };
        const mockSupabase = createMockSupabase();
        mockSupabase._chain.single.mockResolvedValue({ data: savedGoals, error: null });
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify(payloadWithoutGoal),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);

        expect(response.status).toBe(200);
      });
    });

    describe('Error handling', () => {
      it('should return 500 when upsert fails', async () => {
        const mockSupabase = createMockSupabase();
        mockSupabase._chain.single.mockResolvedValue({
          data: null,
          error: new Error('DB connection failed'),
        });
        const { createClient } = require('@/utils/supabase/server');
        createClient.mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/nutrition/goals', {
          method: 'POST',
          body: JSON.stringify(validGoalsPayload),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
      });
    });
  });
});