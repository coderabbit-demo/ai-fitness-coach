import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { describe, it, expect, vi } from 'vitest';

describe('Alert Component', () => {
  describe('Basic Rendering', () => {
    it('renders alert with default variant', () => {
      render(
        <Alert>
          <AlertTitle>Test Alert</AlertTitle>
          <AlertDescription>This is a test alert message</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Test Alert')).toBeInTheDocument();
      expect(screen.getByText('This is a test alert message')).toBeInTheDocument();
    });

    it('renders alert with custom className', () => {
      render(
        <Alert className="custom-alert">
          <AlertTitle>Custom Alert</AlertTitle>
        </Alert>
      );
      
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveClass('custom-alert');
    });

    it('renders alert without title', () => {
      render(
        <Alert>
          <AlertDescription>Alert without title</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Alert without title')).toBeInTheDocument();
    });

    it('renders alert without description', () => {
      render(
        <Alert>
          <AlertTitle>Alert without description</AlertTitle>
        </Alert>
      );
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Alert without description')).toBeInTheDocument();
    });

    it('renders empty alert', () => {
      render(<Alert />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Variant Styles', () => {
    it('renders default variant alert with correct classes', () => {
      render(
        <Alert variant="default">
          <AlertTitle>Default Alert</AlertTitle>
        </Alert>
      );
      
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveClass('bg-card', 'text-card-foreground');
    });

    it('renders destructive variant alert with correct classes', () => {
      render(
        <Alert variant="destructive">
          <AlertTitle>Destructive Alert</AlertTitle>
        </Alert>
      );
      
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveClass('text-destructive', 'bg-card');
    });

    it('uses default variant when no variant is specified', () => {
      render(
        <Alert>
          <AlertTitle>No Variant Alert</AlertTitle>
        </Alert>
      );
      
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveClass('bg-card', 'text-card-foreground');
    });
  });

  describe('Data Attributes', () => {
    it('has correct data-slot attribute', () => {
      render(<Alert />);
      
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveAttribute('data-slot', 'alert');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role', () => {
      render(
        <Alert>
          <AlertTitle>Accessible Alert</AlertTitle>
        </Alert>
      );
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('supports custom ARIA attributes', () => {
      render(
        <Alert aria-label="Custom alert label" aria-describedby="alert-description">
          <AlertTitle>Custom ARIA Alert</AlertTitle>
        </Alert>
      );
      
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveAttribute('aria-label', 'Custom alert label');
      expect(alertElement).toHaveAttribute('aria-describedby', 'alert-description');
    });

    it('supports tabIndex for keyboard navigation', () => {
      render(
        <Alert tabIndex={0}>
          <AlertTitle>Focusable Alert</AlertTitle>
        </Alert>
      );
      
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Content Handling', () => {
    it('renders complex content in children', () => {
      render(
        <Alert>
          <AlertTitle>
            <span>Complex</span> <strong>Title</strong>
          </AlertTitle>
          <AlertDescription>
            <p>Paragraph with <a href="#">link</a></p>
          </AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph with')).toBeInTheDocument();
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('handles null/undefined children gracefully', () => {
      render(
        <Alert>
          {null}
          {undefined}
          <AlertTitle>Valid Title</AlertTitle>
        </Alert>
      );
      
      expect(screen.getByText('Valid Title')).toBeInTheDocument();
    });

    it('handles conditional rendering', () => {
      const showDescription = true;
      render(
        <Alert>
          <AlertTitle>Conditional Alert</AlertTitle>
          {showDescription && <AlertDescription>Conditional description</AlertDescription>}
        </Alert>
      );
      
      expect(screen.getByText('Conditional Alert')).toBeInTheDocument();
      expect(screen.getByText('Conditional description')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('handles click events', () => {
      const handleClick = vi.fn();
      render(
        <Alert onClick={handleClick}>
          <AlertTitle>Clickable Alert</AlertTitle>
        </Alert>
      );
      
      fireEvent.click(screen.getByRole('alert'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events', () => {
      const handleKeyDown = vi.fn();
      render(
        <Alert onKeyDown={handleKeyDown} tabIndex={0}>
          <AlertTitle>Keyboard Alert</AlertTitle>
        </Alert>
      );
      
      fireEvent.keyDown(screen.getByRole('alert'), { key: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('handles mouse events', () => {
      const handleMouseOver = vi.fn();
      const handleMouseOut = vi.fn();
      render(
        <Alert onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
          <AlertTitle>Mouse Alert</AlertTitle>
        </Alert>
      );
      
      const alertElement = screen.getByRole('alert');
      fireEvent.mouseOver(alertElement);
      expect(handleMouseOver).toHaveBeenCalledTimes(1);
      
      fireEvent.mouseOut(alertElement);
      expect(handleMouseOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles extremely long content', () => {
      const longTitle = 'A'.repeat(1000);
      const longDescription = 'B'.repeat(2000);
      render(
        <Alert>
          <AlertTitle>{longTitle}</AlertTitle>
          <AlertDescription>{longDescription}</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      render(
        <Alert>
          <AlertTitle>Special: &lt;&gt;&amp;"'</AlertTitle>
          <AlertDescription>Symbols: @#$%^&*()_+{}|[]</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('Special: <>&"\'', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('Symbols: @#$%^&*()_+{}|[]')).toBeInTheDocument();
    });

    it('handles multiple alerts', () => {
      render(
        <div>
          <Alert>
            <AlertTitle>First Alert</AlertTitle>
          </Alert>
          <Alert>
            <AlertTitle>Second Alert</AlertTitle>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Third Alert</AlertTitle>
          </Alert>
        </div>
      );
      
      expect(screen.getAllByRole('alert')).toHaveLength(3);
      expect(screen.getByText('First Alert')).toBeInTheDocument();
      expect(screen.getByText('Second Alert')).toBeInTheDocument();
      expect(screen.getByText('Third Alert')).toBeInTheDocument();
    });

    it('handles rapid re-renders', () => {
      const { rerender } = render(
        <Alert>
          <AlertTitle>Initial Title</AlertTitle>
        </Alert>
      );
      
      rerender(
        <Alert>
          <AlertTitle>Updated Title</AlertTitle>
        </Alert>
      );
      
      expect(screen.getByText('Updated Title')).toBeInTheDocument();
      expect(screen.queryByText('Initial Title')).not.toBeInTheDocument();
    });
  });

  describe('Integration with SVG Icons', () => {
    it('renders with SVG icon and applies correct grid layout', () => {
      render(
        <Alert>
          <svg data-testid="alert-icon" />
          <AlertTitle>Alert with Icon</AlertTitle>
          <AlertDescription>This alert has an icon</AlertDescription>
        </Alert>
      );
      
      const alertElement = screen.getByRole('alert');
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(alertElement).toHaveClass('has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]');
    });

    it('applies different grid layout without icon', () => {
      render(
        <Alert>
          <AlertTitle>Alert without Icon</AlertTitle>
        </Alert>
      );
      
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveClass('grid-cols-[0_1fr]');
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies base CSS classes', () => {
      render(<Alert />);
      
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveClass(
        'relative',
        'w-full',
        'rounded-lg',
        'border',
        'px-4',
        'py-3',
        'text-sm',
        'grid'
      );
    });

    it('merges custom classes correctly', () => {
      render(<Alert className="custom-class additional-class" />);
      
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveClass('custom-class', 'additional-class');
    });
  });

  describe('Props Forwarding', () => {
    it('forwards standard div props', () => {
      render(
        <Alert
          id="test-alert"
          data-testid="custom-alert"
          style={{ backgroundColor: 'red' }}
        >
          <AlertTitle>Props Test</AlertTitle>
        </Alert>
      );
      
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveAttribute('id', 'test-alert');
      expect(alertElement).toHaveAttribute('data-testid', 'custom-alert');
      expect(alertElement).toHaveStyle('background-color: red');
    });
  });
});

describe('AlertTitle Component', () => {
  it('renders with correct element and data-slot', () => {
    render(<AlertTitle>Test Title</AlertTitle>);
    
    const titleElement = screen.getByText('Test Title');
    expect(titleElement.tagName).toBe('DIV');
    expect(titleElement).toHaveAttribute('data-slot', 'alert-title');
  });

  it('applies correct CSS classes', () => {
    render(<AlertTitle>Styled Title</AlertTitle>);
    
    const titleElement = screen.getByText('Styled Title');
    expect(titleElement).toHaveClass(
      'col-start-2',
      'line-clamp-1',
      'min-h-4',
      'font-medium',
      'tracking-tight'
    );
  });

  it('applies custom className', () => {
    render(<AlertTitle className="custom-title">Custom Title</AlertTitle>);
    
    const titleElement = screen.getByText('Custom Title');
    expect(titleElement).toHaveClass('custom-title');
  });

  it('forwards div props correctly', () => {
    render(
      <AlertTitle 
        id="title-id"
        data-testid="title-test"
        onClick={() => {}}
      >
        Props Title
      </AlertTitle>
    );
    
    const titleElement = screen.getByText('Props Title');
    expect(titleElement).toHaveAttribute('id', 'title-id');
    expect(titleElement).toHaveAttribute('data-testid', 'title-test');
  });

  it('handles empty content', () => {
    render(<AlertTitle />);
    
    const titleElement = screen.getByTestId('alert-title');
    expect(titleElement).toBeEmptyDOMElement();
  });

  it('handles complex content structure', () => {
    render(
      <AlertTitle>
        <span>Complex</span>
        <strong>Title</strong>
        <em>Content</em>
      </AlertTitle>
    );
    
    expect(screen.getByText('Complex')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('AlertDescription Component', () => {
  it('renders with correct element and data-slot', () => {
    render(<AlertDescription>Test Description</AlertDescription>);
    
    const descElement = screen.getByText('Test Description');
    expect(descElement.tagName).toBe('DIV');
    expect(descElement).toHaveAttribute('data-slot', 'alert-description');
  });

  it('applies correct CSS classes', () => {
    render(<AlertDescription>Styled Description</AlertDescription>);
    
    const descElement = screen.getByText('Styled Description');
    expect(descElement).toHaveClass(
      'text-muted-foreground',
      'col-start-2',
      'grid',
      'justify-items-start',
      'gap-1',
      'text-sm'
    );
  });

  it('applies custom className', () => {
    render(<AlertDescription className="custom-desc">Custom Description</AlertDescription>);
    
    const descElement = screen.getByText('Custom Description');
    expect(descElement).toHaveClass('custom-desc');
  });

  it('forwards div props correctly', () => {
    render(
      <AlertDescription 
        id="desc-id"
        data-testid="desc-test"
        onClick={() => {}}
      >
        Props Description
      </AlertDescription>
    );
    
    const descElement = screen.getByText('Props Description');
    expect(descElement).toHaveAttribute('id', 'desc-id');
    expect(descElement).toHaveAttribute('data-testid', 'desc-test');
  });

  it('handles paragraph content with proper styling', () => {
    render(
      <AlertDescription>
        <p>First paragraph</p>
        <p>Second paragraph</p>
      </AlertDescription>
    );
    
    expect(screen.getByText('First paragraph')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph')).toBeInTheDocument();
  });

  it('handles multiline text content', () => {
    render(
      <AlertDescription>
        Line 1{'\n'}
        Line 2{'\n'}
        Line 3
      </AlertDescription>
    );
    
    expect(screen.getByText(/Line 1.*Line 2.*Line 3/s)).toBeInTheDocument();
  });

  it('handles empty content', () => {
    render(<AlertDescription />);
    
    const descElement = screen.getByTestId('alert-description');
    expect(descElement).toBeEmptyDOMElement();
  });
});

describe('Alert Component Integration', () => {
  it('works with all components together', () => {
    render(
      <Alert variant="destructive">
        <svg data-testid="warning-icon" />
        <AlertTitle>Warning Alert</AlertTitle>
        <AlertDescription>
          <p>This is a warning message with multiple paragraphs.</p>
          <p>Please take appropriate action.</p>
        </AlertDescription>
      </Alert>
    );
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    expect(screen.getByText('Warning Alert')).toBeInTheDocument();
    expect(screen.getByText('This is a warning message with multiple paragraphs.')).toBeInTheDocument();
    expect(screen.getByText('Please take appropriate action.')).toBeInTheDocument();
  });

  it('maintains proper semantic structure', () => {
    render(
      <Alert>
        <AlertTitle>Semantic Alert</AlertTitle>
        <AlertDescription>Proper semantic structure</AlertDescription>
      </Alert>
    );
    
    const alertElement = screen.getByRole('alert');
    const titleElement = screen.getByText('Semantic Alert');
    const descElement = screen.getByText('Proper semantic structure');
    
    expect(alertElement).toContainElement(titleElement);
    expect(alertElement).toContainElement(descElement);
  });
});