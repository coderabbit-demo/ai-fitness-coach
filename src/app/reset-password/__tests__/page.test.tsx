import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import ResetPasswordPage from '../page';

// Mock Next.js navigation hooks
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Mock Supabase client
const mockAuth = {
  getSession: jest.fn(),
  setSession: jest.fn(),
  updateUser: jest.fn(),
};

const mockSupabaseClient = {
  auth: mockAuth,
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader2" className={className} />,
  Lock: ({ className }: { className?: string }) => <div data-testid="lock" className={className} />,
  Eye: ({ className }: { className?: string }) => <div data-testid="eye" className={className} />,
  EyeOff: ({ className }: { className?: string }) => <div data-testid="eye-off" className={className} />,
  CheckCircle: ({ className }: { className?: string }) => <div data-testid="check-circle" className={className} />,
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div role="alert" {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Session Validation', () => {
    test('shows invalid session message when no session exists', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
        expect(screen.getByText('This password reset link is invalid or has expired.')).toBeInTheDocument();
        expect(screen.getByText('Go to Login')).toBeInTheDocument();
      });
    });

    test('shows invalid session message when session exists but no tokens in URL', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } });
      
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
      });
    });

    test('validates session from URL parameters', async () => {
      const mockUseSearchParams = jest.requireMock('next/navigation').useSearchParams;
      mockUseSearchParams.mockReturnValue({
        get: jest.fn().mockImplementation((key) => {
          if (key === 'access_token') return 'valid-access-token';
          if (key === 'refresh_token') return 'valid-refresh-token';
          return null;
        }),
      });

      mockAuth.getSession.mockResolvedValue({ data: { session: null } });
      mockAuth.setSession.mockResolvedValue({ error: null });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(mockAuth.setSession).toHaveBeenCalledWith({
          access_token: 'valid-access-token',
          refresh_token: 'valid-refresh-token',
        });
      });
    });

    test('shows reset form when valid session exists', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
      });
    });

    test('handles session validation errors gracefully', async () => {
      mockAuth.getSession.mockRejectedValue(new Error('Session check failed'));

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
      });
    });
  });

  describe('Password Reset Form', () => {
    beforeEach(() => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });
    });

    test('renders password reset form with all required fields', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
        expect(screen.getByText('Update Password')).toBeInTheDocument();
        expect(screen.getByText('Back to Login')).toBeInTheDocument();
      });
    });

    test('shows password visibility toggle buttons', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const eyeIcons = screen.getAllByTestId('eye');
        expect(eyeIcons).toHaveLength(2);
      });
    });

    test('toggles password visibility', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const toggleButton = passwordInput.parentElement?.querySelector('button');
        
        expect(passwordInput).toHaveAttribute('type', 'password');
        
        if (toggleButton) {
          fireEvent.click(toggleButton);
          expect(passwordInput).toHaveAttribute('type', 'text');
          
          fireEvent.click(toggleButton);
          expect(passwordInput).toHaveAttribute('type', 'password');
        }
      });
    });

    test('shows password requirements hint', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/)).toBeInTheDocument();
      });
    });

    test('form submission is disabled when fields are empty', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const submitButton = screen.getByText('Update Password');
        expect(submitButton).toBeDisabled();
      });
    });

    test('form submission is enabled when both fields are filled', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });

        expect(submitButton).toBeEnabled();
      });
    });
  });

  describe('Password Validation', () => {
    beforeEach(() => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });
    });

    test('validates minimum password length', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'short' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });
    });

    test('validates lowercase letter requirement', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'PASSWORD123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'PASSWORD123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one lowercase letter')).toBeInTheDocument();
      });
    });

    test('validates uppercase letter requirement', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument();
      });
    });

    test('validates number requirement', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'Password' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'Password' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument();
      });
    });

    test('validates password match requirement', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'Password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    test('accepts valid password', async () => {
      mockAuth.updateUser.mockResolvedValue({ error: null });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockAuth.updateUser).toHaveBeenCalledWith({
          password: 'ValidPassword123'
        });
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });
    });

    test('shows loading state during password update', async () => {
      let resolveUpdateUser: (value: any) => void;
      const updateUserPromise = new Promise(resolve => {
        resolveUpdateUser = resolve;
      });
      mockAuth.updateUser.mockReturnValue(updateUserPromise);

      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Updating password...')).toBeInTheDocument();
        expect(screen.getByTestId('loader2')).toBeInTheDocument();
      });

      // Resolve the promise
      resolveUpdateUser!({ error: null });
    });

    test('shows success message on successful password update', async () => {
      mockAuth.updateUser.mockResolvedValue({ error: null });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Password updated successfully!')).toBeInTheDocument();
      });
    });

    test('handles Supabase update errors', async () => {
      mockAuth.updateUser.mockResolvedValue({
        error: { message: 'Password update failed' }
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Password update failed')).toBeInTheDocument();
      });
    });

    test('handles unexpected errors during password update', async () => {
      mockAuth.updateUser.mockRejectedValue(new Error('Network error'));

      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
      });
    });

    test('prevents form submission while loading', async () => {
      let resolveUpdateUser: (value: any) => void;
      const updateUserPromise = new Promise(resolve => {
        resolveUpdateUser = resolve;
      });
      mockAuth.updateUser.mockReturnValue(updateUserPromise);

      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        const loadingButton = screen.getByText('Updating password...');
        expect(loadingButton).toBeDisabled();
      });

      resolveUpdateUser!({ error: null });
    });
  });

  describe('Success State', () => {
    beforeEach(() => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });
      mockAuth.updateUser.mockResolvedValue({ error: null });
    });

    test('shows completion state after successful password update', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Password Reset Complete')).toBeInTheDocument();
        expect(screen.getByText('Your password has been successfully updated.')).toBeInTheDocument();
        expect(screen.getByTestId('check-circle')).toBeInTheDocument();
      });
    });

    test('shows immediate login button in completion state', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Go to Login Now')).toBeInTheDocument();
      });
    });

    test('automatically redirects to login after successful update', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Password Reset Complete')).toBeInTheDocument();
      });

      // Fast-forward time to trigger the redirect
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    test('handles navigation errors gracefully', async () => {
      mockPush.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Password Reset Complete')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText(/Navigation failed/)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });
    });

    test('updates password input value', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        fireEvent.change(passwordInput, { target: { value: 'TestPassword123' } });
        expect(passwordInput).toHaveValue('TestPassword123');
      });
    });

    test('updates confirm password input value', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        fireEvent.change(confirmPasswordInput, { target: { value: 'TestPassword123' } });
        expect(confirmPasswordInput).toHaveValue('TestPassword123');
      });
    });

    test('handles form submission via enter key', async () => {
      mockAuth.updateUser.mockResolvedValue({ error: null });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

        fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.keyDown(confirmPasswordInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(mockAuth.updateUser).toHaveBeenCalledWith({
          password: 'ValidPassword123'
        });
      });
    });

    test('handles keyboard navigation', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

        passwordInput.focus();
        expect(document.activeElement).toBe(passwordInput);

        fireEvent.keyDown(passwordInput, { key: 'Tab' });
        // Note: jsdom doesn't handle focus changes automatically, so we simulate it
        confirmPasswordInput.focus();
        expect(document.activeElement).toBe(confirmPasswordInput);
      });
    });
  });

  describe('Navigation Links', () => {
    beforeEach(() => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });
    });

    test('includes back to login link', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const backToLoginLink = screen.getByText('Back to Login');
        expect(backToLoginLink).toBeInTheDocument();
        expect(backToLoginLink.closest('a')).toHaveAttribute('href', '/login');
      });
    });

    test('back to login link is accessible', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const backToLoginLink = screen.getByText('Back to Login');
        expect(backToLoginLink).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles missing session data gracefully', async () => {
      mockAuth.getSession.mockResolvedValue({ data: {} });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
      });
    });

    test('handles empty password values', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: '' } });
        fireEvent.change(confirmPasswordInput, { target: { value: '' } });

        expect(submitButton).toBeDisabled();
      });
    });

    test('handles very long passwords', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        const longPassword = 'A'.repeat(1000) + 'a1';
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

        fireEvent.change(passwordInput, { target: { value: longPassword } });
        fireEvent.change(confirmPasswordInput, { target: { value: longPassword } });

        expect(passwordInput).toHaveValue(longPassword);
        expect(confirmPasswordInput).toHaveValue(longPassword);
      });
    });

    test('handles special characters in passwords', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });
      mockAuth.updateUser.mockResolvedValue({ error: null });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        const specialPassword = 'P@ssw0rd!#$%^&*()_+{}|:<>?[]\\;\'",./`~';
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: specialPassword } });
        fireEvent.change(confirmPasswordInput, { target: { value: specialPassword } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockAuth.updateUser).toHaveBeenCalledWith({
          password: 'P@ssw0rd!#$%^&*()_+{}|:<>?[]\\;\'",./`~'
        });
      });
    });
  });

  describe('Component Lifecycle', () => {
    test('cleans up timeout on unmount', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });
      mockAuth.updateUser.mockResolvedValue({ error: null });

      const { unmount } = render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Password Reset Complete')).toBeInTheDocument();
      });

      // Unmount before timeout completes
      unmount();

      // Fast-forward time
      jest.advanceTimersByTime(3000);

      // Router should not be called after unmount
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('handles rapid mount/unmount cycles', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });

      for (let i = 0; i < 5; i++) {
        const { unmount } = render(<ResetPasswordPage />);
        await waitFor(() => {
          expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
        });
        unmount();
      }

      // Should not cause any issues
      expect(mockAuth.getSession).toHaveBeenCalledTimes(5);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });
    });

    test('has proper form structure', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const form = screen.getByRole('form');
        expect(form).toBeInTheDocument();
      });
    });

    test('labels are properly associated with inputs', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        
        expect(passwordInput).toHaveAttribute('id', 'password');
        expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword');
      });
    });

    test('error messages have proper ARIA attributes', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        const submitButton = screen.getByText('Update Password');

        fireEvent.change(passwordInput, { target: { value: 'short' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        const errorMessage = screen.getByText('Password must be at least 8 characters long');
        expect(errorMessage.closest('[role="alert"]')).toBeInTheDocument();
      });
    });

    test('buttons have proper disabled states', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const submitButton = screen.getByText('Update Password');
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveAttribute('disabled');
      });
    });

    test('password inputs have proper type attributes', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
        
        expect(passwordInput).toHaveAttribute('type', 'password');
        expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      });
    });
  });

  describe('Performance', () => {
    test('renders within reasonable time', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });

      const startTime = performance.now();
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('handles multiple rapid state changes', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } }
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText('New Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

        // Rapid input changes
        for (let i = 0; i < 10; i++) {
          fireEvent.change(passwordInput, { target: { value: `Password${i}` } });
          fireEvent.change(confirmPasswordInput, { target: { value: `Password${i}` } });
        }

        expect(passwordInput).toHaveValue('Password9');
        expect(confirmPasswordInput).toHaveValue('Password9');
      });
    });
  });
});