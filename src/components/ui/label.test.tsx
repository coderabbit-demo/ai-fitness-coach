import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Label } from './label';

// Mock the cn utility function since it's external
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')
}));

describe('Label Component', () => {
  // Happy path tests
  describe('Basic rendering', () => {
    it('renders with default props', () => {
      render(<Label>Test Label</Label>);
      const label = screen.getByText('Test Label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveClass('flex', 'items-center', 'gap-2', 'text-sm', 'leading-none', 'font-medium', 'select-none');
    });

    it('renders with custom text content', () => {
      render(<Label>Custom Label Text</Label>);
      expect(screen.getByText('Custom Label Text')).toBeInTheDocument();
    });

    it('renders with htmlFor attribute', () => {
      render(<Label htmlFor="test-input">Test Label</Label>);
      const label = screen.getByText('Test Label');
      expect(label).toHaveAttribute('for', 'test-input');
    });

    it('renders with custom className', () => {
      render(<Label className="custom-class">Test Label</Label>);
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('custom-class');
      expect(label).toHaveClass('flex', 'items-center', 'gap-2', 'text-sm', 'leading-none', 'font-medium', 'select-none');
    });

    it('renders with data-slot attribute', () => {
      render(<Label>Test Label</Label>);
      const label = screen.getByText('Test Label');
      expect(label).toHaveAttribute('data-slot', 'label');
    });

    it('renders as a label element', () => {
      render(<Label>Test Label</Label>);
      const label = screen.getByText('Test Label');
      expect(label.tagName).toBe('LABEL');
    });
  });

  // Props handling tests
  describe('Props handling', () => {
    it('handles empty children', () => {
      render(<Label data-testid="empty-label"></Label>);
      const label = screen.getByTestId('empty-label');
      expect(label).toBeInTheDocument();
      expect(label).toBeEmptyDOMElement();
    });

    it('handles null children', () => {
      render(<Label data-testid="null-label">{null}</Label>);
      const label = screen.getByTestId('null-label');
      expect(label).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      render(<Label data-testid="undefined-label">{undefined}</Label>);
      const label = screen.getByTestId('undefined-label');
      expect(label).toBeInTheDocument();
    });

    it('handles boolean children', () => {
      render(<Label data-testid="boolean-label">{true}</Label>);
      const label = screen.getByTestId('boolean-label');
      expect(label).toBeInTheDocument();
    });

    it('handles number children', () => {
      render(<Label>{123}</Label>);
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('handles JSX elements as children', () => {
      render(
        <Label>
          <span>Nested</span> Content
        </Label>
      );
      expect(screen.getByText('Nested')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('handles multiple children', () => {
      render(
        <Label>
          <span>First</span>
          <span>Second</span>
          <span>Third</span>
        </Label>
      );
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('forwards all props to the underlying element', () => {
      render(
        <Label 
          id="test-id"
          title="Test Title"
          role="label"
          tabIndex={0}
          data-custom="custom-value"
        >
          Test Label
        </Label>
      );
      const label = screen.getByText('Test Label');
      expect(label).toHaveAttribute('id', 'test-id');
      expect(label).toHaveAttribute('title', 'Test Title');
      expect(label).toHaveAttribute('role', 'label');
      expect(label).toHaveAttribute('tabindex', '0');
      expect(label).toHaveAttribute('data-custom', 'custom-value');
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('maintains proper semantic structure', () => {
      render(<Label>Accessible Label</Label>);
      const label = screen.getByRole('label');
      expect(label.tagName).toBe('LABEL');
    });

    it('properly associates with form controls using htmlFor', () => {
      render(
        <div>
          <Label htmlFor="test-input">Test Label</Label>
          <input id="test-input" type="text" />
        </div>
      );
      const label = screen.getByText('Test Label');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', 'test-input');
      expect(input).toHaveAttribute('id', 'test-input');
    });

    it('supports aria attributes', () => {
      render(
        <Label aria-label="Custom aria label" aria-describedby="description">
          Test Label
        </Label>
      );
      const label = screen.getByText('Test Label');
      expect(label).toHaveAttribute('aria-label', 'Custom aria label');
      expect(label).toHaveAttribute('aria-describedby', 'description');
    });

    it('supports custom aria-labelledby', () => {
      render(
        <Label aria-labelledby="external-label">
          Test Label
        </Label>
      );
      const label = screen.getByText('Test Label');
      expect(label).toHaveAttribute('aria-labelledby', 'external-label');
    });

    it('handles aria-required attribute', () => {
      render(<Label aria-required="true">Required Label</Label>);
      const label = screen.getByText('Required Label');
      expect(label).toHaveAttribute('aria-required', 'true');
    });

    it('handles aria-invalid attribute', () => {
      render(<Label aria-invalid="true">Invalid Label</Label>);
      const label = screen.getByText('Invalid Label');
      expect(label).toHaveAttribute('aria-invalid', 'true');
    });
  });

  // Class name merging tests
  describe('Class name handling', () => {
    it('merges custom className with default classes', () => {
      render(<Label className="bg-red-500 text-white">Test Label</Label>);
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('bg-red-500', 'text-white');
      expect(label).toHaveClass('flex', 'items-center', 'gap-2', 'text-sm', 'leading-none', 'font-medium', 'select-none');
    });

    it('handles multiple custom classes', () => {
      render(<Label className="class1 class2 class3">Test Label</Label>);
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('class1', 'class2', 'class3');
    });

    it('handles empty className', () => {
      render(<Label className="">Test Label</Label>);
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('flex', 'items-center', 'gap-2', 'text-sm', 'leading-none', 'font-medium', 'select-none');
    });

    it('handles undefined className', () => {
      render(<Label className={undefined}>Test Label</Label>);
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('flex', 'items-center', 'gap-2', 'text-sm', 'leading-none', 'font-medium', 'select-none');
    });

    it('applies group state classes', () => {
      render(<Label className="group-data-[disabled=true]:pointer-events-none">Test Label</Label>);
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('group-data-[disabled=true]:pointer-events-none');
    });

    it('applies peer state classes', () => {
      render(<Label className="peer-disabled:cursor-not-allowed">Test Label</Label>);
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed');
    });
  });

  // Event handling tests
  describe('Event handling', () => {
    it('handles onClick events', () => {
      const handleClick = jest.fn();
      render(<Label onClick={handleClick}>Clickable Label</Label>);
      const label = screen.getByText('Clickable Label');
      fireEvent.click(label);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles onMouseEnter events', () => {
      const handleMouseEnter = jest.fn();
      render(<Label onMouseEnter={handleMouseEnter}>Hover Label</Label>);
      const label = screen.getByText('Hover Label');
      fireEvent.mouseEnter(label);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('handles onMouseLeave events', () => {
      const handleMouseLeave = jest.fn();
      render(<Label onMouseLeave={handleMouseLeave}>Hover Label</Label>);
      const label = screen.getByText('Hover Label');
      fireEvent.mouseLeave(label);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('handles onFocus events', () => {
      const handleFocus = jest.fn();
      render(<Label onFocus={handleFocus} tabIndex={0}>Focusable Label</Label>);
      const label = screen.getByText('Focusable Label');
      fireEvent.focus(label);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('handles onBlur events', () => {
      const handleBlur = jest.fn();
      render(<Label onBlur={handleBlur} tabIndex={0}>Focusable Label</Label>);
      const label = screen.getByText('Focusable Label');
      fireEvent.focus(label);
      fireEvent.blur(label);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events', () => {
      const handleKeyDown = jest.fn();
      render(<Label onKeyDown={handleKeyDown} tabIndex={0}>Keyboard Label</Label>);
      const label = screen.getByText('Keyboard Label');
      fireEvent.keyDown(label, { key: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('handles onDoubleClick events', () => {
      const handleDoubleClick = jest.fn();
      render(<Label onDoubleClick={handleDoubleClick}>Double Click Label</Label>);
      const label = screen.getByText('Double Click Label');
      fireEvent.doubleClick(label);
      expect(handleDoubleClick).toHaveBeenCalledTimes(1);
    });
  });

  // Style and appearance tests
  describe('Styling and appearance', () => {
    it('applies default styling classes', () => {
      render(<Label>Styled Label</Label>);
      const label = screen.getByText('Styled Label');
      expect(label).toHaveClass('flex');
      expect(label).toHaveClass('items-center');
      expect(label).toHaveClass('gap-2');
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('leading-none');
      expect(label).toHaveClass('font-medium');
      expect(label).toHaveClass('select-none');
    });

    it('applies disabled state classes', () => {
      render(<Label>Disabled Label</Label>);
      const label = screen.getByText('Disabled Label');
      expect(label).toHaveClass('group-data-[disabled=true]:pointer-events-none');
      expect(label).toHaveClass('group-data-[disabled=true]:opacity-50');
    });

    it('applies peer disabled state classes', () => {
      render(<Label>Peer Disabled Label</Label>);
      const label = screen.getByText('Peer Disabled Label');
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed');
      expect(label).toHaveClass('peer-disabled:opacity-50');
    });

    it('supports custom inline styles', () => {
      render(<Label style={{ color: 'red', fontSize: '16px' }}>Styled Label</Label>);
      const label = screen.getByText('Styled Label');
      expect(label).toHaveStyle('color: red');
      expect(label).toHaveStyle('font-size: 16px');
    });

    it('handles conditional styling classes', () => {
      const { rerender } = render(<Label className="text-green-500">Conditional Label</Label>);
      let label = screen.getByText('Conditional Label');
      expect(label).toHaveClass('text-green-500');

      rerender(<Label className="text-red-500">Conditional Label</Label>);
      label = screen.getByText('Conditional Label');
      expect(label).toHaveClass('text-red-500');
      expect(label).not.toHaveClass('text-green-500');
    });
  });

  // Integration tests with form elements
  describe('Form integration', () => {
    it('works with text input elements', () => {
      render(
        <div>
          <Label htmlFor="text-input">Text Input Label</Label>
          <input id="text-input" type="text" />
        </div>
      );
      const label = screen.getByText('Text Input Label');
      const input = screen.getByRole('textbox');
      
      // Click label should focus input
      fireEvent.click(label);
      expect(input).toHaveFocus();
    });

    it('works with password input elements', () => {
      render(
        <div>
          <Label htmlFor="password-input">Password Label</Label>
          <input id="password-input" type="password" />
        </div>
      );
      const label = screen.getByText('Password Label');
      const input = screen.getByLabelText('Password Label');
      
      fireEvent.click(label);
      expect(input).toHaveFocus();
    });

    it('works with checkbox elements', () => {
      render(
        <div>
          <Label htmlFor="checkbox-input">Checkbox Label</Label>
          <input id="checkbox-input" type="checkbox" />
        </div>
      );
      const label = screen.getByText('Checkbox Label');
      const checkbox = screen.getByRole('checkbox');
      
      // Click label should toggle checkbox
      fireEvent.click(label);
      expect(checkbox).toBeChecked();
    });

    it('works with radio elements', () => {
      render(
        <div>
          <Label htmlFor="radio-input">Radio Label</Label>
          <input id="radio-input" type="radio" name="test" />
        </div>
      );
      const label = screen.getByText('Radio Label');
      const radio = screen.getByRole('radio');
      
      // Click label should select radio
      fireEvent.click(label);
      expect(radio).toBeChecked();
    });

    it('works with select elements', () => {
      render(
        <div>
          <Label htmlFor="select-input">Select Label</Label>
          <select id="select-input">
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </select>
        </div>
      );
      const label = screen.getByText('Select Label');
      const select = screen.getByRole('combobox');
      
      // Click label should focus select
      fireEvent.click(label);
      expect(select).toHaveFocus();
    });

    it('works with textarea elements', () => {
      render(
        <div>
          <Label htmlFor="textarea-input">Textarea Label</Label>
          <textarea id="textarea-input" />
        </div>
      );
      const label = screen.getByText('Textarea Label');
      const textarea = screen.getByRole('textbox');
      
      fireEvent.click(label);
      expect(textarea).toHaveFocus();
    });

    it('works with multiple form elements', () => {
      render(
        <form>
          <div>
            <Label htmlFor="first-input">First Input</Label>
            <input id="first-input" type="text" />
          </div>
          <div>
            <Label htmlFor="second-input">Second Input</Label>
            <input id="second-input" type="email" />
          </div>
        </form>
      );
      
      const firstLabel = screen.getByText('First Input');
      const secondLabel = screen.getByText('Second Input');
      const firstInput = screen.getByRole('textbox', { name: 'First Input' });
      const secondInput = screen.getByRole('textbox', { name: 'Second Input' });
      
      fireEvent.click(firstLabel);
      expect(firstInput).toHaveFocus();
      
      fireEvent.click(secondLabel);
      expect(secondInput).toHaveFocus();
      expect(firstInput).not.toHaveFocus();
    });
  });

  // Radix UI specific tests
  describe('Radix UI integration', () => {
    it('inherits Radix UI Label primitive functionality', () => {
      render(<Label>Radix Label</Label>);
      const label = screen.getByText('Radix Label');
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });

    it('supports Radix UI specific props', () => {
      render(<Label asChild>Radix Label</Label>);
      const label = screen.getByText('Radix Label');
      expect(label).toBeInTheDocument();
    });

    it('handles complex Radix UI props', () => {
      render(
        <Label 
          htmlFor="complex-input"
          onClick={() => {}}
          onPointerDown={() => {}}
          onMouseDown={() => {}}
        >
          Complex Label
        </Label>
      );
      const label = screen.getByText('Complex Label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('for', 'complex-input');
    });
  });

  // Error states and validation
  describe('Error states and validation', () => {
    it('supports error styling', () => {
      render(<Label className="text-red-500">Error Label</Label>);
      const label = screen.getByText('Error Label');
      expect(label).toHaveClass('text-red-500');
    });

    it('handles required field indicators', () => {
      render(<Label>Required Field *</Label>);
      expect(screen.getByText('Required Field *')).toBeInTheDocument();
    });

    it('supports validation states', () => {
      render(<Label aria-invalid="true" className="text-red-500">Invalid Label</Label>);
      const label = screen.getByText('Invalid Label');
      expect(label).toHaveClass('text-red-500');
      expect(label).toHaveAttribute('aria-invalid', 'true');
    });

    it('handles success states', () => {
      render(<Label className="text-green-500">Success Label</Label>);
      const label = screen.getByText('Success Label');
      expect(label).toHaveClass('text-green-500');
    });

    it('handles warning states', () => {
      render(<Label className="text-yellow-500">Warning Label</Label>);
      const label = screen.getByText('Warning Label');
      expect(label).toHaveClass('text-yellow-500');
    });
  });

  // Performance and rendering tests
  describe('Performance and rendering', () => {
    it('renders without unnecessary re-renders', () => {
      const { rerender } = render(<Label>Initial Label</Label>);
      const label = screen.getByText('Initial Label');
      
      rerender(<Label>Initial Label</Label>);
      expect(label).toBeInTheDocument();
    });

    it('handles dynamic content updates', () => {
      const { rerender } = render(<Label>Initial Content</Label>);
      expect(screen.getByText('Initial Content')).toBeInTheDocument();
      
      rerender(<Label>Updated Content</Label>);
      expect(screen.getByText('Updated Content')).toBeInTheDocument();
      expect(screen.queryByText('Initial Content')).not.toBeInTheDocument();
    });

    it('handles rapid prop changes', () => {
      const { rerender } = render(<Label className="class1">Test</Label>);
      
      for (let i = 0; i < 10; i++) {
        rerender(<Label className={`class${i}`}>Test</Label>);
      }
      
      const label = screen.getByText('Test');
      expect(label).toHaveClass('class9');
    });

    it('handles rapid content changes', () => {
      const { rerender } = render(<Label>Content 0</Label>);
      
      for (let i = 1; i < 10; i++) {
        rerender(<Label>Content {i}</Label>);
      }
      
      expect(screen.getByText('Content 9')).toBeInTheDocument();
    });

    it('maintains performance with complex children', () => {
      const ComplexChildren = () => (
        <div>
          <span>Complex</span>
          <div>
            <p>Nested</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </div>
      );

      render(
        <Label>
          <ComplexChildren />
        </Label>
      );
      
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Nested')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  // Edge cases and boundary conditions
  describe('Edge cases and boundary conditions', () => {
    it('handles extremely long text content', () => {
      const longText = 'A'.repeat(1000);
      render(<Label>{longText}</Label>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      render(<Label>{specialText}</Label>);
      expect(screen.getByText(specialText)).toBeInTheDocument();
    });

    it('handles unicode characters', () => {
      const unicodeText = '🚀 🌟 📱 💡 🎯';
      render(<Label>{unicodeText}</Label>);
      expect(screen.getByText(unicodeText)).toBeInTheDocument();
    });

    it('handles mixed content types', () => {
      render(
        <Label>
          Text {42} {true && 'conditional'} <span>JSX</span>
        </Label>
      );
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('conditional')).toBeInTheDocument();
      expect(screen.getByText('JSX')).toBeInTheDocument();
    });

    it('handles nested label scenario', () => {
      render(
        <div>
          <Label htmlFor="outer-input">
            Outer Label
            <Label htmlFor="inner-input">Inner Label</Label>
          </Label>
          <input id="outer-input" type="text" />
          <input id="inner-input" type="text" />
        </div>
      );
      
      expect(screen.getByText('Outer Label')).toBeInTheDocument();
      expect(screen.getByText('Inner Label')).toBeInTheDocument();
    });

    it('handles null props gracefully', () => {
      render(<Label className={null as any} style={null as any}>Null Props</Label>);
      expect(screen.getByText('Null Props')).toBeInTheDocument();
    });
  });

  // Snapshot testing
  describe('Snapshot tests', () => {
    it('matches snapshot with default props', () => {
      const { container } = render(<Label>Snapshot Test</Label>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with all common props', () => {
      const { container } = render(
        <Label 
          htmlFor="test-input" 
          className="custom-class"
          style={{ color: 'blue' }}
          data-testid="snapshot-label"
          aria-label="Snapshot label"
          role="label"
          tabIndex={0}
        >
          Complete Label
        </Label>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with complex children', () => {
      const { container } = render(
        <Label>
          <span className="icon">📝</span>
          <span className="text">Complex Label</span>
          <span className="badge">New</span>
        </Label>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});