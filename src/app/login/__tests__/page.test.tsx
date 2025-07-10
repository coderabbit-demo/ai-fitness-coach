import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import LoginPage from '../page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    resetPasswordForEmail: jest.fn(),
  },
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  clientLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  logError: jest.fn(),
  logAuthEvent: jest.fn(),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader">Loading...</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  EyeOff: () => <div data-testid="eye-off-icon">EyeOff</div>,
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
  CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
        search: '',
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Initial Render Tests
  describe('Initial Render', () => {
    it('should render login form by default', () => {
      render(<LoginPage />);
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your AI Fitness Coach account')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should not render full name field in login mode', () => {
      render(<LoginPage />);
      
      expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
    });

    it('should render forgot password link in login mode', () => {
      render(<LoginPage />);
      
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    });

    it('should render sign up link in login mode', () => {
      render(<LoginPage />);
      
      expect(screen.getByText('Sign up')).toBeInTheDocument();
    });
  });

  // Mode Switching Tests
  describe('Mode Switching', () => {
    it('should switch to signup mode when sign up link is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('Join AI Fitness Coach and start your fitness journey')).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should switch back to login mode when sign in link is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      // Switch to signup
      await user.click(screen.getByText('Sign up'));
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      
      // Switch back to login
      await user.click(screen.getByText('Sign in'));
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    it('should clear form when switching modes', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      // Fill form in login mode
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      // Switch to signup mode
      await user.click(screen.getByText('Sign up'));
      
      // Password should be cleared
      expect(screen.getByLabelText(/password/i)).toHaveValue('');
      // Email should remain
      expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com');
    });
  });

  // Password Validation Tests
  describe('Password Validation', () => {
    it('should validate password length in signup mode', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/^password/i), 'short');
      await user.type(screen.getByLabelText(/confirm password/i), 'short');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });

    it('should validate password contains lowercase letter', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/^password/i), 'PASSWORD123');
      await user.type(screen.getByLabelText(/confirm password/i), 'PASSWORD123');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      expect(screen.getByText('Password must contain at least one lowercase letter')).toBeInTheDocument();
    });

    it('should validate password contains uppercase letter', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/^password/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument();
    });

    it('should validate password contains number', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/^password/i), 'Password');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument();
    });

    it('should validate passwords match in signup mode', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/^password/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPassword123');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('should accept valid password in signup mode', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });
      
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/^password/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Password123',
          options: {
            data: { full_name: 'Test User' },
            emailRedirectTo: 'http://localhost:3000/profile',
          },
        });
      });
    });
  });

  // Password Visibility Tests
  describe('Password Visibility', () => {
    it('should toggle password visibility in login mode', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = passwordInput.parentElement?.querySelector('button');
      
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
        
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });

    it('should toggle confirm password visibility in signup mode', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const toggleButton = confirmPasswordInput.parentElement?.querySelector('button');
      
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      
      if (toggleButton) {
        await user.click(toggleButton);
        expect(confirmPasswordInput).toHaveAttribute('type', 'text');
        
        await user.click(toggleButton);
        expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      }
    });
  });

  // Login Flow Tests
  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: '123', email: 'test@example.com' }, session: { access_token: 'token' } },
        error: null,
      });
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Password123',
        });
      });
      
      expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('should handle login errors', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' },
      });
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
      });
    });

    it('should show loading state during login', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { user: { id: '123' }, session: { access_token: 'token' } },
          error: null,
        }), 100))
      );
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });
  });

  // Signup Flow Tests
  describe('Signup Flow', () => {
    it('should successfully signup with valid data', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });
      
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/^password/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/account created successfully/i)).toBeInTheDocument();
      });
      
      // Should switch back to login mode
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    it('should handle signup errors', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: null,
        error: { message: 'Email already registered' },
      });
      
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/^password/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Email already registered')).toBeInTheDocument();
      });
    });

    it('should show loading state during signup', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { user: { id: '123' } },
          error: null,
        }), 100))
      );
      
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/^password/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });
  });

  // Forgot Password Tests
  describe('Forgot Password', () => {
    it('should send password reset email', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
        data: {},
        error: null,
      });
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByText('Forgot your password?'));
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          { redirectTo: 'http://localhost:3000/reset-password' }
        );
      });
      
      expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument();
    });

    it('should require email for password reset', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await user.click(screen.getByText('Forgot your password?'));
      
      expect(screen.getByText('Please enter your email address first')).toBeInTheDocument();
    });

    it('should handle password reset errors', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
        data: null,
        error: { message: 'Email not found' },
      });
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'nonexistent@example.com');
      await user.click(screen.getByText('Forgot your password?'));
      
      await waitFor(() => {
        expect(screen.getByText('Email not found')).toBeInTheDocument();
      });
    });
  });

  // Form Validation Tests
  describe('Form Validation', () => {
    it('should disable submit button when form is invalid in login mode', () => {
      render(<LoginPage />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when form is valid in login mode', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should disable submit button when form is invalid in signup mode', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when form is valid in signup mode', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/^password/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle unexpected errors during login', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValueOnce(new Error('Network error'));
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle unexpected errors during signup', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockRejectedValueOnce(new Error('Network error'));
      
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/^password/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle unexpected errors during password reset', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.resetPasswordForEmail.mockRejectedValueOnce(new Error('Network error'));
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByText('Forgot your password?'));
      
      await waitFor(() => {
        expect(screen.getByText('Failed to send password reset email. Please try again.')).toBeInTheDocument();
      });
    });
  });

  // Edge Cases Tests
  describe('Edge Cases', () => {
    it('should handle empty strings in form fields', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), '   ');
      await user.type(screen.getByLabelText(/password/i), '   ');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeDisabled();
    });

    it('should handle very long input values', async () => {
      const user = userEvent.setup();
      const longEmail = 'a'.repeat(100) + '@example.com';
      const longPassword = 'P'.repeat(100) + 'assword123';
      const longName = 'T'.repeat(100) + 'est User';
      
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByLabelText(/email/i), longEmail);
      await user.type(screen.getByLabelText(/full name/i), longName);
      await user.type(screen.getByLabelText(/^password/i), longPassword);
      await user.type(screen.getByLabelText(/confirm password/i), longPassword);
      
      expect(screen.getByLabelText(/email/i)).toHaveValue(longEmail);
      expect(screen.getByLabelText(/full name/i)).toHaveValue(longName);
      expect(screen.getByLabelText(/^password/i)).toHaveValue(longPassword);
      expect(screen.getByLabelText(/confirm password/i)).toHaveValue(longPassword);
    });

    it('should handle special characters in email', async () => {
      const user = userEvent.setup();
      const specialEmail = 'test+special.email@example-domain.com';
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), specialEmail);
      
      expect(screen.getByLabelText(/email/i)).toHaveValue(specialEmail);
    });

    it('should prevent form submission when loading', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { user: { id: '123' } },
          error: null,
        }), 1000))
      );
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Try to submit again while loading
      const loadingButton = screen.getByRole('button', { name: /signing in/i });
      expect(loadingButton).toBeDisabled();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<LoginPage />);
      
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
    });

    it('should have proper form labels in signup mode', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await user.click(screen.getByText('Sign up'));
      
      expect(screen.getByLabelText(/full name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'password');
    });

    it('should have proper button roles', () => {
      render(<LoginPage />);
      
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should have proper aria attributes for required fields', () => {
      render(<LoginPage />);
      
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('required');
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const { rerender } = render(<LoginPage />);
      
      // Re-render with same props
      rerender(<LoginPage />);
      
      // Should not cause any issues
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    it('should cleanup on unmount', () => {
      const { unmount } = render(<LoginPage />);
      
      expect(() => unmount()).not.toThrow();
    });
  });

  // Integration Tests
  describe('Integration Scenarios', () => {
    it('should handle full signup to login flow', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });
      
      render(<LoginPage />);
      
      // Start with signup
      await user.click(screen.getByText('Sign up'));
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/^password/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      // Should switch to login mode after successful signup
      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      });
      
      // Form should be cleared except email
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
      expect(screen.getByLabelText(/password/i)).toHaveValue('');
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus();
    });

    it('should handle Enter key submission', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: '123' }, session: { access_token: 'token' } },
        error: null,
      });
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123');
      
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled();
      });
    });
  });
});