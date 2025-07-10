/**
 * Comprehensive unit tests for the Profile page component
 * 
 * Testing Framework: React Testing Library with Jest
 * Note: This project needs the following testing dependencies installed:
 * - @testing-library/react
 * - @testing-library/jest-dom
 * - jest
 * - jest-environment-jsdom
 */

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { jest } from '@jest/globals'
import ProfilePage from '../page'
import type { WeightUnit } from '@/lib/weight-conversion'

// Mock Next.js router and navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockBack = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}))

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
})

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn()
    }))
  }))
}

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}))

// Mock weight conversion utilities
const mockConvertFromKg = jest.fn()
const mockConvertToKg = jest.fn()
const mockFormatWeightWithConfig = jest.fn()
const mockIsValidWeight = jest.fn()

jest.mock('@/lib/weight-conversion', () => ({
  convertFromKg: mockConvertFromKg,
  convertToKg: mockConvertToKg,
  formatWeightWithConfig: mockFormatWeightWithConfig,
  isValidWeight: mockIsValidWeight,
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, asChild, ...props }: any) => 
    asChild ? <div {...props}>{children}</div> : (
      <button 
        onClick={onClick} 
        disabled={disabled} 
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {children}
      </button>
    )
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => <div data-testid="card" className={className} {...props}>{children}</div>,
  CardContent: ({ children, className, ...props }: any) => <div data-testid="card-content" className={className} {...props}>{children}</div>,
  CardDescription: ({ children, className, ...props }: any) => <div data-testid="card-description" className={className} {...props}>{children}</div>,
  CardHeader: ({ children, className, ...props }: any) => <div data-testid="card-header" className={className} {...props}>{children}</div>,
  CardTitle: ({ children, className, ...props }: any) => <div data-testid="card-title" className={className} {...props}>{children}</div>,
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input {...props} />
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...props }: any) => <label htmlFor={htmlFor} {...props}>{children}</label>
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className, ...props }: any) => <div className={`alert ${className || ''}`} {...props}>{children}</div>,
  AlertDescription: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: any) => <span data-testid="badge" data-variant={variant} {...props}>{children}</span>
}))

// Mock icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className, ...props }: any) => <div className={className} data-testid="loader" {...props} />,
  User: ({ className, ...props }: any) => <div className={className} data-testid="user-icon" {...props} />,
  Save: ({ className, ...props }: any) => <div className={className} data-testid="save-icon" {...props} />,
  ArrowLeft: ({ className, ...props }: any) => <div className={className} data-testid="arrow-left" {...props} />,
  Target: ({ className, ...props }: any) => <div className={className} data-testid="target-icon" {...props} />,
  Activity: ({ className, ...props }: any) => <div className={className} data-testid="activity-icon" {...props} />,
  Heart: ({ className, ...props }: any) => <div className={className} data-testid="heart-icon" {...props} />,
  AlertCircle: ({ className, ...props }: any) => <div className={className} data-testid="alert-circle" {...props} />,
  Scale: ({ className, ...props }: any) => <div className={className} data-testid="scale-icon" {...props} />,
}))

// Test data
const mockUserProfile = {
  id: 'user-123',
  full_name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  gender: 'male',
  height_cm: 180,
  weight_kg: 75,
  activity_level: 'moderately_active',
  fitness_goals: ['Weight loss', 'Muscle gain'],
  medical_conditions: ['Diabetes'],
  dietary_restrictions: ['Vegetarian'],
  preferences: {
    weightUnit: 'kg' as WeightUnit
  },
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

const mockUser = {
  id: 'user-123',
  email: 'john@example.com'
}

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
    
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockUserProfile,
            error: null
          })
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({
          data: mockUserProfile,
          error: null
        })
      }))
    })

    // Setup weight conversion mocks
    mockConvertFromKg.mockImplementation((kg: number, unit: WeightUnit) => 
      unit === 'lb' ? kg * 2.20462 : kg
    )
    mockConvertToKg.mockImplementation((weight: number, unit: WeightUnit) => 
      unit === 'lb' ? weight / 2.20462 : weight
    )
    mockFormatWeightWithConfig.mockImplementation((kg: number, config: any) => 
      `${kg.toFixed(config.precision || 1)} ${config.unit}`
    )
    mockIsValidWeight.mockReturnValue(true)
  })

  describe('Loading and Authentication States', () => {
    it('displays loading state initially', () => {
      render(<ProfilePage />)
      
      expect(screen.getByText('Loading profile...')).toBeInTheDocument()
      expect(screen.getByTestId('loader')).toBeInTheDocument()
    })

    it('redirects to login when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      render(<ProfilePage />)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('renders profile content when authenticated and data is loaded', async () => {
      render(<ProfilePage />)
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
      
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('30')).toBeInTheDocument()
      expect(screen.getByDisplayValue('180')).toBeInTheDocument()
    })

    it('displays error message when profile fetch fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found' }
            })
          }))
        }))
      })

      render(<ProfilePage />)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load profile data')).toBeInTheDocument()
      })
    })

    it('handles unexpected errors during profile fetch', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockRejectedValue(new Error('Network error'))
          }))
        }))
      })

      render(<ProfilePage />)
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      })
    })
  })

  describe('Form Sections and Layout', () => {
    beforeEach(async () => {
      render(<ProfilePage />)
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
    })

    it('renders all required form sections', () => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Physical Information')).toBeInTheDocument()
      expect(screen.getByText('Preferences')).toBeInTheDocument()
      expect(screen.getByText('Fitness Goals')).toBeInTheDocument()
      expect(screen.getByText('Medical Conditions')).toBeInTheDocument()
      expect(screen.getByText('Dietary Restrictions')).toBeInTheDocument()
    })

    it('displays section descriptions correctly', () => {
      expect(screen.getByText('Your personal details and contact information')).toBeInTheDocument()
      expect(screen.getByText('Your physical measurements and activity level')).toBeInTheDocument()
      expect(screen.getByText('Your display and unit preferences')).toBeInTheDocument()
      expect(screen.getByText('Select your fitness objectives')).toBeInTheDocument()
      expect(screen.getByText('Any relevant medical conditions or concerns')).toBeInTheDocument()
      expect(screen.getByText('Your dietary preferences and restrictions')).toBeInTheDocument()
    })

    it('shows appropriate icons for each section', () => {
      expect(screen.getAllByTestId('user-icon')).toHaveLength(2) // Header and Basic Info
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument()
      expect(screen.getByTestId('scale-icon')).toBeInTheDocument()
      expect(screen.getByTestId('target-icon')).toBeInTheDocument()
      expect(screen.getAllByTestId('heart-icon')).toHaveLength(2) // Medical and Dietary
    })

    it('displays last updated timestamp', () => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
      expect(screen.getByText(/1\/1\/2023/)).toBeInTheDocument()
    })

    it('shows back navigation link', () => {
      const backLink = screen.getByText('Back')
      expect(backLink.closest('a')).toHaveAttribute('href', '/')
    })
  })

  describe('Form Field Rendering', () => {
    beforeEach(async () => {
      render(<ProfilePage />)
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
    })

    it('renders basic information fields correctly', () => {
      expect(screen.getByLabelText('Full Name')).toHaveValue('John Doe')
      expect(screen.getByLabelText('Email')).toHaveValue('john@example.com')
      expect(screen.getByLabelText('Age')).toHaveValue('30')
      expect(screen.getByLabelText('Gender')).toHaveValue('Male')
    })

    it('renders physical information fields correctly', () => {
      expect(screen.getByLabelText('Height (cm)')).toHaveValue('180')
      expect(screen.getByLabelText(/Weight \(kg\)/)).toHaveValue('75 kg')
      expect(screen.getByLabelText('Activity Level')).toHaveValue('Moderately active (moderate exercise 3-5 days/week)')
    })

    it('shows email field as disabled with explanation', () => {
      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toBeDisabled()
      expect(screen.getByText('Email cannot be changed here')).toBeInTheDocument()
    })

    it('displays fitness goals as badges in read mode', () => {
      const badges = screen.getAllByTestId('badge')
      const badgeTexts = badges.map(badge => badge.textContent)
      expect(badgeTexts).toContain('Weight loss')
      expect(badgeTexts).toContain('Muscle gain')
      expect(badgeTexts).toContain('Diabetes')
      expect(badgeTexts).toContain('Vegetarian')
    })

    it('shows appropriate messages for empty arrays', async () => {
      // Mock empty arrays
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                ...mockUserProfile,
                fitness_goals: [],
                medical_conditions: [],
                dietary_restrictions: []
              },
              error: null
            })
          }))
        }))
      })

      render(<ProfilePage />)
      
      await waitFor(() => {
        expect(screen.getByText('No goals selected')).toBeInTheDocument()
        expect(screen.getByText('No conditions listed')).toBeInTheDocument()
        expect(screen.getByText('No restrictions listed')).toBeInTheDocument()
      })
    })
  })

  describe('Edit Mode Functionality', () => {
    beforeEach(async () => {
      render(<ProfilePage />)
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
    })

    it('enters edit mode when edit button is clicked', () => {
      const editButton = screen.getByText('Edit Profile')
      fireEvent.click(editButton)
      
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument()
    })

    it('exits edit mode when cancel button is clicked', () => {
      const editButton = screen.getByText('Edit Profile')
      fireEvent.click(editButton)
      
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)
      
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument()
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    })

    it('shows form inputs in edit mode', () => {
      const editButton = screen.getByText('Edit Profile')
      fireEvent.click(editButton)
      
      // Check that select dropdowns are available
      expect(screen.getByRole('combobox', { name: /gender/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /activity level/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /weight unit/i })).toBeInTheDocument()
    })

    it('shows checkboxes for array fields in edit mode', () => {
      const editButton = screen.getByText('Edit Profile')
      fireEvent.click(editButton)
      
      // Check for some fitness goal checkboxes
      expect(screen.getByRole('checkbox', { name: 'Weight loss' })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'Muscle gain' })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'General fitness' })).toBeInTheDocument()
      
      // Check for medical condition checkboxes
      expect(screen.getByRole('checkbox', { name: 'Diabetes' })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'Arthritis' })).toBeInTheDocument()
      
      // Check for dietary restriction checkboxes
      expect(screen.getByRole('checkbox', { name: 'Vegetarian' })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'Vegan' })).toBeInTheDocument()
    })
  })

  describe('Form Input Handling', () => {
    beforeEach(async () => {
      render(<ProfilePage />)
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
      
      const editButton = screen.getByText('Edit Profile')
      fireEvent.click(editButton)
    })

    it('handles text input changes', () => {
      const nameInput = screen.getByLabelText('Full Name')
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } })
      expect(nameInput).toHaveValue('Jane Smith')
    })

    it('handles numeric input changes', () => {
      const ageInput = screen.getByLabelText('Age')
      fireEvent.change(ageInput, { target: { value: '25' } })
      expect(ageInput).toHaveValue('25')
      
      const heightInput = screen.getByLabelText('Height (cm)')
      fireEvent.change(heightInput, { target: { value: '175' } })
      expect(heightInput).toHaveValue('175')
    })

    it('handles select dropdown changes', () => {
      const genderSelect = screen.getByRole('combobox', { name: /gender/i })
      fireEvent.change(genderSelect, { target: { value: 'female' } })
      expect(genderSelect).toHaveValue('female')
      
      const activitySelect = screen.getByRole('combobox', { name: /activity level/i })
      fireEvent.change(activitySelect, { target: { value: 'very_active' } })
      expect(activitySelect).toHaveValue('very_active')
    })

    it('handles checkbox toggle for fitness goals', () => {
      const weightLossCheckbox = screen.getByRole('checkbox', { name: 'Weight loss' })
      const generalFitnessCheckbox = screen.getByRole('checkbox', { name: 'General fitness' })
      
      // Should be checked initially (from mock data)
      expect(weightLossCheckbox).toBeChecked()
      expect(generalFitnessCheckbox).not.toBeChecked()
      
      // Toggle states
      fireEvent.click(weightLossCheckbox)
      fireEvent.click(generalFitnessCheckbox)
      
      expect(weightLossCheckbox).not.toBeChecked()
      expect(generalFitnessCheckbox).toBeChecked()
    })

    it('handles checkbox toggle for medical conditions', () => {
      const diabetesCheckbox = screen.getByRole('checkbox', { name: 'Diabetes' })
      const arthritisCheckbox = screen.getByRole('checkbox', { name: 'Arthritis' })
      
      expect(diabetesCheckbox).toBeChecked()
      expect(arthritisCheckbox).not.toBeChecked()
      
      fireEvent.click(diabetesCheckbox)
      fireEvent.click(arthritisCheckbox)
      
      expect(diabetesCheckbox).not.toBeChecked()
      expect(arthritisCheckbox).toBeChecked()
    })

    it('handles checkbox toggle for dietary restrictions', () => {
      const vegetarianCheckbox = screen.getByRole('checkbox', { name: 'Vegetarian' })
      const veganCheckbox = screen.getByRole('checkbox', { name: 'Vegan' })
      
      expect(vegetarianCheckbox).toBeChecked()
      expect(veganCheckbox).not.toBeChecked()
      
      fireEvent.click(vegetarianCheckbox)
      fireEvent.click(veganCheckbox)
      
      expect(vegetarianCheckbox).not.toBeChecked()
      expect(veganCheckbox).toBeChecked()
    })
  })

  describe('Weight Unit Conversion', () => {
    beforeEach(async () => {
      render(<ProfilePage />)
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
      
      const editButton = screen.getByText('Edit Profile')
      fireEvent.click(editButton)
    })

    it('converts weight display when unit is changed', () => {
      const weightUnitSelect = screen.getByRole('combobox', { name: /weight unit/i })
      fireEvent.change(weightUnitSelect, { target: { value: 'lb' } })
      
      expect(mockConvertFromKg).toHaveBeenCalledWith(75, 'lb')
    })

    it('validates weight using the weight validation utility', () => {
      const weightInput = screen.getByLabelText(/Weight \(kg\)/)
      fireEvent.change(weightInput, { target: { value: '80' } })
      
      expect(mockIsValidWeight).toHaveBeenCalled()
    })

    it('shows weight in user preferred unit', () => {
      expect(mockFormatWeightWithConfig).toHaveBeenCalledWith(
        75,
        expect.objectContaining({
          unit: 'kg',
          precision: 1,
          showUnit: true
        })
      )
    })
  })

  describe('Form Validation', () => {
    beforeEach(async () => {
      render(<ProfilePage />)
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
      
      const editButton = screen.getByText('Edit Profile')
      fireEvent.click(editButton)
    })

    it('has proper input constraints for age', () => {
      const ageInput = screen.getByLabelText('Age')
      expect(ageInput).toHaveAttribute('min', '1')
      expect(ageInput).toHaveAttribute('max', '120')
      expect(ageInput).toHaveAttribute('type', 'number')
    })

    it('has proper input constraints for height', () => {
      const heightInput = screen.getByLabelText('Height (cm)')
      expect(heightInput).toHaveAttribute('min', '100')
      expect(heightInput).toHaveAttribute('max', '250')
      expect(heightInput).toHaveAttribute('type', 'number')
    })

    it('has proper input constraints for weight', () => {
      const weightInput = screen.getByLabelText(/Weight \(kg\)/)
      expect(weightInput).toHaveAttribute('step', '0.1')
      expect(weightInput).toHaveAttribute('type', 'number')
    })

    it('validates weight using isValidWeight function', () => {
      const weightInput = screen.getByLabelText(/Weight \(kg\)/)
      fireEvent.change(weightInput, { target: { value: '65' } })
      
      expect(mockIsValidWeight).toHaveBeenCalled()
    })
  })

  describe('Save Functionality', () => {
    beforeEach(async () => {
      render(<ProfilePage />)
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
      
      const editButton = screen.getByText('Edit Profile')
      fireEvent.click(editButton)
    })

    it('saves profile successfully with updated data', async () => {
      const nameInput = screen.getByLabelText('Full Name')
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } })
      
      const ageInput = screen.getByLabelText('Age')
      fireEvent.change(ageInput, { target: { value: '25' } })
      
      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
          expect.objectContaining({
            full_name: 'Jane Smith',
            age: 25,
            preferences: expect.objectContaining({
              weightUnit: 'kg'
            })
          })
        )
      })
      
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
    })

    it('shows saving state during save operation', async () => {
      // Mock delayed response
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null
            })
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => new Promise(resolve => setTimeout(() => resolve({
            data: mockUserProfile,
            error: null
          }), 100)))
        }))
      })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)
      
      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(saveButton).toBeDisabled()
      expect(screen.getByText('Cancel')).toBeDisabled()
    })

    it('handles save errors gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null
            })
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Update failed' }
          })
        }))
      })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to update profile')).toBeInTheDocument()
      })
    })

    it('handles network errors during save', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null
            })
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockRejectedValue(new Error('Network error'))
        }))
      })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      })
    })

    it('redirects to login if user becomes unauthenticated during save', async () => {
      mockSupabaseClient.auth.getUser
        .mockResolvedValueOnce({ data: { user: mockUser }, error: null })
        .mockResolvedValueOnce({ data: { user: null }, error: null })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('properly converts weight to kg for database storage', async () => {
      const weightInput = screen.getByLabelText(/Weight \(kg\)/)
      fireEvent.change(weightInput, { target: { value: '70' } })
      
      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockConvertToKg).toHaveBeenCalledWith(70, 'kg')
      })
    })

    it('exits edit mode after successful save', async () => {
      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
      })
      
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument()
    })

    it('refreshes profile data after successful save', async () => {
      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockSupabaseClient.from().select).toHaveBeenCalledTimes(2) // Initial load + refresh
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles missing profile data gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                ...mockUserProfile,
                full_name: null,
                age: null,
                height_cm: null,
                weight_kg: null,
                gender: null,
                activity_level: null,
                fitness_goals: null,
                medical_conditions: null,
                dietary_restrictions: null,
                preferences: null
              },
              error: null
            })
          }))
        }))
      })

      render(<ProfilePage />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('')).toBeInTheDocument() // Empty name
        expect(screen.getByText('Not set')).toBeInTheDocument() // Age not set
        expect(screen.getByText('No goals selected')).toBeInTheDocument()
        expect(screen.getByText('No conditions listed')).toBeInTheDocument()
        expect(screen.getByText('No restrictions listed')).toBeInTheDocument()
      })
    })

    it('handles invalid weight values', async () => {
      mockIsValidWeight.mockReturnValue(false)
      
      render(<ProfilePage />)
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
      
      const editButton = screen.getByText('Edit Profile')
      fireEvent.click(editButton)
      
      const weightInput = screen.getByLabelText(/Weight \(kg\)/)
      fireEvent.change(weightInput, { target: { value: '500' } })
      
      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
          expect.objectContaining({
            weight_kg: null // Invalid weight should be saved as null
          })
        )
      })
    })

    it('handles empty string values correctly', async () => {
      render(<ProfilePage />)
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
      
      const editButton = screen.getByText('Edit Profile')
      fireEvent.click(editButton)
      
      const nameInput = screen.getByLabelText('Full Name')
      fireEvent.change(nameInput, { target: { value: '' } })
      
      const ageInput = screen.getByLabelText('Age')
      fireEvent.change(ageInput, { target: { value: '' } })
      
      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
          expect.objectContaining({
            full_name: null,
            age: null
          })
        )
      })
    })

    it('handles concurrent save attempts', async () => {
      // Mock delayed response
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null
            })
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => new Promise(resolve => setTimeout(() => resolve({
            data: mockUserProfile,
            error: null
          }), 100)))
        }))
      })

      render(<ProfilePage />)
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
      
      const editButton = screen.getByText('Edit Profile')
      fireEvent.click(editButton)
      
      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)
      fireEvent.click(saveButton) // Second click should be ignored
      
      expect(mockSupabaseClient.from().update).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<ProfilePage />)
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
    })

    it('has proper heading structure', () => {
      expect(screen.getByRole('heading', { name: 'My Profile' })).toBeInTheDocument()
    })

    it('has proper form labels and associations', () => {
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Age')).toBeInTheDocument()
      expect(screen.getByLabelText('Gender')).toBeInTheDocument()
      expect(screen.getByLabelText('Height (cm)')).toBeInTheDocument()
      expect(screen.getByLabelText(/Weight \(kg\)/)).toBeInTheDocument()
    })

    it('has accessible navigation elements', () => {
      const backLink = screen.getByText('Back')
      expect(backLink.closest('a')).toHaveAttribute('href', '/')
    })

    it('has proper button types and states', () => {
      const editButton = screen.getByText('Edit Profile')
      expect(editButton).toHaveAttribute('type', 'button')
      expect(editButton).not.toBeDisabled()
    })

    it('provides clear error messages', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found' }
            })
          }))
        }))
      })

      render(<ProfilePage />)
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Failed to load profile data')
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage.closest('.alert')).toHaveClass('border-red-200')
      })
    })

    it('provides clear success messages', async () => {
      const editButton = screen.getByText('Edit Profile')
      fireEvent.click(editButton)
      
      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        const successMessage = screen.getByText('Profile updated successfully!')
        expect(successMessage).toBeInTheDocument()
        expect(successMessage.closest('.alert')).toHaveClass('border-green-200')
      })
    })
  })

  describe('Performance and Optimization', () => {
    it('uses useCallback for fetchProfile to prevent unnecessary re-renders', () => {
      const { rerender } = render(<ProfilePage />)
      
      // Re-render shouldn't cause additional API calls
      rerender(<ProfilePage />)
      
      // Only one initial API call should have been made
      expect(mockSupabaseClient.from().select).toHaveBeenCalledTimes(1)
    })

    it('cleans up properly when component unmounts', () => {
      const { unmount } = render(<ProfilePage />)
      
      expect(() => unmount()).not.toThrow()
    })

    it('handles rapid form changes efficiently', () => {
      render(<ProfilePage />)
      
      // Rapid state changes shouldn't cause errors
      act(() => {
        const editButton = screen.getByText('Edit Profile')
        fireEvent.click(editButton)
        
        const nameInput = screen.getByLabelText('Full Name')
        fireEvent.change(nameInput, { target: { value: 'A' } })
        fireEvent.change(nameInput, { target: { value: 'Ab' } })
        fireEvent.change(nameInput, { target: { value: 'ABC' } })
      })
      
      expect(screen.getByLabelText('Full Name')).toHaveValue('ABC')
    })
  })

  describe('User Experience', () => {
    beforeEach(async () => {
      render(<ProfilePage />)
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
    })

    it('maintains form state during edit session', () => {
      const editButton = screen.getByText('Edit Profile')
      fireEvent.click(editButton)
      
      const nameInput = screen.getByLabelText('Full Name')
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } })
      
      // Form state should be maintained
      expect(nameInput).toHaveValue('Jane Smith')
    })

    it('provides clear visual feedback for different states', () => {
      // Loading state
      expect(screen.getByTestId('loader')).toBeInTheDocument()
      
      // Read-only state (default)
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })

    it('shows appropriate UI for different data states', () => {
      // Profile exists
      expect(screen.getAllByTestId('badge')).toHaveLength(4) // Goals, conditions, restrictions
      
      // Last updated info
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })

    it('provides helpful section descriptions', () => {
      expect(screen.getByText('Your personal details and contact information')).toBeInTheDocument()
      expect(screen.getByText('Your physical measurements and activity level')).toBeInTheDocument()
      expect(screen.getByText('Your display and unit preferences')).toBeInTheDocument()
    })
  })
})