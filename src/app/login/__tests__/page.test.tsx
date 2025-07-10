import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import LoginPage from '../page'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

// Mock Supabase client
const mockSignUp = jest.fn()
const mockSignInWithPassword = jest.fn()
const mockResetPasswordForEmail = jest.fn()
const mockAuth = {
  signUp: mockSignUp,
  signInWithPassword: mockSignInWithPassword,
  resetPasswordForEmail: mockResetPasswordForEmail,
}

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: mockAuth,
  })),
}))

// Mock logger
const mockClientLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const mockLogError = jest.fn()
const mockLogAuthEvent = jest.fn()

jest.mock('@/lib/logger', () => ({
  clientLogger: mockClientLogger,
  logError: mockLogError,
  logAuthEvent: mockLogAuthEvent,
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
}))

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader-icon">Loading...</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  EyeOff: () => <div data-testid="eye-off-icon">EyeOff</div>,
}))

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    })
  })

  describe('Component Rendering', () => {
    it('renders the login page with all required elements in login mode', () => {
      render(<LoginPage />)
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
      expect(screen.getByText('Sign in to your AI Fitness Coach account')).toBeInTheDocument()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('renders login form fields with correct attributes', () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(emailInput).toBeRequired()
      expect(passwordInput).toBeRequired()
    })

    it('renders forgot password button', () => {
      render(<LoginPage />)
      
      expect(screen.getByRole('button', { name: /forgot your password/i })).toBeInTheDocument()
    })

    it('renders sign up toggle button', () => {
      render(<LoginPage />)
      
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('switches to signup mode when sign up button is clicked', () => {
      render(<LoginPage />)
      
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.getByText('Join AI Fitness Coach and start your fitness journey')).toBeInTheDocument()
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    })

    it('renders password visibility toggle buttons', () => {
      render(<LoginPage />)
      
      const passwordToggle = screen.getByRole('button', { name: '' })
      expect(passwordToggle).toBeInTheDocument()
      
      fireEvent.click(passwordToggle)
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('validates required fields in login mode', () => {
      render(<LoginPage />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      // Button should be disabled when form is invalid
      expect(submitButton).toBeDisabled()
      
      // Fill in email
      const emailInput = screen.getByLabelText('Email address')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      
      // Still disabled without password
      expect(submitButton).toBeDisabled()
      
      // Fill in password
      const passwordInput = screen.getByLabelText('Password')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      // Now should be enabled
      expect(submitButton).not.toBeDisabled()
    })

    it('validates required fields in signup mode', () => {
      render(<LoginPage />)
      
      // Switch to signup mode
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      // Button should be disabled when form is invalid
      expect(submitButton).toBeDisabled()
      
      // Fill in all required fields
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123' } })
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Password123' } })
      
      // Now should be enabled
      expect(submitButton).not.toBeDisabled()
    })

    it('validates password strength in signup mode', async () => {
      render(<LoginPage />)
      
      // Switch to signup mode
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      // Fill in form with weak password
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'weak' } })
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'weak' } })
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument()
      })
    })

    it('validates password confirmation in signup mode', async () => {
      render(<LoginPage />)
      
      // Switch to signup mode
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      // Fill in form with mismatched passwords
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123' } })
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'DifferentPassword123' } })
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })
  })

  describe('Login Functionality', () => {
    it('handles successful login', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token123' }
      
      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      
      render(<LoginPage />)
      
      // Fill in form
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/profile')
      })
    })

    it('handles login error', async () => {
      const mockError = { message: 'Invalid credentials', code: 'invalid_credentials' }
      
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })
      
      render(<LoginPage />)
      
      // Fill in form
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })

    it('handles unexpected login error', async () => {
      mockSignInWithPassword.mockRejectedValue(new Error('Network error'))
      
      render(<LoginPage />)
      
      // Fill in form
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Signup Functionality', () => {
    it('handles successful signup', async () => {
      const mockUser = { id: '123', email: 'test@example.com', email_confirmed_at: null }
      
      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      })
      
      render(<LoginPage />)
      
      // Switch to signup mode
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      // Fill in form
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123' } })
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Password123' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Password123',
          options: {
            data: { full_name: 'John Doe' },
            emailRedirectTo: 'http://localhost:3000/profile',
          },
        })
      })
      
      await waitFor(() => {
        expect(screen.getByText(/account created successfully/i)).toBeInTheDocument()
      })
    })

    it('handles signup error', async () => {
      const mockError = { message: 'User already registered', code: 'user_already_registered' }
      
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })
      
      render(<LoginPage />)
      
      // Switch to signup mode
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      // Fill in form
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123' } })
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Password123' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('User already registered')).toBeInTheDocument()
      })
    })
  })

  describe('Password Reset Functionality', () => {
    it('handles successful password reset', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })
      
      render(<LoginPage />)
      
      // Fill in email
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      
      // Click forgot password
      const forgotPasswordButton = screen.getByRole('button', { name: /forgot your password/i })
      fireEvent.click(forgotPasswordButton)
      
      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
          redirectTo: 'http://localhost:3000/reset-password',
        })
      })
      
      await waitFor(() => {
        expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument()
      })
    })

    it('handles password reset error', async () => {
      const mockError = { message: 'Email not found', code: 'email_not_found' }
      
      mockResetPasswordForEmail.mockResolvedValue({
        data: {},
        error: mockError,
      })
      
      render(<LoginPage />)
      
      // Fill in email
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      
      // Click forgot password
      const forgotPasswordButton = screen.getByRole('button', { name: /forgot your password/i })
      fireEvent.click(forgotPasswordButton)
      
      await waitFor(() => {
        expect(screen.getByText('Email not found')).toBeInTheDocument()
      })
    })

    it('shows error when email is empty for password reset', async () => {
      render(<LoginPage />)
      
      // Click forgot password without filling email
      const forgotPasswordButton = screen.getByRole('button', { name: /forgot your password/i })
      fireEvent.click(forgotPasswordButton)
      
      await waitFor(() => {
        expect(screen.getByText('Please enter your email address first')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state during login', async () => {
      mockSignInWithPassword.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { user: null }, error: null }), 100))
      )
      
      render(<LoginPage />)
      
      // Fill in form
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)
      
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('shows loading state during signup', async () => {
      mockSignUp.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { user: null }, error: null }), 100))
      )
      
      render(<LoginPage />)
      
      // Switch to signup mode
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      // Fill in form
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123' } })
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Password123' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)
      
      expect(screen.getByText('Creating account...')).toBeInTheDocument()
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('disables form inputs during loading', async () => {
      mockSignInWithPassword.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { user: null }, error: null }), 100))
      )
      
      render(<LoginPage />)
      
      // Fill in form
      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)
      
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('User Experience Features', () => {
    it('toggles password visibility', () => {
      render(<LoginPage />)
      
      const passwordInput = screen.getByLabelText('Password')
      const toggleButtons = screen.getAllByRole('button', { name: '' })
      const passwordToggle = toggleButtons.find(button => 
        button.querySelector('[data-testid="eye-icon"]')
      )
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument()
      
      fireEvent.click(passwordToggle!)
      
      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument()
    })

    it('toggles confirm password visibility in signup mode', () => {
      render(<LoginPage />)
      
      // Switch to signup mode
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      const toggleButtons = screen.getAllByRole('button', { name: '' })
      const confirmPasswordToggle = toggleButtons.find(button => 
        button.parentElement?.querySelector('#confirmPassword')
      )
      
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      
      fireEvent.click(confirmPasswordToggle!)
      
      expect(confirmPasswordInput).toHaveAttribute('type', 'text')
    })

    it('clears form and switches to login mode after successful signup', async () => {
      const mockUser = { id: '123', email: 'test@example.com', email_confirmed_at: null }
      
      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      })
      
      render(<LoginPage />)
      
      // Switch to signup mode
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      // Fill in form
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123' } })
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Password123' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument()
      })
      
      // Verify form is cleared
      expect(screen.getByLabelText('Email address')).toHaveValue('')
      expect(screen.getByLabelText('Password')).toHaveValue('')
    })
  })

  describe('Logging Integration', () => {
    it('logs page initialization', () => {
      render(<LoginPage />)
      
      expect(mockClientLogger.info).toHaveBeenCalledWith(
        'Login page initialized',
        expect.objectContaining({
          currentMode: 'login',
          timestamp: expect.any(String),
        })
      )
    })

    it('logs authentication attempts', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' }, session: {} },
        error: null,
      })
      
      render(<LoginPage />)
      
      // Fill in form
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockLogAuthEvent).toHaveBeenCalledWith(
          'login_attempt',
          undefined,
          expect.objectContaining({
            email: 'tes***@example.com',
          })
        )
      })
    })

    it('logs form field updates', () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email address')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      
      expect(mockClientLogger.debug).toHaveBeenCalledWith(
        'Email field updated',
        expect.objectContaining({
          hasValue: true,
          isValidFormat: true,
        })
      )
    })
  })

  describe('Edge Cases', () => {
    it('handles form submission with Enter key', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: '123' }, session: {} },
        error: null,
      })
      
      render(<LoginPage />)
      
      // Fill in form
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
      
      // Submit with Enter key
      const form = screen.getByRole('button', { name: /sign in/i }).closest('form')
      fireEvent.submit(form!)
      
      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalled()
      })
    })

    it('handles mode switching', () => {
      render(<LoginPage />)
      
      // Switch to signup
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(mockClientLogger.info).toHaveBeenCalledWith(
        'Switching authentication mode',
        { from: 'login', to: 'signup' }
      )
      
      // Switch back to login
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    })

    it('prevents double submission', async () => {
      mockSignInWithPassword.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { user: null }, error: null }), 100))
      )
      
      render(<LoginPage />)
      
      // Fill in form
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
      
      // Submit form multiple times
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)
      fireEvent.click(submitButton)
      fireEvent.click(submitButton)
      
      // Should only be called once
      expect(mockSignInWithPassword).toHaveBeenCalledTimes(1)
    })
  })

  describe('Password Strength Validation', () => {
    it('validates password with missing uppercase', async () => {
      render(<LoginPage />)
      
      // Switch to signup mode
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      // Fill in form with password missing uppercase
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } })
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument()
      })
    })

    it('validates password with missing lowercase', async () => {
      render(<LoginPage />)
      
      // Switch to signup mode
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      // Fill in form with password missing lowercase
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'PASSWORD123' } })
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'PASSWORD123' } })
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one lowercase letter/i)).toBeInTheDocument()
      })
    })

    it('validates password with missing number', async () => {
      render(<LoginPage />)
      
      // Switch to signup mode
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      // Fill in form with password missing number
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password' } })
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Password' } })
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one number/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('renders form with proper labels', () => {
      render(<LoginPage />)
      
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })

    it('renders form with required attributes', () => {
      render(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      
      expect(emailInput).toBeRequired()
      expect(passwordInput).toBeRequired()
    })

    it('renders proper heading structure', () => {
      render(<LoginPage />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Welcome Back')
    })

    it('provides password requirements hint in signup mode', () => {
      render(<LoginPage />)
      
      // Switch to signup mode
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpButton)
      
      expect(screen.getByText(/password must be at least 8 characters with uppercase, lowercase letters and numbers/i)).toBeInTheDocument()
    })
  })
})