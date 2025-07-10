import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import LoginPage from './page'

// Mock Supabase client
const mockSignUp = jest.fn()
const mockSignInWithPassword = jest.fn()
const mockResetPasswordForEmail = jest.fn()
const mockCreateClient = jest.fn(() => ({
  auth: {
    signUp: mockSignUp,
    signInWithPassword: mockSignInWithPassword,
    resetPasswordForEmail: mockResetPasswordForEmail,
  },
}))

jest.mock('@/utils/supabase/client', () => ({
  createClient: mockCreateClient,
}))

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock logger functions
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
  CardTitle: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
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
  Loader2: (props: any) => <div data-testid="loading-spinner" {...props} />,
  User: (props: any) => <div data-testid="user-icon" {...props} />,
  Lock: (props: any) => <div data-testid="lock-icon" {...props} />,
  Mail: (props: any) => <div data-testid="mail-icon" {...props} />,
  Eye: (props: any) => <div data-testid="eye-icon" {...props} />,
  EyeOff: (props: any) => <div data-testid="eye-off-icon" {...props} />,
}))

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    })
    Object.defineProperty(navigator, 'userAgent', {
      value: 'test-user-agent',
      writable: true,
    })
  })

  describe('Initial Rendering', () => {
    test('renders login mode by default', () => {
      render(<LoginPage />)
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
      expect(screen.getByText('Sign in to your AI Fitness Coach account')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument()
    })

    test('renders all required form fields in login mode', () => {
      render(<LoginPage />)
      
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    test('renders password visibility toggle', () => {
      render(<LoginPage />)
      
      const toggleButton = screen.getByRole('button', { name: '' })
      expect(toggleButton).toBeInTheDocument()
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument()
    })

    test('renders forgot password button', () => {
      render(<LoginPage />)
      
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
    })

    test('renders sign up link', () => {
      render(<LoginPage />)
      
      expect(screen.getByText('Sign up')).toBeInTheDocument()
    })
  })

  describe('Mode Switching', () => {
    test('switches to signup mode when sign up button is clicked', () => {
      render(<LoginPage />)
      
      const signUpButton = screen.getByText('Sign up')
      fireEvent.click(signUpButton)
      
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.getByText('Join AI Fitness Coach and start your fitness journey')).toBeInTheDocument()
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    test('switches back to login mode from signup', () => {
      render(<LoginPage />)
      
      // Switch to signup
      fireEvent.click(screen.getByText('Sign up'))
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      
      // Switch back to login
      fireEvent.click(screen.getByText('Sign in'))
      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    })

    test('clears form fields when switching modes', () => {
      render(<LoginPage />)
      
      // Fill in login form
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      
      // Switch to signup
      fireEvent.click(screen.getByText('Sign up'))
      
      // Check that password is cleared
      expect(screen.getByLabelText(/password/i)).toHaveValue('')
      expect(screen.getByLabelText(/email address/i)).toHaveValue('test@example.com') // Email should persist
    })
  })

  describe('Form Validation', () => {
    test('password validation shows correct error messages', () => {
      render(<LoginPage />)
      
      // Switch to signup to test password validation
      fireEvent.click(screen.getByText('Sign up'))
      
      // Test short password
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'short' } })
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'short' } })
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument()
      })
    })

    test('password validation checks for uppercase letters', () => {
      render(<LoginPage />)
      
      fireEvent.click(screen.getByText('Sign up'))
      
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'lowercase1' } })
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'lowercase1' } })
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument()
      })
    })

    test('password validation checks for lowercase letters', () => {
      render(<LoginPage />)
      
      fireEvent.click(screen.getByText('Sign up'))
      
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'UPPERCASE1' } })
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'UPPERCASE1' } })
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one lowercase letter')).toBeInTheDocument()
      })
    })

    test('password validation checks for numbers', () => {
      render(<LoginPage />)
      
      fireEvent.click(screen.getByText('Sign up'))
      
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'NoNumbers' } })
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'NoNumbers' } })
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument()
      })
    })

    test('shows error when passwords do not match', () => {
      render(<LoginPage />)
      
      fireEvent.click(screen.getByText('Sign up'))
      
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'ValidPass1' } })
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'DifferentPass1' } })
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      })
    })
  })

  describe('Password Visibility Toggle', () => {
    test('toggles password visibility', () => {
      render(<LoginPage />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      const toggleButton = screen.getByRole('button', { name: '' })
      
      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument()
      
      // Click to show password
      fireEvent.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument()
      
      // Click to hide password again
      fireEvent.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument()
    })

    test('toggles confirm password visibility in signup mode', () => {
      render(<LoginPage />)
      
      fireEvent.click(screen.getByText('Sign up'))
      
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const toggleButtons = screen.getAllByRole('button', { name: '' })
      const confirmPasswordToggle = toggleButtons[1] // Second toggle button
      
      // Initially confirm password should be hidden
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      
      // Click to show confirm password
      fireEvent.click(confirmPasswordToggle)
      expect(confirmPasswordInput).toHaveAttribute('type', 'text')
      
      // Click to hide confirm password again
      fireEvent.click(confirmPasswordToggle)
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Form Submission - Login', () => {
    test('successfully submits login form', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { access_token: 'token-123' }
      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      
      render(<LoginPage />)
      
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
      
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

    test('handles login error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      })
      
      render(<LoginPage />)
      
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } })
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
      })
    })

    test('disables form during login submission', async () => {
      mockSignInWithPassword.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      render(<LoginPage />)
      
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)
      
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Form Submission - Signup', () => {
    test('successfully submits signup form', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', email_confirmed_at: null }
      mockSignUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      render(<LoginPage />)
      
      fireEvent.click(screen.getByText('Sign up'))
      
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'ValidPass1' } })
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPass1' } })
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
      
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'ValidPass1',
          options: {
            data: { full_name: 'Test User' },
            emailRedirectTo: 'http://localhost:3000/profile',
          },
        })
      })
      
      await waitFor(() => {
        expect(screen.getByText('Account created successfully! Please check your email to confirm your account before signing in.')).toBeInTheDocument()
      })
    })

    test('handles signup error', async () => {
      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already registered' },
      })
      
      render(<LoginPage />)
      
      fireEvent.click(screen.getByText('Sign up'))
      
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'ValidPass1' } })
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPass1' } })
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Email already registered')).toBeInTheDocument()
      })
    })

    test('switches to login mode after successful signup', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', email_confirmed_at: null }
      mockSignUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      render(<LoginPage />)
      
      fireEvent.click(screen.getByText('Sign up'))
      
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'ValidPass1' } })
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPass1' } })
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument()
      })
    })
  })

  describe('Forgot Password', () => {
    test('sends password reset email', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })
      
      render(<LoginPage />)
      
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByText('Forgot your password?'))
      
      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
          redirectTo: 'http://localhost:3000/reset-password',
        })
      })
      
      await waitFor(() => {
        expect(screen.getByText('Password reset email sent! Check your inbox for instructions.')).toBeInTheDocument()
      })
    })

    test('shows error when email is empty for password reset', async () => {
      render(<LoginPage />)
      
      fireEvent.click(screen.getByText('Forgot your password?'))
      
      await waitFor(() => {
        expect(screen.getByText('Please enter your email address first')).toBeInTheDocument()
      })
    })

    test('handles password reset error', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'Email not found' },
      })
      
      render(<LoginPage />)
      
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'nonexistent@example.com' } })
      fireEvent.click(screen.getByText('Forgot your password?'))
      
      await waitFor(() => {
        expect(screen.getByText('Email not found')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    test('shows loading state during login', async () => {
      mockSignInWithPassword.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      render(<LoginPage />)
      
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
      
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    test('shows loading state during signup', async () => {
      mockSignUp.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      render(<LoginPage />)
      
      fireEvent.click(screen.getByText('Sign up'))
      
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'ValidPass1' } })
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPass1' } })
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
      
      expect(screen.getByText('Creating account...')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Form Validation State', () => {
    test('disables submit button when form is invalid in login mode', () => {
      render(<LoginPage />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).toBeDisabled()
      
      // Add email only
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      expect(submitButton).toBeDisabled()
      
      // Add password
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      expect(submitButton).not.toBeDisabled()
    })

    test('disables submit button when form is invalid in signup mode', () => {
      render(<LoginPage />)
      
      fireEvent.click(screen.getByText('Sign up'))
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      expect(submitButton).toBeDisabled()
      
      // Add fields one by one
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
      expect(submitButton).toBeDisabled()
      
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      expect(submitButton).toBeDisabled()
      
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'ValidPass1' } })
      expect(submitButton).toBeDisabled()
      
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPass1' } })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    test('handles unexpected errors during login', async () => {
      mockSignInWithPassword.mockRejectedValue(new Error('Network error'))
      
      render(<LoginPage />)
      
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument()
      })
    })

    test('handles unexpected errors during signup', async () => {
      mockSignUp.mockRejectedValue(new Error('Network error'))
      
      render(<LoginPage />)
      
      fireEvent.click(screen.getByText('Sign up'))
      
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'ValidPass1' } })
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPass1' } })
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument()
      })
    })

    test('handles unexpected errors during password reset', async () => {
      mockResetPasswordForEmail.mockRejectedValue(new Error('Network error'))
      
      render(<LoginPage />)
      
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByText('Forgot your password?'))
      
      await waitFor(() => {
        expect(screen.getByText('Failed to send password reset email. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Logging', () => {
    test('logs initialization', () => {
      render(<LoginPage />)
      
      expect(mockClientLogger.info).toHaveBeenCalledWith('Login page initialized', expect.objectContaining({
        userAgent: 'test-user-agent',
        currentMode: 'login',
      }))
    })

    test('logs mode changes', () => {
      render(<LoginPage />)
      
      fireEvent.click(screen.getByText('Sign up'))
      
      expect(mockClientLogger.info).toHaveBeenCalledWith('Switching authentication mode', {
        from: 'login',
        to: 'signup',
      })
    })

    test('logs form field updates', () => {
      render(<LoginPage />)
      
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      
      expect(mockClientLogger.debug).toHaveBeenCalledWith('Email field updated', expect.objectContaining({
        hasValue: true,
        isValidFormat: true,
      }))
    })
  })

  describe('Edge Cases', () => {
    test('handles empty form submission', async () => {
      render(<LoginPage />)
      
      // Form should be disabled when empty
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).toBeDisabled()
    })

    test('handles whitespace-only inputs', () => {
      render(<LoginPage />)
      
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: '   ' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).toBeDisabled()
    })

    test('clears error messages when switching modes', () => {
      render(<LoginPage />)
      
      // Create an error in login mode
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
      fireEvent.click(screen.getByText('Forgot your password?'))
      
      // Switch to signup mode
      fireEvent.click(screen.getByText('Sign up'))
      
      // Error should be cleared
      expect(screen.queryByText('Please enter your email address first')).not.toBeInTheDocument()
    })
  })
})