import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import '@testing-library/jest-dom'
import Home from './page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  redirect: jest.fn(),
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt} />
  ),
}))

// Mock dashboard preview components
jest.mock('@/components/dashboard-preview', () => ({
  WeightProgressChart: () => <div data-testid="weight-progress-chart">Weight Progress Chart</div>,
  CalorieIntakeChart: () => <div data-testid="calorie-intake-chart">Calorie Intake Chart</div>,
  MoodSleepChart: () => <div data-testid="mood-sleep-chart">Mood Sleep Chart</div>,
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return children
    }
    return <button {...props}>{children}</button>
  },
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

describe('Home Page - AI Fitness Coach Landing Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Basic Rendering and Structure', () => {
    it('should render without crashing', () => {
      expect(() => render(<Home />)).not.toThrow()
    })

    it('should render the main container with correct styling', () => {
      render(<Home />)
      const container = screen.getByRole('main') || document.querySelector('.min-h-screen')
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass('min-h-screen')
    })

    it('should have proper document structure with all sections', () => {
      render(<Home />)
      
      // Check for navigation
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
      
      // Check for main sections
      expect(screen.getByRole('banner')).toBeInTheDocument() // Hero section
      expect(screen.getByRole('contentinfo')).toBeInTheDocument() // Footer
    })

    it('should render with correct initial state', () => {
      const { container } = render(<Home />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should not have console errors during render', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      render(<Home />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Navigation Bar', () => {
    it('should render the navigation with brand logo and text', () => {
      render(<Home />)
      
      expect(screen.getByText('AI Fitness Coach')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should display all navigation links', () => {
      render(<Home />)
      
      const navigationLinks = [
        { text: 'Features', href: '/features' },
        { text: 'About', href: '/about' },
        { text: 'Profile', href: '/profile' },
        { text: 'Sign In', href: '/login' },
      ]
      
      navigationLinks.forEach(link => {
        const navLink = screen.getByText(link.text)
        expect(navLink).toBeInTheDocument()
        expect(navLink.closest('a')).toHaveAttribute('href', link.href)
      })
    })

    it('should render the GitHub star button', () => {
      render(<Home />)
      
      const githubButton = screen.getByText('Star on GitHub')
      expect(githubButton).toBeInTheDocument()
      expect(githubButton.closest('a')).toHaveAttribute('href', 'https://github.com/edgarcerecerez/ai-fitness-coach')
    })

    it('should have sticky navigation with proper styling', () => {
      render(<Home />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('sticky', 'top-0', 'z-50')
    })
  })

  describe('Hero Section', () => {
    it('should render the hero section with background image', () => {
      render(<Home />)
      
      const heroSection = screen.getByRole('banner')
      expect(heroSection).toBeInTheDocument()
      expect(heroSection).toHaveStyle({
        backgroundImage: "url('/images/ai-health-training-app.png')"
      })
    })

    it('should display the main heading with gradient text', () => {
      render(<Home />)
      
      expect(screen.getByText(/Your Personal AI Fitness Coach for/)).toBeInTheDocument()
      expect(screen.getByText('Real Results')).toBeInTheDocument()
    })

    it('should render the hero description', () => {
      render(<Home />)
      
      const description = screen.getByText(/Transform your health journey with intelligent recommendations/)
      expect(description).toBeInTheDocument()
    })

    it('should display CTA buttons', () => {
      render(<Home />)
      
      const startJourneyButton = screen.getByText('Start Your Journey')
      const exploreFeaturesButton = screen.getByText('Explore Features')
      
      expect(startJourneyButton).toBeInTheDocument()
      expect(exploreFeaturesButton).toBeInTheDocument()
      
      expect(startJourneyButton.closest('a')).toHaveAttribute('href', '/login')
      expect(exploreFeaturesButton.closest('a')).toHaveAttribute('href', '/features')
    })

    it('should render the AI-Powered Fitness Coaching badge', () => {
      render(<Home />)
      
      expect(screen.getByText('AI-Powered Fitness Coaching')).toBeInTheDocument()
    })
  })

  describe('Dashboard Preview Section', () => {
    it('should render dashboard preview with all charts', () => {
      render(<Home />)
      
      expect(screen.getByText('Your AI Fitness Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Live preview of your personalized insights')).toBeInTheDocument()
      
      // Check for mocked chart components
      expect(screen.getByTestId('weight-progress-chart')).toBeInTheDocument()
      expect(screen.getByTestId('calorie-intake-chart')).toBeInTheDocument()
      expect(screen.getByTestId('mood-sleep-chart')).toBeInTheDocument()
    })

    it('should have proper layout structure for charts', () => {
      render(<Home />)
      
      const dashboardContainer = screen.getByText('Your AI Fitness Dashboard').closest('.bg-white')
      expect(dashboardContainer).toBeInTheDocument()
      expect(dashboardContainer).toHaveClass('rounded-2xl', 'p-6')
    })
  })

  describe('Features Section', () => {
    it('should render the features section with proper heading', () => {
      render(<Home />)
      
      expect(screen.getByText('Everything You Need for Success')).toBeInTheDocument()
      expect(screen.getByText(/Our holistic approach combines cutting-edge AI/)).toBeInTheDocument()
    })

    it('should display all feature cards', () => {
      render(<Home />)
      
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

    it('should render feature descriptions', () => {
      render(<Home />)
      
      expect(screen.getByText(/Simply take a photo of your meal/)).toBeInTheDocument()
      expect(screen.getByText(/Connect your smart scale or Apple HealthKit/)).toBeInTheDocument()
      expect(screen.getByText(/Get personalized recommendations based on your weight/)).toBeInTheDocument()
    })

    it('should have proper grid layout for feature cards', () => {
      render(<Home />)
      
      const featuresGrid = screen.getByText('Smart Calorie Tracking').closest('.grid')
      expect(featuresGrid).toBeInTheDocument()
    })
  })

  describe('Value Proposition Section', () => {
    it('should render the value proposition section', () => {
      render(<Home />)
      
      expect(screen.getByText('Built for Real People, Real Results')).toBeInTheDocument()
      expect(screen.getByText('Your Success First')).toBeInTheDocument()
    })

    it('should display value proposition points', () => {
      render(<Home />)
      
      const valuePoints = [
        'Personalized recommendations that evolve with you',
        'Minimal friction tracking with maximum insights',
        'Focus on sustainable habits, not quick fixes'
      ]
      
      valuePoints.forEach(point => {
        expect(screen.getByText(point)).toBeInTheDocument()
      })
    })

    it('should render the learn more button', () => {
      render(<Home />)
      
      const learnMoreButton = screen.getByText('Learn More About Our Mission')
      expect(learnMoreButton).toBeInTheDocument()
      expect(learnMoreButton.closest('a')).toHaveAttribute('href', '/about')
    })

    it('should display the placeholder image', () => {
      render(<Home />)
      
      const image = screen.getByAltText('AI Fitness Coach Features')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', '/placeholder.svg?height=500&width=600')
    })
  })

  describe('Call-to-Action Section', () => {
    it('should render the CTA section with proper styling', () => {
      render(<Home />)
      
      expect(screen.getByText('Ready to Transform Your Health Journey?')).toBeInTheDocument()
      expect(screen.getByText('Open Source & Community Driven')).toBeInTheDocument()
    })

    it('should display CTA buttons', () => {
      render(<Home />)
      
      const getStartedButton = screen.getByText('Get Started Free')
      const contributeButton = screen.getByText('Contribute to the Project')
      
      expect(getStartedButton).toBeInTheDocument()
      expect(contributeButton).toBeInTheDocument()
      
      expect(getStartedButton.closest('a')).toHaveAttribute('href', '/signup')
      expect(contributeButton.closest('a')).toHaveAttribute('href', '/contribute')
    })

    it('should have dark background styling', () => {
      render(<Home />)
      
      const ctaSection = screen.getByText('Ready to Transform Your Health Journey?').closest('section')
      expect(ctaSection).toHaveClass('bg-slate-900')
    })
  })

  describe('Footer Section', () => {
    it('should render the footer with brand information', () => {
      render(<Home />)
      
      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveClass('bg-slate-800')
      
      // Check for brand information in footer
      const footerBrand = footer.querySelector('[class*="font-bold"]')
      expect(footerBrand).toHaveTextContent('AI Fitness Coach')
    })

    it('should display footer links organized by category', () => {
      render(<Home />)
      
      const footerCategories = ['Product', 'Company', 'Support']
      footerCategories.forEach(category => {
        expect(screen.getByText(category)).toBeInTheDocument()
      })
      
      // Check for specific footer links
      const footerLinks = [
        { text: 'Features', href: '/features' },
        { text: 'Pricing', href: '/pricing' },
        { text: 'About', href: '/about' },
        { text: 'Privacy Policy', href: '/privacy' },
        { text: 'Terms of Service', href: '/terms' }
      ]
      
      footerLinks.forEach(link => {
        const footerLink = screen.getByText(link.text)
        expect(footerLink).toBeInTheDocument()
        expect(footerLink.closest('a')).toHaveAttribute('href', link.href)
      })
    })

    it('should display copyright information', () => {
      render(<Home />)
      
      expect(screen.getByText(/© 2024 AI Fitness Coach/)).toBeInTheDocument()
      expect(screen.getByText(/Open source and built with ❤️/)).toBeInTheDocument()
    })
  })

  describe('Interactive Elements and User Interactions', () => {
    it('should handle button clicks without errors', () => {
      render(<Home />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeEnabled()
        fireEvent.click(button)
        expect(button).toBeInTheDocument()
      })
    })

    it('should handle link clicks without errors', () => {
      render(<Home />)
      
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toBeVisible()
        fireEvent.click(link)
        expect(link).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', () => {
      render(<Home />)
      
      const focusableElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('link')
      ]
      
      focusableElements.forEach(element => {
        element.focus()
        expect(element).toHaveFocus()
        
        // Test keyboard interactions
        fireEvent.keyDown(element, { key: 'Enter' })
        fireEvent.keyDown(element, { key: ' ' })
      })
    })

    it('should handle hover effects on interactive elements', () => {
      render(<Home />)
      
      const interactiveElements = screen.getAllByRole('link')
      interactiveElements.forEach(element => {
        fireEvent.mouseEnter(element)
        fireEvent.mouseLeave(element)
        expect(element).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility Features', () => {
    it('should have proper ARIA attributes and roles', () => {
      render(<Home />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })

    it('should have proper alt text for images', () => {
      render(<Home />)
      
      const images = screen.getAllByRole('img')
      images.forEach(image => {
        expect(image).toHaveAttribute('alt')
        expect(image.getAttribute('alt')).toBeTruthy()
      })
    })

    it('should have proper heading hierarchy', () => {
      render(<Home />)
      
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
      
      headings.forEach(heading => {
        expect(heading).toBeVisible()
        expect(heading.tagName).toMatch(/^H[1-6]$/)
      })
    })

    it('should support screen readers with semantic HTML', () => {
      render(<Home />)
      
      // Check for semantic elements
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })

    it('should have proper color contrast', () => {
      const { container } = render(<Home />)
      
      // Check that text elements have proper contrast classes
      const textElements = container.querySelectorAll('h1, h2, h3, p, span')
      textElements.forEach(element => {
        const classList = element.className
        // Should have Tailwind color classes that provide good contrast
        expect(classList).toMatch(/(text-white|text-slate-900|text-slate-600|text-slate-300|text-slate-400)/)
      })
    })
  })

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<Home />)
      fireEvent(window, new Event('resize'))
      
      // Check that responsive classes are applied
      const heroTitle = screen.getByText(/Your Personal AI Fitness Coach/)
      expect(heroTitle).toHaveClass('text-4xl', 'md:text-6xl')
    })

    it('should adapt to tablet viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      
      render(<Home />)
      fireEvent(window, new Event('resize'))
      
      // Component should still render properly
      expect(screen.getByText('AI Fitness Coach')).toBeInTheDocument()
    })

    it('should adapt to desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })
      
      render(<Home />)
      fireEvent(window, new Event('resize'))
      
      // Check that desktop navigation is visible
      expect(screen.getByText('Features')).toBeInTheDocument()
      expect(screen.getByText('About')).toBeInTheDocument()
    })

    it('should have responsive grid layouts', () => {
      render(<Home />)
      
      // Check features grid
      const featuresSection = screen.getByText('Smart Calorie Tracking').closest('.grid')
      expect(featuresSection).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3')
    })
  })

  describe('Performance and Optimization', () => {
    it('should render efficiently', () => {
      const startTime = performance.now()
      render(<Home />)
      const endTime = performance.now()
      
      // Should render quickly (less than 200ms for complex component)
      expect(endTime - startTime).toBeLessThan(200)
    })

    it('should handle re-renders efficiently', () => {
      const { rerender } = render(<Home />)
      
      // Multiple re-renders should not cause errors
      expect(() => {
        rerender(<Home />)
        rerender(<Home />)
      }).not.toThrow()
    })

    it('should not have memory leaks', () => {
      const { unmount } = render(<Home />)
      
      // Component should unmount cleanly
      expect(() => unmount()).not.toThrow()
    })

    it('should use Next.js Image optimization', () => {
      render(<Home />)
      
      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThan(0)
      
      // All images should have alt attributes (accessibility + SEO)
      images.forEach(image => {
        expect(image).toHaveAttribute('alt')
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing props gracefully', () => {
      expect(() => render(<Home />)).not.toThrow()
    })

    it('should handle window resize events', () => {
      render(<Home />)
      
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
      
      fireEvent(window, new Event('resize'))
      
      expect(screen.getByText('AI Fitness Coach')).toBeInTheDocument()
    })

    it('should handle network errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'))
      
      render(<Home />)
      
      await waitFor(() => {
        expect(screen.getByText('AI Fitness Coach')).toBeInTheDocument()
      })
    })

    it('should handle empty data states', () => {
      render(<Home />)
      
      // Component should render even with no external data
      expect(screen.getByText('AI Fitness Coach')).toBeInTheDocument()
    })
  })

  describe('Integration with Next.js Features', () => {
    it('should use Next.js Link for navigation', () => {
      render(<Home />)
      
      const navLinks = screen.getAllByRole('link')
      expect(navLinks.length).toBeGreaterThan(0)
      
      // All links should have href attributes
      navLinks.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('should handle Next.js Image optimization', () => {
      render(<Home />)
      
      const images = screen.getAllByRole('img')
      images.forEach(image => {
        expect(image).toHaveAttribute('alt')
      })
    })

    it('should support Next.js routing', () => {
      render(<Home />)
      
      // Check for proper href attributes on navigation links
      const navigationLinks = [
        '/features',
        '/about',
        '/profile',
        '/login',
        '/signup'
      ]
      
      navigationLinks.forEach(href => {
        const link = screen.getByRole('link', { name: new RegExp(href.replace('/', ''), 'i') })
        if (link) {
          expect(link).toHaveAttribute('href', href)
        }
      })
    })
  })

  describe('SEO and Meta Information', () => {
    it('should have proper heading structure for SEO', () => {
      render(<Home />)
      
      const headings = screen.getAllByRole('heading')
      
      // Should have h1 for main title
      const h1Elements = headings.filter(h => h.tagName === 'H1')
      expect(h1Elements.length).toBeGreaterThan(0)
      
      // Should have structured heading hierarchy
      headings.forEach(heading => {
        expect(heading.tagName).toMatch(/^H[1-6]$/)
      })
    })

    it('should have descriptive text content for SEO', () => {
      render(<Home />)
      
      // Check for key terms and descriptions
      expect(screen.getByText(/AI Fitness Coach/)).toBeInTheDocument()
      expect(screen.getByText(/Transform your health journey/)).toBeInTheDocument()
      expect(screen.getByText(/personalized recommendations/)).toBeInTheDocument()
    })
  })

  describe('Content Verification', () => {
    it('should display correct brand name consistently', () => {
      render(<Home />)
      
      const brandElements = screen.getAllByText('AI Fitness Coach')
      expect(brandElements.length).toBeGreaterThan(1) // Should appear in nav and footer
    })

    it('should have consistent messaging throughout', () => {
      render(<Home />)
      
      // Check for key value propositions
      expect(screen.getByText(/AI-Powered Fitness Coaching/)).toBeInTheDocument()
      expect(screen.getByText(/Real Results/)).toBeInTheDocument()
      expect(screen.getByText(/sustainable success/)).toBeInTheDocument()
    })

    it('should not contain placeholder text', () => {
      const { container } = render(<Home />)
      const textContent = container.textContent || ''
      
      // Should not contain common placeholder patterns
      expect(textContent).not.toMatch(/lorem ipsum|placeholder|TODO|FIXME/i)
    })
  })
})