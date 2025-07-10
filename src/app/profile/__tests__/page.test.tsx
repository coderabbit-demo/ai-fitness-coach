import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import ProfilePage from '../page';

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

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

// Mock weight conversion utilities
jest.mock('@/lib/weight-conversion', () => ({
  convertFromKg: jest.fn((kg, unit) => unit === 'lb' ? kg * 2.2 : kg),
  convertToKg: jest.fn((value, unit) => unit === 'lb' ? value / 2.2 : value),
  formatWeightWithConfig: jest.fn((kg, config) => `${kg.toFixed(1)} ${config.unit}`),
  isValidWeight: jest.fn(() => true),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, asChild, ...props }: any) => {
    if (asChild) {
      return <div {...props}>{children}</div>;
    }
    return (
      <button onClick={onClick} disabled={disabled} {...props}>
        {children}
      </button>
    );
  },
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, ...props }: any) => (
    <input onChange={onChange} {...props} />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div role="alert" {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

const mockUserProfile = {
  id: 'test-user-id',
  full_name: 'Test User',
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
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    });
    
    mockSupabaseClient.from.mockImplementation((table: string) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
      update: jest.fn().mockReturnThis(),
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initial Rendering and Loading', () => {
    it('should render loading state initially', async () => {
      // Mock a delayed response
      mockSupabaseClient.auth.getUser.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { user: { id: 'test-user-id' } } }), 100))
      );

      render(<ProfilePage />);
      
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('should render profile page after loading', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });
    });

    it('should redirect to login when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should display error message when profile fetch fails', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      }));

      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load profile data')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Data Display', () => {
    it('should display user profile information', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('30')).toBeInTheDocument();
        expect(screen.getByDisplayValue('180')).toBeInTheDocument();
      });
    });

    it('should display fitness goals as badges', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Weight loss')).toBeInTheDocument();
        expect(screen.getByText('Muscle gain')).toBeInTheDocument();
      });
    });

    it('should display medical conditions as badges', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Diabetes')).toBeInTheDocument();
      });
    });

    it('should display dietary restrictions as badges', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Vegetarian')).toBeInTheDocument();
      });
    });

    it('should display "Not set" for empty fields', async () => {
      const emptyProfile = { ...mockUserProfile, full_name: null, age: null };
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: emptyProfile, error: null }),
      }));

      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getAllByDisplayValue('Not set')).toHaveLength(2);
      });
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode when Edit Profile button is clicked', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));
      
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should exit edit mode when Cancel button is clicked', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      fireEvent.click(screen.getByText('Cancel'));
      
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    it('should make form fields editable in edit mode', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      const nameInput = screen.getByLabelText(/Full Name/i);
      expect(nameInput).not.toBeDisabled();
      
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      expect(nameInput).toHaveValue('Updated Name');
    });

    it('should make email field always disabled', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      const emailInput = screen.getByLabelText(/Email/i);
      expect(emailInput).toBeDisabled();
    });
  });

  describe('Form Validation and Input Handling', () => {
    it('should validate age input range', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      const ageInput = screen.getByLabelText(/Age/i);
      expect(ageInput).toHaveAttribute('min', '1');
      expect(ageInput).toHaveAttribute('max', '120');
    });

    it('should validate height input range', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      const heightInput = screen.getByLabelText(/Height/i);
      expect(heightInput).toHaveAttribute('min', '100');
      expect(heightInput).toHaveAttribute('max', '250');
    });

    it('should update form data when input values change', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      const nameInput = screen.getByLabelText(/Full Name/i);
      fireEvent.change(nameInput, { target: { value: 'New Name' } });
      
      expect(nameInput).toHaveValue('New Name');
    });
  });

  describe('Weight Unit Conversion', () => {
    it('should display weight in user preferred unit', async () => {
      const profileWithLbs = { ...mockUserProfile, preferences: { weightUnit: 'lb' } };
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: profileWithLbs, error: null }),
      }));

      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Weight \(lb\)/i)).toBeInTheDocument();
      });
    });

    it('should convert weight when unit is changed', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      const weightUnitSelect = screen.getByLabelText(/Weight Unit/i);
      fireEvent.change(weightUnitSelect, { target: { value: 'lb' } });
      
      // The weight conversion mock should be called
      expect(require('@/lib/weight-conversion').convertFromKg).toHaveBeenCalled();
    });
  });

  describe('Array Field Toggles', () => {
    it('should toggle fitness goals when checkbox is clicked', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      const generalFitnessCheckbox = screen.getByLabelText(/General fitness/i);
      fireEvent.click(generalFitnessCheckbox);
      
      expect(generalFitnessCheckbox).toBeChecked();
    });

    it('should toggle medical conditions when checkbox is clicked', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      const arthritisCheckbox = screen.getByLabelText(/Arthritis/i);
      fireEvent.click(arthritisCheckbox);
      
      expect(arthritisCheckbox).toBeChecked();
    });

    it('should toggle dietary restrictions when checkbox is clicked', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      const veganCheckbox = screen.getByLabelText(/Vegan/i);
      fireEvent.click(veganCheckbox);
      
      expect(veganCheckbox).toBeChecked();
    });

    it('should remove item when already selected item is clicked', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      // Weight loss should be pre-selected from mock data
      const weightLossCheckbox = screen.getByLabelText(/Weight loss/i);
      fireEvent.click(weightLossCheckbox);
      
      expect(weightLossCheckbox).not.toBeChecked();
    });
  });

  describe('Form Submission', () => {
    it('should save profile successfully', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
        update: mockUpdate,
      }));

      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      const nameInput = screen.getByLabelText(/Full Name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      
      fireEvent.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({
          full_name: 'Updated Name',
          age: 30,
          gender: 'male',
          height_cm: 180,
          weight_kg: 75,
          activity_level: 'moderately_active',
          fitness_goals: ['Weight loss', 'Muscle gain'],
          medical_conditions: ['Diabetes'],
          dietary_restrictions: ['Vegetarian'],
          preferences: { weightUnit: 'kg' },
        });
      });
    });

    it('should show success message after successful save', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
        update: mockUpdate,
      }));

      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      fireEvent.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
      });
    });

    it('should show error message when save fails', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ error: { message: 'Database error' } });
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
        update: mockUpdate,
      }));

      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      fireEvent.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
      });
    });

    it('should disable save button while saving', async () => {
      const mockUpdate = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      );
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
        update: mockUpdate,
      }));

      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });

    it('should redirect to login if user is not authenticated during save', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
      }).mockResolvedValueOnce({
        data: { user: null },
      });

      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      fireEvent.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Network error'));

      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });

    it('should handle save errors gracefully', async () => {
      const mockUpdate = jest.fn().mockRejectedValue(new Error('Network error'));
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
        update: mockUpdate,
      }));

      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      fireEvent.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should render back button link', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      });
    });

    it('should display last updated date', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form inputs', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Gender/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Height/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Weight/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Activity Level/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Weight Unit/i)).toBeInTheDocument();
      });
    });

    it('should have proper input types for numeric fields', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      expect(screen.getByLabelText(/Age/i)).toHaveAttribute('type', 'number');
      expect(screen.getByLabelText(/Height/i)).toHaveAttribute('type', 'number');
      expect(screen.getByLabelText(/Weight/i)).toHaveAttribute('type', 'number');
    });

    it('should display error messages with proper role', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      }));

      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined values in profile data', async () => {
      const incompleteProfile = {
        ...mockUserProfile,
        full_name: null,
        age: null,
        gender: null,
        height_cm: null,
        weight_kg: null,
        activity_level: null,
        fitness_goals: null,
        medical_conditions: null,
        dietary_restrictions: null,
        preferences: {},
      };

      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: incompleteProfile, error: null }),
      }));

      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      // Should not crash and should show appropriate default values
      expect(screen.queryByText('No goals selected')).toBeInTheDocument();
      expect(screen.queryByText('No conditions listed')).toBeInTheDocument();
      expect(screen.queryByText('No restrictions listed')).toBeInTheDocument();
    });

    it('should handle empty array values', async () => {
      const emptyArrayProfile = {
        ...mockUserProfile,
        fitness_goals: [],
        medical_conditions: [],
        dietary_restrictions: [],
      };

      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: emptyArrayProfile, error: null }),
      }));

      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('No goals selected')).toBeInTheDocument();
        expect(screen.getByText('No conditions listed')).toBeInTheDocument();
        expect(screen.getByText('No restrictions listed')).toBeInTheDocument();
      });
    });

    it('should handle invalid weight values', async () => {
      const mockIsValidWeight = require('@/lib/weight-conversion').isValidWeight;
      mockIsValidWeight.mockReturnValue(false);

      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      const weightInput = screen.getByLabelText(/Weight/i);
      fireEvent.change(weightInput, { target: { value: 'invalid' } });
      
      fireEvent.click(screen.getByText('Save Changes'));
      
      // Should handle invalid weight gracefully
      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should not make unnecessary API calls', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1);
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
      });
    });

    it('should refetch data after successful save', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
        update: mockUpdate,
      }));

      render(<ProfilePage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      fireEvent.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        // Should be called once for initial load and once after save
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(2);
      });
    });
  });
});