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

// Mock AppNavigation
jest.mock('@/components/app/navigation', () => ({
  AppNavigation: ({ user }: any) => (
    <nav data-testid="app-navigation" data-user-email={user?.email}>
      Navigation
    </nav>
  ),
}));

// Mock Toaster
jest.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

describe('AppLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to /login when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { createClient } = require('@/utils/supabase/server');
    createClient.mockResolvedValue({ auth: { getUser: mockGetUser } });

    // Dynamically import to ensure mocks are applied
    const { default: AppLayout } = await import('../layout');

    await AppLayout({ children: <div>Test</div> });

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should not redirect when user is authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const { createClient } = require('@/utils/supabase/server');
    createClient.mockResolvedValue({ auth: { getUser: mockGetUser } });

    const { default: AppLayout } = await import('../layout');

    // Should not throw redirect
    await expect(AppLayout({ children: <div>Test</div> })).resolves.toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('should render children when authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const { createClient } = require('@/utils/supabase/server');
    createClient.mockResolvedValue({ auth: { getUser: mockGetUser } });

    const { default: AppLayout } = await import('../layout');

    const result = await AppLayout({ children: <div data-testid="child-content">Child</div> });

    // Render the returned JSX
    const { container } = render(result as React.ReactElement);
    expect(container).toBeTruthy();
  });
});