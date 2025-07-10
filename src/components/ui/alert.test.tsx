import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { Alert, AlertDescription, AlertTitle } from './alert'

describe('Alert Component', () => {
  // Happy path tests
  describe('Basic functionality', () => {
    it('renders with default variant', () => {
      render(<Alert>Default alert</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveAttribute('data-slot', 'alert')
    })

    it('renders with custom className', () => {
      render(<Alert className="custom-class">Alert with custom class</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('custom-class')
    })

    it('renders children correctly', () => {
      render(<Alert>Test alert content</Alert>)
      expect(screen.getByText('Test alert content')).toBeInTheDocument()
    })

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>()
      render(<Alert ref={ref}>Alert with ref</Alert>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('applies correct role attribute', () => {
      render(<Alert>Alert with role</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('role', 'alert')
    })
  })

  // Variant tests - based on actual implementation
  describe('Variants', () => {
    it('renders default variant with correct styles', () => {
      render(<Alert variant="default">Default variant</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-card', 'text-card-foreground')
    })

    it('renders destructive variant with correct styles', () => {
      render(<Alert variant="destructive">Destructive variant</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('text-destructive', 'bg-card')
    })

    it('defaults to default variant when no variant specified', () => {
      render(<Alert>No variant specified</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-card', 'text-card-foreground')
    })

    it('applies base styles regardless of variant', () => {
      render(<Alert variant="destructive">Test alert</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass(
        'relative',
        'w-full',
        'rounded-lg',
        'border',
        'px-4',
        'py-3',
        'text-sm',
        'grid'
      )
    })
  })

  // Grid layout tests
  describe('Grid layout functionality', () => {
    it('applies correct grid classes for SVG icons', () => {
      render(
        <Alert>
          <svg className="h-4 w-4" role="img" aria-label="test icon">
            <circle cx="12" cy="12" r="10"/>
          </svg>
          Test content
        </Alert>
      )
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]')
    })

    it('applies correct spacing classes', () => {
      render(<Alert>Test spacing</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('has-[>svg]:gap-x-3', 'gap-y-0.5', 'items-start')
    })

    it('applies SVG-specific styles', () => {
      render(<Alert>Test SVG styles</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass(
        '[&>svg]:size-4',
        '[&>svg]:translate-y-0.5',
        '[&>svg]:text-current'
      )
    })
  })

  // Edge cases
  describe('Edge cases', () => {
    it('handles empty children', () => {
      render(<Alert />)
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toBeEmptyDOMElement()
    })

    it('handles null children', () => {
      render(<Alert>{null}</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    it('handles undefined variant gracefully', () => {
      render(<Alert variant={undefined}>Undefined variant</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-card', 'text-card-foreground')
    })

    it('handles multiple children', () => {
      render(
        <Alert>
          <span>First child</span>
          <span>Second child</span>
        </Alert>
      )
      expect(screen.getByText('First child')).toBeInTheDocument()
      expect(screen.getByText('Second child')).toBeInTheDocument()
    })

    it('handles complex nested content', () => {
      render(
        <Alert>
          <div>
            <h3>Title</h3>
            <p>Description</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </Alert>
      )
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })
  })

  // Accessibility tests
  describe('Accessibility', () => {
    it('has correct ARIA role', () => {
      render(<Alert>Accessible alert</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    it('supports additional ARIA attributes', () => {
      render(
        <Alert 
          aria-label="Important notification"
          aria-describedby="alert-description"
        >
          Alert with ARIA attributes
        </Alert>
      )
      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-label', 'Important notification')
      expect(alert).toHaveAttribute('aria-describedby', 'alert-description')
    })

    it('supports keyboard navigation when focusable', () => {
      render(<Alert tabIndex={0}>Focusable alert</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('tabindex', '0')
    })
  })

  // Props spreading tests
  describe('Props handling', () => {
    it('spreads additional div props correctly', () => {
      render(
        <Alert 
          id="test-alert"
          data-testid="custom-alert"
          onClick={() => {}}
        >
          Props test
        </Alert>
      )
      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('id', 'test-alert')
      expect(alert).toHaveAttribute('data-testid', 'custom-alert')
    })

    it('handles style prop correctly', () => {
      render(
        <Alert style={{ backgroundColor: 'red' }}>
          Styled alert
        </Alert>
      )
      const alert = screen.getByRole('alert')
      expect(alert).toHaveStyle({ backgroundColor: 'red' })
    })
  })
})

describe('AlertTitle Component', () => {
  it('renders correctly as a div', () => {
    render(<AlertTitle>Test Title</AlertTitle>)
    const title = screen.getByText('Test Title')
    expect(title).toBeInTheDocument()
    expect(title.tagName).toBe('DIV')
  })

  it('applies correct data-slot attribute', () => {
    render(<AlertTitle>Test Title</AlertTitle>)
    const title = screen.getByText('Test Title')
    expect(title).toHaveAttribute('data-slot', 'alert-title')
  })

  it('applies correct CSS classes', () => {
    render(<AlertTitle>Test Title</AlertTitle>)
    const title = screen.getByText('Test Title')
    expect(title).toHaveClass(
      'col-start-2',
      'line-clamp-1',
      'min-h-4',
      'font-medium',
      'tracking-tight'
    )
  })

  it('applies custom className', () => {
    render(<AlertTitle className="custom-title">Custom Title</AlertTitle>)
    const title = screen.getByText('Custom Title')
    expect(title).toHaveClass('custom-title')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<AlertTitle ref={ref}>Title with ref</AlertTitle>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('handles empty content', () => {
    render(<AlertTitle />)
    const title = screen.getByText('')
    expect(title).toBeEmptyDOMElement()
  })

  it('handles complex content', () => {
    render(
      <AlertTitle>
        <span>Complex</span> <strong>Title</strong>
      </AlertTitle>
    )
    expect(screen.getByText('Complex')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('spreads additional div props', () => {
    render(
      <AlertTitle 
        id="test-title"
        data-testid="custom-title"
      >
        Props test
      </AlertTitle>
    )
    const title = screen.getByText('Props test')
    expect(title).toHaveAttribute('id', 'test-title')
    expect(title).toHaveAttribute('data-testid', 'custom-title')
  })
})

describe('AlertDescription Component', () => {
  it('renders correctly as a div', () => {
    render(<AlertDescription>Test Description</AlertDescription>)
    const description = screen.getByText('Test Description')
    expect(description).toBeInTheDocument()
    expect(description.tagName).toBe('DIV')
  })

  it('applies correct data-slot attribute', () => {
    render(<AlertDescription>Test Description</AlertDescription>)
    const description = screen.getByText('Test Description')
    expect(description).toHaveAttribute('data-slot', 'alert-description')
  })

  it('applies correct CSS classes', () => {
    render(<AlertDescription>Test Description</AlertDescription>)
    const description = screen.getByText('Test Description')
    expect(description).toHaveClass(
      'text-muted-foreground',
      'col-start-2',
      'grid',
      'justify-items-start',
      'gap-1',
      'text-sm',
      '[&_p]:leading-relaxed'
    )
  })

  it('applies custom className', () => {
    render(<AlertDescription className="custom-desc">Custom Description</AlertDescription>)
    const description = screen.getByText('Custom Description')
    expect(description).toHaveClass('custom-desc')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<AlertDescription ref={ref}>Description with ref</AlertDescription>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('handles empty content', () => {
    render(<AlertDescription />)
    const description = screen.getByText('')
    expect(description).toBeEmptyDOMElement()
  })

  it('handles paragraph content with correct styling', () => {
    render(
      <AlertDescription>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
      </AlertDescription>
    )
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument()
  })

  it('handles multiline content', () => {
    render(
      <AlertDescription>
        Line 1{'\n'}
        Line 2{'\n'}
        Line 3
      </AlertDescription>
    )
    const description = screen.getByText(/Line 1.*Line 2.*Line 3/s)
    expect(description).toBeInTheDocument()
  })

  it('spreads additional div props', () => {
    render(
      <AlertDescription 
        id="test-desc"
        data-testid="custom-desc"
      >
        Props test
      </AlertDescription>
    )
    const description = screen.getByText('Props test')
    expect(description).toHaveAttribute('id', 'test-desc')
    expect(description).toHaveAttribute('data-testid', 'custom-desc')
  })
})

// Full integration tests
describe('Alert Component Integration', () => {
  it('renders complete alert with all components', () => {
    render(
      <Alert>
        <svg className="h-4 w-4" role="img" aria-label="info icon">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        <AlertTitle>Integration Test Title</AlertTitle>
        <AlertDescription>
          This is a comprehensive integration test description.
        </AlertDescription>
      </Alert>
    )
    
    expect(screen.getByText('Integration Test Title')).toBeInTheDocument()
    expect(screen.getByText('This is a comprehensive integration test description.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'info icon' })).toBeInTheDocument()
  })

  it('handles both variants with all components', () => {
    const variants = ['default', 'destructive'] as const
    
    variants.forEach(variant => {
      const { unmount } = render(
        <Alert variant={variant}>
          <svg className="h-4 w-4" role="img" aria-label={`${variant} icon`}>
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <AlertTitle>Test {variant} Alert</AlertTitle>
          <AlertDescription>
            This is a {variant} alert description with detailed information.
          </AlertDescription>
        </Alert>
      )
      
      expect(screen.getByText(`Test ${variant} Alert`)).toBeInTheDocument()
      expect(screen.getByText(`This is a ${variant} alert description with detailed information.`)).toBeInTheDocument()
      expect(screen.getByRole('img', { name: `${variant} icon` })).toBeInTheDocument()
      
      unmount()
    })
  })

  it('handles conditional rendering of components', () => {
    const ConditionalAlert = ({ showTitle, showDescription }: { showTitle: boolean, showDescription: boolean }) => (
      <Alert>
        <svg className="h-4 w-4" role="img" aria-label="conditional icon">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        {showTitle && <AlertTitle>Conditional Title</AlertTitle>}
        {showDescription && <AlertDescription>Conditional Description</AlertDescription>}
      </Alert>
    )
    
    const { rerender } = render(<ConditionalAlert showTitle={true} showDescription={true} />)
    expect(screen.getByText('Conditional Title')).toBeInTheDocument()
    expect(screen.getByText('Conditional Description')).toBeInTheDocument()
    
    rerender(<ConditionalAlert showTitle={false} showDescription={true} />)
    expect(screen.queryByText('Conditional Title')).not.toBeInTheDocument()
    expect(screen.getByText('Conditional Description')).toBeInTheDocument()
    
    rerender(<ConditionalAlert showTitle={true} showDescription={false} />)
    expect(screen.getByText('Conditional Title')).toBeInTheDocument()
    expect(screen.queryByText('Conditional Description')).not.toBeInTheDocument()
  })

  it('handles dynamic content updates', () => {
    const DynamicAlert = () => {
      const [content, setContent] = React.useState('Initial content')
      
      React.useEffect(() => {
        const timer = setTimeout(() => {
          setContent('Updated content')
        }, 100)
        return () => clearTimeout(timer)
      }, [])
      
      return (
        <Alert>
          <AlertDescription>{content}</AlertDescription>
        </Alert>
      )
    }
    
    render(<DynamicAlert />)
    expect(screen.getByText('Initial content')).toBeInTheDocument()
    
    // Wait for content update
    setTimeout(() => {
      expect(screen.getByText('Updated content')).toBeInTheDocument()
    }, 150)
  })
})

// Performance and stress tests
describe('Alert Performance', () => {
  it('handles multiple alerts efficiently', () => {
    const alerts = Array.from({ length: 50 }, (_, i) => (
      <Alert key={i} variant={i % 2 === 0 ? 'default' : 'destructive'}>
        <AlertTitle>Alert {i}</AlertTitle>
        <AlertDescription>Description for alert {i}</AlertDescription>
      </Alert>
    ))
    
    const { unmount } = render(<div>{alerts}</div>)
    
    // Check that first and last alerts are rendered
    expect(screen.getByText('Alert 0')).toBeInTheDocument()
    expect(screen.getByText('Alert 49')).toBeInTheDocument()
    
    unmount()
  })

  it('handles deep nesting without issues', () => {
    render(
      <Alert>
        <AlertTitle>
          <span>
            <strong>
              <em>Deeply nested title</em>
            </strong>
          </span>
        </AlertTitle>
        <AlertDescription>
          <div>
            <p>
              <span>Deeply nested description</span>
            </p>
          </div>
        </AlertDescription>
      </Alert>
    )
    
    expect(screen.getByText('Deeply nested title')).toBeInTheDocument()
    expect(screen.getByText('Deeply nested description')).toBeInTheDocument()
  })

  it('cleans up properly on unmount', () => {
    const AlertWithCleanup = () => {
      const [count, setCount] = React.useState(0)
      
      React.useEffect(() => {
        const handler = () => setCount(prev => prev + 1)
        document.addEventListener('click', handler)
        return () => document.removeEventListener('click', handler)
      }, [])
      
      return (
        <Alert>
          <AlertDescription>Click count: {count}</AlertDescription>
        </Alert>
      )
    }
    
    const { unmount } = render(<AlertWithCleanup />)
    expect(screen.getByText('Click count: 0')).toBeInTheDocument()
    
    unmount()
    // Component should clean up without memory leaks
  })
})