import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock Next.js navigation with redirect
const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

// Mock Supabase server
const mockGetUser = jest.fn();
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

const mockUser = {
  id: 'user-123',
  email: 'testuser@example.com',
};

describe('CalorieTrackerLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to /login when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { createClient } = require('@/utils/supabase/server');
    createClient.mockResolvedValue({ auth: { getUser: mockGetUser } });

    const { default: CalorieTrackerLayout } = await import('../layout');
    await CalorieTrackerLayout({ children: <div>Test</div> });

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should redirect to /login when auth error occurs', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Auth failed'),
    });
    const { createClient } = require('@/utils/supabase/server');
    createClient.mockResolvedValue({ auth: { getUser: mockGetUser } });

    const { default: CalorieTrackerLayout } = await import('../layout');
    await CalorieTrackerLayout({ children: <div>Test</div> });

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should not redirect when user is authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const { createClient } = require('@/utils/supabase/server');
    createClient.mockResolvedValue({ auth: { getUser: mockGetUser } });

    const { default: CalorieTrackerLayout } = await import('../layout');
    await CalorieTrackerLayout({ children: <div>Test</div> });

    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('should render navigation with app title when authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const { createClient } = require('@/utils/supabase/server');
    createClient.mockResolvedValue({ auth: { getUser: mockGetUser } });

    const { default: CalorieTrackerLayout } = await import('../layout');
    const result = await CalorieTrackerLayout({ children: <div data-testid="test-child">Child</div> });

    const { container } = render(result as React.ReactElement);
    expect(container.textContent).toContain('AI Fitness Coach');
  });

  it('should display user email in navigation when authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const { createClient } = require('@/utils/supabase/server');
    createClient.mockResolvedValue({ auth: { getUser: mockGetUser } });

    const { default: CalorieTrackerLayout } = await import('../layout');
    const result = await CalorieTrackerLayout({ children: <div>Test</div> });

    const { container } = render(result as React.ReactElement);
    expect(container.textContent).toContain('testuser@example.com');
  });

  it('should render children content when authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const { createClient } = require('@/utils/supabase/server');
    createClient.mockResolvedValue({ auth: { getUser: mockGetUser } });

    const { default: CalorieTrackerLayout } = await import('../layout');
    const result = await CalorieTrackerLayout({
      children: <div data-testid="test-child">Child Content</div>,
    });

    const { getByTestId } = render(result as React.ReactElement);
    expect(getByTestId('test-child')).toBeInTheDocument();
  });
});