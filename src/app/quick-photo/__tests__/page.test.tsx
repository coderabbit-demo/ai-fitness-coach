import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import QuickPhotoPage from '../page';

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock Supabase client
const mockGetUser = jest.fn();
jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

// Mock OptimizedCamera
const mockOnCapture = jest.fn();
const mockOnCancel = jest.fn();
jest.mock('@/components/calorie-tracker/OptimizedCamera', () => ({
  OptimizedCamera: ({ onCapture, onCancel, showGuidelines }: any) => {
    // Store callbacks for testing
    mockOnCapture.mockImplementation(onCapture);
    mockOnCancel.mockImplementation(onCancel);
    return (
      <div data-testid="optimized-camera" data-show-guidelines={showGuidelines}>
        <button onClick={() => onCapture(new File(['test'], 'test.jpg', { type: 'image/jpeg' }))}>
          Capture
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  },
}));

// Mock image optimizer
const mockOptimizeForUpload = jest.fn();
jest.mock('@/lib/image/optimizer', () => ({
  imageOptimizer: {
    optimizeForUpload: mockOptimizeForUpload,
  },
}));

// Mock sync service
const mockQueuePhotoUpload = jest.fn();
jest.mock('@/lib/pwa/sync-service', () => ({
  syncService: {
    queuePhotoUpload: mockQueuePhotoUpload,
  },
}));

// Mock useToast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

describe('QuickPhotoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOptimizeForUpload.mockResolvedValue(
      new File(['optimized'], 'test.jpg', { type: 'image/jpeg' }),
    );
    mockQueuePhotoUpload.mockResolvedValue('https://example.com/signed-url');
  });

  describe('Loading state', () => {
    it('should show loading state while checking authentication', async () => {
      mockGetUser.mockReturnValue(new Promise(() => {})); // Never resolves
      render(<QuickPhotoPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Authentication', () => {
    it('should redirect to /login when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      render(<QuickPhotoPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should show toast and redirect when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      render(<QuickPhotoPage />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Authentication required',
          }),
        );
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect to /login when auth error occurs', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth failed'),
      });

      render(<QuickPhotoPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect to /login when getUser throws an exception', async () => {
      mockGetUser.mockRejectedValue(new Error('Network error'));

      render(<QuickPhotoPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should render camera when user is authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      render(<QuickPhotoPage />);

      await waitFor(() => {
        expect(screen.getByTestId('optimized-camera')).toBeInTheDocument();
      });
    });

    it('should not redirect when user is authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      render(<QuickPhotoPage />);

      await waitFor(() => {
        expect(screen.getByTestId('optimized-camera')).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalledWith('/login');
    });
  });

  describe('Camera rendering', () => {
    beforeEach(async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    });

    it('should render OptimizedCamera with showGuidelines=true', async () => {
      render(<QuickPhotoPage />);

      await waitFor(() => {
        const camera = screen.getByTestId('optimized-camera');
        expect(camera).toBeInTheDocument();
        expect(camera).toHaveAttribute('data-show-guidelines', 'true');
      });
    });

    it('should render capture button', async () => {
      render(<QuickPhotoPage />);

      await waitFor(() => {
        expect(screen.getByText('Capture')).toBeInTheDocument();
      });
    });

    it('should render cancel button', async () => {
      render(<QuickPhotoPage />);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel action', () => {
    it('should navigate to / when cancel is clicked', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      render(<QuickPhotoPage />);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      act(() => {
        cancelButton.click();
      });

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Photo capture', () => {
    beforeEach(async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    });

    it('should call imageOptimizer.optimizeForUpload when photo is captured', async () => {
      render(<QuickPhotoPage />);

      await waitFor(() => {
        expect(screen.getByText('Capture')).toBeInTheDocument();
      });

      const captureButton = screen.getByText('Capture');
      await act(async () => {
        captureButton.click();
      });

      await waitFor(() => {
        expect(mockOptimizeForUpload).toHaveBeenCalled();
      });
    });

    it('should show processing toast when photo is captured', async () => {
      render(<QuickPhotoPage />);

      await waitFor(() => {
        expect(screen.getByText('Capture')).toBeInTheDocument();
      });

      const captureButton = screen.getByText('Capture');
      await act(async () => {
        captureButton.click();
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Processing photo...',
          }),
        );
      });
    });

    it('should navigate to / after photo capture', async () => {
      render(<QuickPhotoPage />);

      await waitFor(() => {
        expect(screen.getByText('Capture')).toBeInTheDocument();
      });

      const captureButton = screen.getByText('Capture');
      await act(async () => {
        captureButton.click();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should show error toast when image optimization fails', async () => {
      mockOptimizeForUpload.mockRejectedValue(new Error('Optimization failed'));

      render(<QuickPhotoPage />);

      await waitFor(() => {
        expect(screen.getByText('Capture')).toBeInTheDocument();
      });

      const captureButton = screen.getByText('Capture');
      await act(async () => {
        captureButton.click();
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            variant: 'destructive',
          }),
        );
      });
    });
  });
});