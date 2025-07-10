import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import ProfilePage from './page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
}

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock weight conversion utilities
jest.mock('@/lib/weight-conversion', () => ({
  convertFromKg: jest.fn((kg: number, unit: string) => unit === 'lb' ? kg * 2.20462 : kg),
  convertToKg: jest.fn((value: number, unit: string) => unit === 'lb' ? value / 2.20462 : value),
  formatWeightWithConfig: jest.fn((kg: number, config: any) => `${kg} ${config.unit}`),
  isValidWeight: jest.fn(() => true),
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, asChild, ...props }: any) => {
    if (asChild) {
      return <div {...props}>{children}</div>
    }
    return (
      <button onClick={onClick} disabled={disabled} {...props}>
        {children}
      </button>
    )
  },
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, disabled, ...props }: any) => (
    <input
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      {...props}
    />
  ),
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div role="alert" {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div>Loading...</div>,
  User: () => <div>User Icon</div>,
  Save: () => <div>Save Icon</div>,
  ArrowLeft: () => <div>Arrow Left Icon</div>,
  Target: () => <div>Target Icon</div>,
  Activity: () => <div>Activity Icon</div>,
  Heart: () => <div>Heart Icon</div>,
  AlertCircle: () => <div>Alert Icon</div>,
  Scale: () => <div>Scale Icon</div>,
}))

const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
}

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
}

const mockProfile = {
  id: 'test-user-id',
  full_name: 'John Doe',
  email: 'test@example.com',
  age: 30,
  gender: 'male',
  height_cm: 180,
  weight_kg: 75,
  activity_level: 'moderately_active',
  fitness_goals: ['Weight loss', 'Muscle gain'],
  medical_conditions: ['Diabetes'],
  dietary_restrictions: ['Vegetarian'],
  preferences: {
    weightUnit: 'kg',
  },
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
}

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    mockSupabaseClient.from().select().eq().single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })
  })

  describe('Loading and Initial Render', () => {
    it('should show loading state initially', () => {
      render(<ProfilePage />)
      expect(screen.getByText('Loading profile...')).toBeInTheDocument()
    })

    it('should render profile data after loading', async () => {
      render(<ProfilePage />)
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
      })
    })

    it('should display last updated date', async () => {
      render(<ProfilePage />)
      
      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
      })
    })
  })

  describe('Authentication', () => {
    it('should redirect to login when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('should handle auth error gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error'),
      })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Profile Data Loading', () => {
    it('should handle profile fetch error', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load profile data')).toBeInTheDocument()
      })
    })

    it('should populate form with profile data', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
        expect(screen.getByDisplayValue('30')).toBeInTheDocument()
        expect(screen.getByDisplayValue('180')).toBeInTheDocument()
      })
    })
  })

  describe('Edit Mode', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      expect(screen.getByText('Save Changes')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should exit edit mode when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })

    it('should allow editing form fields', async () => {
      const user = userEvent.setup()
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      const nameInput = screen.getByDisplayValue('John Doe')
      await user.clear(nameInput)
      await user.type(nameInput, 'Jane Doe')

      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate age input range', async () => {
      const user = userEvent.setup()
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      const ageInput = screen.getByDisplayValue('30')
      await user.clear(ageInput)
      await user.type(ageInput, '200')

      // Age input should have min/max validation
      expect(ageInput).toHaveAttribute('max', '120')
      expect(ageInput).toHaveAttribute('min', '1')
    })

    it('should validate height input range', async () => {
      const user = userEvent.setup()
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      const heightInput = screen.getByDisplayValue('180')
      expect(heightInput).toHaveAttribute('min', '100')
      expect(heightInput).toHaveAttribute('max', '250')
    })

    it('should validate weight input range', async () => {
      const user = userEvent.setup()
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      const weightInput = screen.getByDisplayValue('75')
      expect(weightInput).toHaveAttribute('min', '30')
      expect(weightInput).toHaveAttribute('max', '300')
    })
  })

  describe('Weight Unit Conversion', () => {
    it('should convert weight when unit is changed', async () => {
      const user = userEvent.setup()
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      const unitSelect = screen.getByDisplayValue('Kilograms (kg)')
      await user.selectOptions(unitSelect, 'lb')

      // Weight conversion should be triggered
      expect(require('@/lib/weight-conversion').convertFromKg).toHaveBeenCalled()
    })

    it('should display weight in correct unit when not editing', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(require('@/lib/weight-conversion').formatWeightWithConfig).toHaveBeenCalled()
      })
    })
  })

  describe('Array Fields (Goals, Conditions, Restrictions)', () => {
    it('should display fitness goals as badges', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Weight loss')).toBeInTheDocument()
        expect(screen.getByText('Muscle gain')).toBeInTheDocument()
      })
    })

    it('should display medical conditions as badges', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Diabetes')).toBeInTheDocument()
      })
    })

    it('should display dietary restrictions as badges', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Vegetarian')).toBeInTheDocument()
      })
    })

    it('should allow toggling fitness goals in edit mode', async () => {
      const user = userEvent.setup()
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      // Should show checkboxes for fitness goals
      const improvementCheckbox = screen.getByRole('checkbox', { name: /Improved endurance/i })
      expect(improvementCheckbox).toBeInTheDocument()
      expect(improvementCheckbox).not.toBeChecked()

      await user.click(improvementCheckbox)
      expect(improvementCheckbox).toBeChecked()
    })
  })

  describe('Profile Saving', () => {
    it('should save profile successfully', async () => {
      const user = userEvent.setup()
      mockSupabaseClient.from().update().eq.mockResolvedValue({
        data: {},
        error: null,
      })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      const nameInput = screen.getByDisplayValue('John Doe')
      await user.clear(nameInput)
      await user.type(nameInput, 'Jane Doe')

      const saveButton = screen.getByText('Save Changes')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
      })
    })

    it('should handle save error', async () => {
      const user = userEvent.setup()
      mockSupabaseClient.from().update().eq.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      const saveButton = screen.getByText('Save Changes')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to update profile')).toBeInTheDocument()
      })
    })

    it('should show loading state while saving', async () => {
      const user = userEvent.setup()
      let resolvePromise: (value: any) => void
      const savePromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      mockSupabaseClient.from().update().eq.mockReturnValue(savePromise)

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      const saveButton = screen.getByText('Save Changes')
      await user.click(saveButton)

      expect(screen.getByText('Saving...')).toBeInTheDocument()

      resolvePromise!({ data: {}, error: null })
    })

    it('should redirect to login if user becomes unauthenticated during save', async () => {
      const user = userEvent.setup()
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      }).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      const saveButton = screen.getByText('Save Changes')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle profile with minimal data', async () => {
      const minimalProfile = {
        id: 'test-user-id',
        full_name: null,
        email: 'test@example.com',
        age: null,
        gender: null,
        height_cm: null,
        weight_kg: null,
        activity_level: null,
        fitness_goals: null,
        medical_conditions: null,
        dietary_restrictions: null,
        preferences: {},
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: minimalProfile,
        error: null,
      })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Not set')).toBeInTheDocument()
        expect(screen.getByText('No goals selected')).toBeInTheDocument()
        expect(screen.getByText('No conditions listed')).toBeInTheDocument()
        expect(screen.getByText('No restrictions listed')).toBeInTheDocument()
      })
    })

    it('should handle empty arrays for goals, conditions, and restrictions', async () => {
      const emptyArrayProfile = {
        ...mockProfile,
        fitness_goals: [],
        medical_conditions: [],
        dietary_restrictions: [],
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: emptyArrayProfile,
        error: null,
      })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('No goals selected')).toBeInTheDocument()
        expect(screen.getByText('No conditions listed')).toBeInTheDocument()
        expect(screen.getByText('No restrictions listed')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await userEvent.click(editButton)

      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Age')).toBeInTheDocument()
      expect(screen.getByLabelText('Height (cm)')).toBeInTheDocument()
    })

    it('should have proper button roles', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument()
      })
    })

    it('should show alert messages with proper role', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should have back button that links to home', async () => {
      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument()
      })

      const backButton = screen.getByText('Back').closest('a')
      expect(backButton).toHaveAttribute('href', '/')
    })
  })

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Network error'))

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      })
    })

    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup()
      mockSupabaseClient.from().update().eq.mockRejectedValue(new Error('Save failed'))

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Profile')
      await user.click(editButton)

      const saveButton = screen.getByText('Save Changes')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      })
    })
  })
})