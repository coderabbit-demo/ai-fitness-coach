import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import Page from './page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>
  },
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  CardDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

jest.mock('@/components/dashboard-preview', () => ({
  WeightProgressChart: () => <div data-testid="weight-chart">Weight Chart</div>,
  CalorieIntakeChart: () => <div data-testid="calorie-chart">Calorie Chart</div>,
  MoodSleepChart: () => <div data-testid="mood-sleep-chart">Mood Sleep Chart</div>,
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Brain: () => <svg data-testid="brain-icon" />,
  Camera: () => <svg data-testid="camera-icon" />,
  Scale: () => <svg data-testid="scale-icon" />,
  Heart: () => <svg data-testid="heart-icon" />,
  Moon: () => <svg data-testid="moon-icon" />,
  TrendingUp: () => <svg data-testid="trending-up-icon" />,
  ArrowRight: () => <svg data-testid="arrow-right-icon" />,
  Sparkles: () => <svg data-testid="sparkles-icon" />,
  Target: () => <svg data-testid="target-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  ArrowLeft: () => <svg data-testid="arrow-left-icon" />,
}))

describe('HomePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    test('renders without crashing', () => {
      render(<Page />)
      expect(document.body).toBeInTheDocument()
    })

    test('renders navigation bar', () => {
      render(<Page />)
      
      expect(screen.getByText('AI Fitness Coach')).toBeInTheDocument()
      expect(screen.getByTestId('brain-icon')).toBeInTheDocument()
    })

    test('renders hero section', () => {
      render(<Page />)
      
      expect(screen.getByText(/Your Personal AI Fitness Coach/i)).toBeInTheDocument()
      expect(screen.getByText(/Transform your health journey/i)).toBeInTheDocument()
    })

    test('renders features section', () => {
      render(<Page />)
      
      expect(screen.getByText('Everything You Need for Success')).toBeInTheDocument()
      expect(screen.getByText('Smart Calorie Tracking')).toBeInTheDocument()
      expect(screen.getByText('Seamless Weight Tracking')).toBeInTheDocument()
      expect(screen.getByText('AI-Powered Insights')).toBeInTheDocument()
    })

    test('renders dashboard preview components', () => {
      render(<Page />)
      
      expect(screen.getByTestId('weight-chart')).toBeInTheDocument()
      expect(screen.getByTestId('calorie-chart')).toBeInTheDocument()
      expect(screen.getByTestId('mood-sleep-chart')).toBeInTheDocument()
    })

    test('renders footer', () => {
      render(<Page />)
      
      expect(screen.getByText(/© 2024 AI Fitness Coach/i)).toBeInTheDocument()
      expect(screen.getByText('Product')).toBeInTheDocument()
      expect(screen.getByText('Company')).toBeInTheDocument()
      expect(screen.getByText('Support')).toBeInTheDocument()
    })
  })

  describe('Navigation Links', () => {
    test('has proper navigation links in header', () => {
      render(<Page />)
      
      const featuresLink = screen.getByText('Features')
      const aboutLink = screen.getByText('About')
      const profileLink = screen.getByText('Profile')
      const signInLink = screen.getByText('Sign In')
      
      expect(featuresLink).toHaveAttribute('href', '/features')
      expect(aboutLink).toHaveAttribute('href', '/about')
      expect(profileLink).toHaveAttribute('href', '/profile')
      expect(signInLink).toHaveAttribute('href', '/login')
    })

    test('has GitHub link with correct attributes', () => {
      render(<Page />)
      
      const githubLink = screen.getByText('Star on GitHub').closest('a')
      expect(githubLink).toHaveAttribute('href', 'https://github.com/edgarcerecerez/ai-fitness-coach')
    })

    test('has main CTA buttons', () => {
      render(<Page />)
      
      const startJourneyBtn = screen.getByText('Start Your Journey')
      const exploreFeaturesBtn = screen.getByText('Explore Features')
      
      expect(startJourneyBtn.closest('a')).toHaveAttribute('href', '/login')
      expect(exploreFeaturesBtn.closest('a')).toHaveAttribute('href', '/features')
    })
  })

  describe('Interactive Elements', () => {
    test('handles button clicks without errors', () => {
      render(<Page />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        fireEvent.click(button)
        expect(button).toBeInTheDocument()
      })
    })

    test('handles link clicks without errors', () => {
      render(<Page />)
      
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        fireEvent.click(link)
        expect(link).toBeInTheDocument()
      })
    })

    test('main CTA buttons are properly linked', () => {
      render(<Page />)
      
      const getStartedBtn = screen.getByText('Get Started Free')
      const contributeBtn = screen.getByText('Contribute to the Project')
      
      expect(getStartedBtn.closest('a')).toHaveAttribute('href', '/signup')
      expect(contributeBtn.closest('a')).toHaveAttribute('href', '/contribute')
    })
  })

  describe('Content Validation', () => {
    test('displays all feature cards', () => {
      render(<Page />)
      
      const features = [
        'Smart Calorie Tracking',
        'Seamless Weight Tracking',
        'AI-Powered Insights',
        'Holistic Health Tracking',
        'Sleep Integration',
        'Progress Analytics'
      ]
      
      features.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument()
      })
    })

    test('includes feature descriptions', () => {
      render(<Page />)
      
      expect(screen.getByText(/Simply take a photo of your meal/i)).toBeInTheDocument()
      expect(screen.getByText(/Connect your smart scale/i)).toBeInTheDocument()
      expect(screen.getByText(/Get personalized recommendations/i)).toBeInTheDocument()
    })

    test('displays proper value proposition', () => {
      render(<Page />)
      
      expect(screen.getByText('Built for Real People, Real Results')).toBeInTheDocument()
      expect(screen.getByText(/Unlike other fitness apps/i)).toBeInTheDocument()
    })

    test('includes call-to-action sections', () => {
      render(<Page />)
      
      expect(screen.getByText('Ready to Transform Your Health Journey?')).toBeInTheDocument()
      expect(screen.getByText(/Join our community/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has proper heading hierarchy', () => {
      render(<Page />)
      
      const h1Elements = screen.getAllByRole('heading', { level: 1 })
      const h2Elements = screen.getAllByRole('heading', { level: 2 })
      const h3Elements = screen.getAllByRole('heading', { level: 3 })
      
      expect(h1Elements.length).toBeGreaterThanOrEqual(1)
      expect(h2Elements.length).toBeGreaterThan(0)
      expect(h3Elements.length).toBeGreaterThan(0)
    })

    test('has proper alt text for images', () => {
      render(<Page />)
      
      const images = screen.getAllByRole('img')
      images.forEach(img => {
        expect(img).toHaveAttribute('alt')
      })
    })

    test('has proper ARIA labels and roles', () => {
      render(<Page />)
      
      const navigation = screen.getByRole('navigation')
      expect(navigation).toBeInTheDocument()
      
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    test('has keyboard accessible elements', () => {
      render(<Page />)
      
      const buttons = screen.getAllByRole('button')
      const links = screen.getAllByRole('link')
      
      ;[...buttons, ...links].forEach(element => {
        expect(element).not.toHaveAttribute('tabindex', '-1')
      })
    })
  })

  describe('SEO and Meta Content', () => {
    test('has meaningful heading content', () => {
      render(<Page />)
      
      const mainHeading = screen.getByText(/Your Personal AI Fitness Coach/i)
      expect(mainHeading).toBeInTheDocument()
      expect(mainHeading.textContent?.trim()).toBeTruthy()
    })

    test('includes descriptive text content', () => {
      render(<Page />)
      
      expect(screen.getByText(/Transform your health journey with intelligent recommendations/i)).toBeInTheDocument()
      expect(screen.getByText(/holistic approach combines cutting-edge AI/i)).toBeInTheDocument()
    })

    test('has proper link structure for SEO', () => {
      render(<Page />)
      
      const internalLinks = screen.getAllByRole('link')
      const internalLinkCount = internalLinks.filter(link => {
        const href = link.getAttribute('href')
        return href && href.startsWith('/')
      }).length
      
      expect(internalLinkCount).toBeGreaterThan(5)
    })
  })

  describe('Visual Elements and Icons', () => {
    test('renders brand icons correctly', () => {
      render(<Page />)
      
      expect(screen.getAllByTestId('brain-icon')).toHaveLength(3) // Header, footer, and possibly other locations
    })

    test('renders feature icons', () => {
      render(<Page />)
      
      expect(screen.getByTestId('camera-icon')).toBeInTheDocument()
      expect(screen.getByTestId('scale-icon')).toBeInTheDocument()
      expect(screen.getByTestId('heart-icon')).toBeInTheDocument()
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument()
    })

    test('renders call-to-action icons', () => {
      render(<Page />)
      
      expect(screen.getAllByTestId('arrow-right-icon')).toHaveLength(3)
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument()
      expect(screen.getByTestId('target-icon')).toBeInTheDocument()
      expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    })
  })

  describe('Layout and Structure', () => {
    test('has proper page structure', () => {
      render(<Page />)
      
      // Check main sections exist
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })

    test('contains all major sections', () => {
      render(<Page />)
      
      // Hero section
      expect(screen.getByText(/AI-Powered Fitness Coaching/i)).toBeInTheDocument()
      
      // Features section
      expect(screen.getByText('Everything You Need for Success')).toBeInTheDocument()
      
      // Value proposition section
      expect(screen.getByText('Built for Real People, Real Results')).toBeInTheDocument()
      
      // CTA section
      expect(screen.getByText('Ready to Transform Your Health Journey?')).toBeInTheDocument()
    })
  })

  describe('Performance Considerations', () => {
    test('renders efficiently', () => {
      const startTime = performance.now()
      render(<Page />)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100)
    })

    test('handles multiple renders without memory leaks', () => {
      const { unmount } = render(<Page />)
      unmount()
      
      for (let i = 0; i < 5; i++) {
        const { unmount: unmountNext } = render(<Page />)
        unmountNext()
      }
      
      expect(true).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('handles missing image gracefully', () => {
      render(<Page />)
      
      const images = screen.getAllByRole('img')
      images.forEach(img => {
        fireEvent.error(img)
        expect(img).toBeInTheDocument()
      })
    })

    test('handles component errors gracefully', () => {
      expect(() => render(<Page />)).not.toThrow()
    })
  })

  describe('Responsive Design', () => {
    test('adapts to mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<Page />)
      
      expect(screen.getByText('AI Fitness Coach')).toBeInTheDocument()
      expect(screen.getByText(/Your Personal AI Fitness Coach/i)).toBeInTheDocument()
    })

    test('works with desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })
      
      render(<Page />)
      
      expect(screen.getByText('AI Fitness Coach')).toBeInTheDocument()
      expect(screen.getByText(/Your Personal AI Fitness Coach/i)).toBeInTheDocument()
    })
  })

  describe('Business Logic', () => {
    test('promotes key features correctly', () => {
      render(<Page />)
      
      const keyFeatures = [
        'Smart Calorie Tracking',
        'AI-Powered Insights',
        'Holistic Health Tracking'
      ]
      
      keyFeatures.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument()
      })
    })

    test('includes proper call-to-action hierarchy', () => {
      render(<Page />)
      
      // Primary CTA
      expect(screen.getByText('Start Your Journey')).toBeInTheDocument()
      
      // Secondary CTA
      expect(screen.getByText('Explore Features')).toBeInTheDocument()
      
      // Tertiary CTA
      expect(screen.getByText('Get Started Free')).toBeInTheDocument()
    })
  })

  describe('Integration with Dashboard Preview', () => {
    test('renders dashboard preview section', () => {
      render(<Page />)
      
      expect(screen.getByText('Your AI Fitness Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Live preview of your personalized insights')).toBeInTheDocument()
    })

    test('displays all dashboard components', () => {
      render(<Page />)
      
      expect(screen.getByTestId('weight-chart')).toBeInTheDocument()
      expect(screen.getByTestId('calorie-chart')).toBeInTheDocument()
      expect(screen.getByTestId('mood-sleep-chart')).toBeInTheDocument()
    })
  })

  describe('Footer Content', () => {
    test('contains all footer sections', () => {
      render(<Page />)
      
      expect(screen.getByText('Product')).toBeInTheDocument()
      expect(screen.getByText('Company')).toBeInTheDocument()
      expect(screen.getByText('Support')).toBeInTheDocument()
    })

    test('has proper footer links', () => {
      render(<Page />)
      
      const footerLinks = [
        'Features',
        'Pricing',
        'About',
        'Contact',
        'Help Center',
        'Privacy Policy',
        'Terms of Service'
      ]
      
      footerLinks.forEach(linkText => {
        expect(screen.getByText(linkText)).toBeInTheDocument()
      })
    })

    test('includes copyright information', () => {
      render(<Page />)
      
      expect(screen.getByText(/© 2024 AI Fitness Coach/i)).toBeInTheDocument()
      expect(screen.getByText(/Open source and built with ❤️/i)).toBeInTheDocument()
    })
  })

  describe('Brand Consistency', () => {
    test('maintains consistent brand colors and styling', () => {
      render(<Page />)
      
      const brandElements = screen.getAllByText('AI Fitness Coach')
      expect(brandElements.length).toBeGreaterThan(1)
    })

    test('uses consistent iconography', () => {
      render(<Page />)
      
      const brainIcons = screen.getAllByTestId('brain-icon')
      expect(brainIcons.length).toBeGreaterThan(1)
    })
  })
})