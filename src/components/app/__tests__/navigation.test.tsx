import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { AppNavigation } from '../navigation';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
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

// Mock Supabase client
const mockSignOut = jest.fn();
const mockSupabaseClient = {
  auth: {
    signOut: mockSignOut,
  },
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

// Mock logger
const mockLogAuthEvent = jest.fn();
jest.mock('@/lib/logger', () => ({
  logAuthEvent: mockLogAuthEvent,
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, className, ...props }: any) => (
    <button className={className} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children, align }: any) => (
    <div data-testid="dropdown-content" data-align={align}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick, disabled, asChild }: any) => {
    if (asChild) {
      return <div data-testid="dropdown-item">{children}</div>;
    }
    return (
      <div
        data-testid="dropdown-item"
        onClick={onClick}
        aria-disabled={disabled}
      >
        {children}
      </div>
    );
  },
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Activity: () => <svg data-testid="activity-icon" />,
  Camera: () => <svg data-testid="camera-icon" />,
  User: () => <svg data-testid="user-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
  LogOut: () => <svg data-testid="logout-icon" />,
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};

describe('AppNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue({ error: null });
  });

  describe('Basic rendering', () => {
    it('should render the navigation bar', () => {
      render(<AppNavigation user={mockUser as any} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should render the AI Fitness Coach brand link', () => {
      render(<AppNavigation user={mockUser as any} />);
      const brandLink = screen.getByText('AI Fitness Coach');
      expect(brandLink).toBeInTheDocument();
      expect(brandLink.closest('a')).toHaveAttribute('href', '/app');
    });

    it('should render Dashboard navigation link', () => {
      render(<AppNavigation user={mockUser as any} />);
      const dashboardLink = screen.getByText('Dashboard');
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink.closest('a')).toHaveAttribute('href', '/app');
    });

    it('should render Calorie Tracker navigation link', () => {
      render(<AppNavigation user={mockUser as any} />);
      const calorieLink = screen.getByText('Calorie Tracker');
      expect(calorieLink).toBeInTheDocument();
      expect(calorieLink.closest('a')).toHaveAttribute('href', '/app/calorie-tracker');
    });

    it('should render Profile navigation link', () => {
      render(<AppNavigation user={mockUser as any} />);
      const profileLink = screen.getByText('Profile');
      expect(profileLink).toBeInTheDocument();
      expect(profileLink.closest('a')).toHaveAttribute('href', '/app/profile');
    });

    it('should display user email in dropdown', () => {
      render(<AppNavigation user={mockUser as any} />);
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should render sign out option', () => {
      render(<AppNavigation user={mockUser as any} />);
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('should render Settings link in dropdown', () => {
      render(<AppNavigation user={mockUser as any} />);
      const settingsLink = screen.getByText('Settings');
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink.closest('a')).toHaveAttribute('href', '/app/profile');
    });
  });

  describe('Sign out functionality', () => {
    it('should call logAuthEvent with logout_attempt when signing out', async () => {
      render(<AppNavigation user={mockUser as any} />);

      const signOutItem = screen.getByText('Sign out').closest('[data-testid="dropdown-item"]');
      fireEvent.click(signOutItem!);

      await waitFor(() => {
        expect(mockLogAuthEvent).toHaveBeenCalledWith('logout_attempt', 'user-123');
      });
    });

    it('should call supabase signOut when signing out', async () => {
      render(<AppNavigation user={mockUser as any} />);

      const signOutItem = screen.getByText('Sign out').closest('[data-testid="dropdown-item"]');
      fireEvent.click(signOutItem!);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it('should redirect to / after successful sign out', async () => {
      render(<AppNavigation user={mockUser as any} />);

      const signOutItem = screen.getByText('Sign out').closest('[data-testid="dropdown-item"]');
      fireEvent.click(signOutItem!);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should call logAuthEvent with logout_success after successful sign out', async () => {
      render(<AppNavigation user={mockUser as any} />);

      const signOutItem = screen.getByText('Sign out').closest('[data-testid="dropdown-item"]');
      fireEvent.click(signOutItem!);

      await waitFor(() => {
        expect(mockLogAuthEvent).toHaveBeenCalledWith('logout_success', 'user-123');
      });
    });

    it('should show loading state during sign out', async () => {
      let resolveSignOut: (value: any) => void;
      mockSignOut.mockReturnValue(
        new Promise((resolve) => {
          resolveSignOut = resolve;
        }),
      );

      render(<AppNavigation user={mockUser as any} />);

      const signOutItem = screen.getByText('Sign out').closest('[data-testid="dropdown-item"]');
      fireEvent.click(signOutItem!);

      await waitFor(() => {
        expect(screen.getByText('Signing out...')).toBeInTheDocument();
      });

      resolveSignOut!({ error: null });

      await waitFor(() => {
        expect(screen.queryByText('Signing out...')).not.toBeInTheDocument();
      });
    });

    it('should not redirect when sign out fails', async () => {
      mockSignOut.mockResolvedValue({ error: new Error('Sign out failed') });

      render(<AppNavigation user={mockUser as any} />);

      const signOutItem = screen.getByText('Sign out').closest('[data-testid="dropdown-item"]');
      fireEvent.click(signOutItem!);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });

      expect(mockPush).not.toHaveBeenCalledWith('/');
    });
  });

  describe('Different user emails', () => {
    it('should render user email correctly', () => {
      const user = { ...mockUser, email: 'admin@company.com' };
      render(<AppNavigation user={user as any} />);
      expect(screen.getByText('admin@company.com')).toBeInTheDocument();
    });

    it('should pass correct user id to logAuthEvent', async () => {
      const user = { ...mockUser, id: 'different-user-id' };
      render(<AppNavigation user={user as any} />);

      const signOutItem = screen.getByText('Sign out').closest('[data-testid="dropdown-item"]');
      fireEvent.click(signOutItem!);

      await waitFor(() => {
        expect(mockLogAuthEvent).toHaveBeenCalledWith('logout_attempt', 'different-user-id');
      });
    });
  });

  describe('Navigation icons', () => {
    it('should render activity icon next to Dashboard', () => {
      render(<AppNavigation user={mockUser as any} />);
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    });

    it('should render camera icon next to Calorie Tracker', () => {
      render(<AppNavigation user={mockUser as any} />);
      expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
    });

    it('should render logout icon next to Sign out', () => {
      render(<AppNavigation user={mockUser as any} />);
      expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
    });
  });
});