import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Alert, AlertDescription, AlertTitle } from '../alert';

describe('Alert Component', () => {
  // Happy path tests
  describe('Basic Rendering', () => {
    it('renders alert with default variant', () => {
      render(<Alert>Default alert content</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('data-slot', 'alert');
    });

    it('renders alert with custom content', () => {
      const testContent = 'This is a test alert message';
      render(<Alert>{testContent}</Alert>);
      
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it('renders alert with children elements', () => {
      render(
        <Alert>
          <AlertTitle>Test Title</AlertTitle>
          <AlertDescription>Test Description</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('renders as a div element', () => {
      render(<Alert>Test content</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert.tagName).toBe('DIV');
    });
  });

  // Variant tests
  describe('Variants', () => {
    it('renders default variant correctly', () => {
      render(<Alert variant="default">Default alert</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-card', 'text-card-foreground');
    });

    it('renders destructive variant correctly', () => {
      render(<Alert variant="destructive">Destructive alert</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('text-destructive', 'bg-card');
    });

    it('uses default variant when no variant is specified', () => {
      render(<Alert>No variant specified</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-card', 'text-card-foreground');
    });

    it('handles undefined variant gracefully', () => {
      render(<Alert variant={undefined}>Undefined variant</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('bg-card', 'text-card-foreground');
    });
  });

  // Props and customization tests
  describe('Props and Customization', () => {
    it('applies custom className', () => {
      const customClass = 'custom-alert-class';
      render(<Alert className={customClass}>Custom class alert</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass(customClass);
    });

    it('forwards additional props to the div element', () => {
      render(<Alert data-testid="custom-alert" id="alert-1">Custom props alert</Alert>);
      
      const alert = screen.getByTestId('custom-alert');
      expect(alert).toHaveAttribute('id', 'alert-1');
    });

    it('applies custom styles', () => {
      const customStyle = { backgroundColor: 'red', padding: '20px' };
      render(<Alert style={customStyle}>Styled alert</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveStyle('background-color: red');
      expect(alert).toHaveStyle('padding: 20px');
    });

    it('merges custom className with default classes', () => {
      render(<Alert className="custom-class">Test</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('custom-class');
      expect(alert).toHaveClass('relative', 'w-full', 'rounded-lg', 'border');
    });

    it('supports all standard div props', () => {
      render(
        <Alert
          title="Alert Title"
          onClick={() => {}}
          onMouseEnter={() => {}}
          tabIndex={0}
          data-custom="value"
        >
          Test alert
        </Alert>
      );
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('title', 'Alert Title');
      expect(alert).toHaveAttribute('tabIndex', '0');
      expect(alert).toHaveAttribute('data-custom', 'value');
    });
  });

  // Grid and layout tests
  describe('Grid Layout', () => {
    it('applies grid layout classes', () => {
      render(<Alert>Grid layout test</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('grid', 'grid-cols-[0_1fr]');
    });

    it('applies icon-specific grid classes when icon is present', () => {
      render(
        <Alert>
          <svg className="size-4" />
          <AlertTitle>With Icon</AlertTitle>
        </Alert>
      );
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]');
    });

    it('applies icon styling classes', () => {
      render(<Alert>Icon test</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('[&>svg]:size-4', '[&>svg]:translate-y-0.5', '[&>svg]:text-current');
    });
  });

  // Edge cases and error conditions
  describe('Edge Cases', () => {
    it('handles empty content gracefully', () => {
      render(<Alert></Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toBeEmptyDOMElement();
    });

    it('handles null children', () => {
      render(<Alert>{null}</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('handles boolean children', () => {
      render(<Alert>{true && 'Conditional content'}</Alert>);
      
      expect(screen.getByText('Conditional content')).toBeInTheDocument();
    });

    it('handles long content without breaking layout', () => {
      const longContent = 'This is a very long alert message that should wrap properly and not break the layout of the component even when it contains a lot of text content that spans multiple lines and might cause overflow issues in poorly designed components.';
      
      render(<Alert>{longContent}</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      const specialContent = 'Alert with special chars: !@#$%^&*()[]{}|;:,.<>?';
      render(<Alert>{specialContent}</Alert>);
      
      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });

    it('handles numeric content', () => {
      render(<Alert>{123}</Alert>);
      
      expect(screen.getByText('123')).toBeInTheDocument();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has proper ARIA role', () => {
      render(<Alert>Accessible alert</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('role', 'alert');
    });

    it('is focusable when tabIndex is provided', () => {
      render(<Alert tabIndex={0}>Focusable alert</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('tabIndex', '0');
    });

    it('supports aria-label for screen readers', () => {
      render(<Alert aria-label="Important notification">Alert content</Alert>);
      
      const alert = screen.getByLabelText('Important notification');
      expect(alert).toBeInTheDocument();
    });

    it('supports aria-describedby for additional context', () => {
      render(
        <div>
          <Alert aria-describedby="alert-description">Alert content</Alert>
          <div id="alert-description">Additional context</div>
        </div>
      );
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-describedby', 'alert-description');
    });

    it('supports aria-live for dynamic content', () => {
      render(<Alert aria-live="polite">Live region alert</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  // Integration with sub-components
  describe('Integration with Sub-components', () => {
    it('renders with AlertTitle and AlertDescription', () => {
      render(
        <Alert>
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>This is an important message</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('Important')).toBeInTheDocument();
      expect(screen.getByText('This is an important message')).toBeInTheDocument();
    });

    it('handles complex nested content', () => {
      render(
        <Alert>
          <div className="flex items-center gap-2">
            <svg className="size-4" />
            <AlertTitle>Success</AlertTitle>
          </div>
          <AlertDescription>
            Your action was completed successfully. You can now proceed to the next step.
          </AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText(/Your action was completed successfully/)).toBeInTheDocument();
    });

    it('works with mixed content types', () => {
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
          <p>Custom paragraph</p>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Custom paragraph')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('renders multiple alerts efficiently', () => {
      const alerts = Array.from({ length: 10 }, (_, i) => (
        <Alert key={i} variant={i % 2 === 0 ? 'default' : 'destructive'}>
          Alert {i + 1}
        </Alert>
      ));
      
      render(<div>{alerts}</div>);
      
      expect(screen.getAllByRole('alert')).toHaveLength(10);
    });

    it('handles re-renders with same props efficiently', () => {
      const { rerender } = render(<Alert>Initial content</Alert>);
      
      rerender(<Alert>Initial content</Alert>);
      
      expect(screen.getByText('Initial content')).toBeInTheDocument();
    });
  });

  // Snapshot tests
  describe('Snapshots', () => {
    it('matches snapshot for default variant', () => {
      const { container } = render(<Alert>Default alert</Alert>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for destructive variant', () => {
      const { container } = render(<Alert variant="destructive">Destructive alert</Alert>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with complex content', () => {
      const { container } = render(
        <Alert>
          <svg className="size-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>This is a warning message</AlertDescription>
        </Alert>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

// Tests for AlertTitle component
describe('AlertTitle Component', () => {
  it('renders with correct default element', () => {
    render(<AlertTitle>Test Title</AlertTitle>);
    
    const title = screen.getByText('Test Title');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('DIV');
  });

  it('has correct data-slot attribute', () => {
    render(<AlertTitle>Test Title</AlertTitle>);
    
    const title = screen.getByText('Test Title');
    expect(title).toHaveAttribute('data-slot', 'alert-title');
  });

  it('applies default styling classes', () => {
    render(<AlertTitle>Test Title</AlertTitle>);
    
    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('col-start-2', 'line-clamp-1', 'min-h-4', 'font-medium', 'tracking-tight');
  });

  it('applies custom className', () => {
    render(<AlertTitle className="custom-title">Custom Title</AlertTitle>);
    
    const title = screen.getByText('Custom Title');
    expect(title).toHaveClass('custom-title');
    expect(title).toHaveClass('col-start-2', 'line-clamp-1', 'min-h-4', 'font-medium', 'tracking-tight');
  });

  it('forwards additional props', () => {
    render(<AlertTitle data-testid="alert-title" id="title-1">Props Title</AlertTitle>);
    
    const title = screen.getByTestId('alert-title');
    expect(title).toHaveAttribute('id', 'title-1');
  });

  it('handles empty content', () => {
    render(<AlertTitle></AlertTitle>);
    
    const title = screen.getByText('', { selector: '[data-slot="alert-title"]' });
    expect(title).toBeInTheDocument();
  });

  it('handles long titles with line-clamp', () => {
    const longTitle = 'This is a very long title that should be clamped to one line and truncated with ellipsis';
    render(<AlertTitle>{longTitle}</AlertTitle>);
    
    const title = screen.getByText(longTitle);
    expect(title).toHaveClass('line-clamp-1');
  });
});

// Tests for AlertDescription component
describe('AlertDescription Component', () => {
  it('renders with correct default element', () => {
    render(<AlertDescription>Test Description</AlertDescription>);
    
    const description = screen.getByText('Test Description');
    expect(description).toBeInTheDocument();
    expect(description.tagName).toBe('DIV');
  });

  it('has correct data-slot attribute', () => {
    render(<AlertDescription>Test Description</AlertDescription>);
    
    const description = screen.getByText('Test Description');
    expect(description).toHaveAttribute('data-slot', 'alert-description');
  });

  it('applies default styling classes', () => {
    render(<AlertDescription>Test Description</AlertDescription>);
    
    const description = screen.getByText('Test Description');
    expect(description).toHaveClass('text-muted-foreground', 'col-start-2', 'grid', 'justify-items-start', 'gap-1', 'text-sm');
  });

  it('applies custom className', () => {
    render(<AlertDescription className="custom-desc">Custom Description</AlertDescription>);
    
    const description = screen.getByText('Custom Description');
    expect(description).toHaveClass('custom-desc');
    expect(description).toHaveClass('text-muted-foreground', 'col-start-2', 'grid', 'justify-items-start', 'gap-1', 'text-sm');
  });

  it('forwards additional props', () => {
    render(<AlertDescription data-testid="alert-desc" id="desc-1">Props Description</AlertDescription>);
    
    const description = screen.getByTestId('alert-desc');
    expect(description).toHaveAttribute('id', 'desc-1');
  });

  it('handles multiline content', () => {
    render(
      <AlertDescription>
        <p>Line 1</p>
        <p>Line 2</p>
        <p>Line 3</p>
      </AlertDescription>
    );
    
    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 2')).toBeInTheDocument();
    expect(screen.getByText('Line 3')).toBeInTheDocument();
  });

  it('applies paragraph styling to nested p elements', () => {
    render(
      <AlertDescription>
        <p>Paragraph content</p>
      </AlertDescription>
    );
    
    const description = screen.getByText('Paragraph content').parentElement;
    expect(description).toHaveClass('[&_p]:leading-relaxed');
  });

  it('handles empty content', () => {
    render(<AlertDescription></AlertDescription>);
    
    const description = screen.getByText('', { selector: '[data-slot="alert-description"]' });
    expect(description).toBeInTheDocument();
  });

  it('handles rich content with links and formatting', () => {
    render(
      <AlertDescription>
        <p>
          This is a description with <a href="#link">a link</a> and <strong>bold text</strong>.
        </p>
      </AlertDescription>
    );
    
    expect(screen.getByText('This is a description with')).toBeInTheDocument();
    expect(screen.getByText('a link')).toBeInTheDocument();
    expect(screen.getByText('bold text')).toBeInTheDocument();
  });
});