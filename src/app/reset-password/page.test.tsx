import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import ResetPasswordPage from './page';
import { createClient } from '@/utils/supabase/client';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('ResetPasswordPage', () => {
  const mockPush = jest.fn();
  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn(),
      setSession: jest.fn(),
      updateUser: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });
    
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Session Validation', () => {
    it('shows invalid session message when no session exists', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null } });
      
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
        expect(screen.getByText(/this password reset link is invalid or has expired/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
      });
    });

    it('shows form when valid session exists', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({ 
        data: { session: { user: { id: 'test-user' } } } 
      });
      
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/reset your password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      });
    });

    it('validates session from URL parameters when no current session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null } });
      mockSupabaseClient.auth.setSession.mockResolvedValue({ error: null });
      
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockImplementation((param) => {
          if (param === 'access_token') return 'test-access-token';
          if (param === 'refresh_token') return 'test-refresh-token';
          return null;
        }),
      });
      
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
        });
      });
    });

    it('shows invalid session when URL session setting fails', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null } });
      mockSupabaseClient.auth.setSession.mockResolvedValue({ error: { message: 'Invalid token' } });
      
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockImplementation((param) => {
          if (param === 'access_token') return 'invalid-token';
          if (param === 'refresh_token') return 'invalid-token';
          return null;
        }),
      });
      
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({ 
        data: { session: { user: { id: 'test-user' } } } 
      });
    });

    it('validates minimum password length', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
      });
    });

    it('validates password requires lowercase letter', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: 'PASSWORD123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'PASSWORD123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one lowercase letter/i)).toBeInTheDocument();
      });
    });

    it('validates password requires uppercase letter', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
      });
    });

    it('validates password requires number', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: 'Password' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one number/i)).toBeInTheDocument();
      });
    });

    it('validates passwords match', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: 'Password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Different123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('accepts valid password', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValue({ error: null });
      
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
          password: 'ValidPassword123'
        });
      });
    });
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({ 
        data: { session: { user: { id: 'test-user' } } } 
      });
    });

    it('toggles password visibility', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const toggleButton = passwordInput.parentElement?.querySelector('button');
      
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      if (toggleButton) {
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
        
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });

    it('toggles confirm password visibility', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      });

      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const toggleButton = confirmPasswordInput.parentElement?.querySelector('button');
      
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      
      if (toggleButton) {
        fireEvent.click(toggleButton);
        expect(confirmPasswordInput).toHaveAttribute('type', 'text');
        
        fireEvent.click(toggleButton);
        expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      }
    });

    it('disables form while loading', async () => {
      mockSupabaseClient.auth.updateUser.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 1000))
      );
      
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/updating password/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(confirmPasswordInput).toBeDisabled();
      });
    });

    it('enables submit button only when form is valid', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      expect(submitButton).toBeDisabled();
      
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
      expect(submitButton).toBeDisabled();
      
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Successful Password Reset', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({ 
        data: { session: { user: { id: 'test-user' } } } 
      });
      mockSupabaseClient.auth.updateUser.mockResolvedValue({ error: null });
    });

    it('shows success message and redirects after successful update', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password reset complete/i)).toBeInTheDocument();
        expect(screen.getByText(/your password has been successfully updated/i)).toBeInTheDocument();
        expect(screen.getByText(/you will be redirected to the login page/i)).toBeInTheDocument();
      });
      
      // Fast-forward timers to trigger redirect
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('provides immediate navigation option', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /go to login now/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({ 
        data: { session: { user: { id: 'test-user' } } } 
      });
    });

    it('displays API error messages', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValue({ 
        error: { message: 'Password is too weak' } 
      });
      
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password is too weak/i)).toBeInTheDocument();
      });
    });

    it('handles navigation errors gracefully', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValue({ error: null });
      mockPush.mockImplementation(() => {
        throw new Error('Navigation failed');
      });
      
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password reset complete/i)).toBeInTheDocument();
      });
      
      // Fast-forward timers to trigger failed navigation
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(screen.getByText(/navigation failed/i)).toBeInTheDocument();
      });
    });

    it('handles unexpected errors', async () => {
      mockSupabaseClient.auth.updateUser.mockRejectedValue(new Error('Unexpected error'));
      
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
      });
    });
  });

  describe('Component Cleanup', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({ 
        data: { session: { user: { id: 'test-user' } } } 
      });
      mockSupabaseClient.auth.updateUser.mockResolvedValue({ error: null });
    });

    it('cleans up timeout on component unmount', async () => {
      const { unmount } = render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password reset complete/i)).toBeInTheDocument();
      });
      
      // Unmount component before timeout completes
      unmount();
      
      // Fast-forward timers - should not cause navigation since component is unmounted
      jest.advanceTimersByTime(3000);
      
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({ 
        data: { session: { user: { id: 'test-user' } } } 
      });
    });

    it('has proper form labels and structure', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      
      expect(passwordInput).toHaveAttribute('id', 'password');
      expect(passwordInput).toHaveAttribute('required');
      expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword');
      expect(confirmPasswordInput).toHaveAttribute('required');
    });

    it('provides helpful password requirements text', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('has proper heading structure', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({ 
        data: { session: { user: { id: 'test-user' } } } 
      });
    });

    it('handles very long passwords', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValue({ error: null });
      
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const longPassword = 'A' + 'a'.repeat(100) + '1';
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: longPassword } });
      fireEvent.change(confirmPasswordInput, { target: { value: longPassword } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
          password: longPassword
        });
      });
    });

    it('handles special characters in passwords', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValue({ error: null });
      
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const specialPassword = 'Password123!@#$%^&*()';
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });
      
      fireEvent.change(passwordInput, { target: { value: specialPassword } });
      fireEvent.change(confirmPasswordInput, { target: { value: specialPassword } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
          password: specialPassword
        });
      });
    });
  });
});