import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/utils/supabase/server');
jest.mock('@/lib/inngest/client');
jest.mock('@/lib/logger');

describe('/api/nutrition/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upload image and trigger processing', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('image', mockFile);
    formData.append('notes', 'Test meal');

    const request = new NextRequest('http://localhost/api/nutrition/upload', {
      method: 'POST',
      body: formData,
    });

    // Mock Supabase
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn().mockResolvedValue({
          data: { path: 'user-123/test.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test.jpg' },
        }),
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'log-123' },
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };

    const { createClient } = require('@/utils/supabase/server');
    createClient.mockResolvedValue(mockSupabase);

    // Mock Inngest
    const { inngest } = require('@/lib/inngest/client');
    inngest.send = jest.fn().mockResolvedValue({});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.logId).toBe('log-123');
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'food/image.uploaded',
      data: {
        imageUrl: 'https://example.com/test.jpg',
        userId: 'user-123',
        logId: 'log-123',
      },
    });
  });

  it('should return error when no image is provided', async () => {
    const formData = new FormData();
    formData.append('notes', 'Test meal');

    const request = new NextRequest('http://localhost/api/nutrition/upload', {
      method: 'POST',
      body: formData,
    });

    // Mock authenticated user
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    };

    const { createClient } = require('@/utils/supabase/server');
    createClient.mockResolvedValue(mockSupabase);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No image provided');
  });

  it('should return error when user is not authenticated', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('image', mockFile);

    const request = new NextRequest('http://localhost/api/nutrition/upload', {
      method: 'POST',
      body: formData,
    });

    // Mock unauthenticated user
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    };

    const { createClient } = require('@/utils/supabase/server');
    createClient.mockResolvedValue(mockSupabase);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });
}); 