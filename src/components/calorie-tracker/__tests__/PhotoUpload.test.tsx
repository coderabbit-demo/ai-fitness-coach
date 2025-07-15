import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import PhotoUpload from '../PhotoUpload'

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } }
      }))
    }
  }))
}))

jest.mock('@/lib/supabase-storage', () => ({
  SupabaseStorageClient: jest.fn()
}))

jest.mock('@/lib/image-processing', () => ({
  ImageProcessor: jest.fn()
}))

const mockRouterPush = jest.fn()

describe('PhotoUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush
    })
  })

  it('renders initial view with upload options', () => {
    render(<PhotoUpload />)
    
    expect(screen.getByText('Add Meal Photo')).toBeInTheDocument()
    expect(screen.getByText('Take Photo')).toBeInTheDocument()
    expect(screen.getByText('Upload Photo')).toBeInTheDocument()
    expect(screen.getByText('Skip photo and enter manually')).toBeInTheDocument()
  })

  it('shows camera view when take photo is clicked', () => {
    render(<PhotoUpload />)
    
    fireEvent.click(screen.getByText('Take Photo'))
    
    // Camera component should be rendered
    expect(screen.getByText('Starting camera...')).toBeInTheDocument()
  })

  it('shows manual entry form when skip photo is clicked', () => {
    render(<PhotoUpload />)
    
    fireEvent.click(screen.getByText('Skip photo and enter manually'))
    
    // Manual entry form should be rendered
    expect(screen.getByText('Manual Nutrition Entry')).toBeInTheDocument()
  })
})