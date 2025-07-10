import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Label } from './label'

// Mock the cn utility function
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')
}))

describe('Label Component', () => {
  // Happy path tests
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Label>Test Label</Label>)
      const label = screen.getByText('Test Label')
      expect(label).toBeInTheDocument()
      expect(label.tagName).toBe('LABEL')
    })

    it('renders with custom text content', () => {
      render(<Label>Custom Label Text</Label>)
      expect(screen.getByText('Custom Label Text')).toBeInTheDocument()
    })

    it('renders with JSX children', () => {
      render(
        <Label>
          <span>Nested</span> Content
        </Label>
      )
      expect(screen.getByText('Nested')).toBeInTheDocument()
      expect(screen.getByText(/Content/)).toBeInTheDocument()
    })

    it('applies data-slot attribute', () => {
      render(<Label data-testid="label">Test Label</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveAttribute('data-slot', 'label')
    })
  })

  // Accessibility tests
  describe('Accessibility', () => {
    it('associates with form control using htmlFor prop', () => {
      render(
        <div>
          <Label htmlFor="test-input">Test Label</Label>
          <input id="test-input" type="text" />
        </div>
      )
      const label = screen.getByText('Test Label')
      expect(label).toHaveAttribute('for', 'test-input')
    })

    it('supports aria-label attribute', () => {
      render(<Label aria-label="Accessible label">Visible text</Label>)
      const label = screen.getByText('Visible text')
      expect(label).toHaveAttribute('aria-label', 'Accessible label')
    })

    it('supports aria-describedby attribute', () => {
      render(<Label aria-describedby="description">Label text</Label>)
      const label = screen.getByText('Label text')
      expect(label).toHaveAttribute('aria-describedby', 'description')
    })

    it('supports aria-required attribute', () => {
      render(<Label aria-required="true">Required field</Label>)
      const label = screen.getByText('Required field')
      expect(label).toHaveAttribute('aria-required', 'true')
    })

    it('is accessible via keyboard navigation', () => {
      render(<Label tabIndex={0}>Focusable Label</Label>)
      const label = screen.getByText('Focusable Label')
      label.focus()
      expect(label).toHaveFocus()
    })
  })

  // CSS classes and styling tests
  describe('CSS Classes and Styling', () => {
    it('applies default CSS classes', () => {
      render(<Label>Default Label</Label>)
      const label = screen.getByText('Default Label')
      expect(label).toHaveClass(
        'flex',
        'items-center',
        'gap-2',
        'text-sm',
        'leading-none',
        'font-medium',
        'select-none'
      )
    })

    it('applies custom className', () => {
      render(<Label className="custom-class">Custom Label</Label>)
      const label = screen.getByText('Custom Label')
      expect(label).toHaveClass('custom-class')
    })

    it('merges custom className with default classes', () => {
      render(<Label className="custom-class">Merged Label</Label>)
      const label = screen.getByText('Merged Label')
      expect(label).toHaveClass(
        'flex',
        'items-center',
        'gap-2',
        'text-sm',
        'leading-none',
        'font-medium',
        'select-none',
        'custom-class'
      )
    })

    it('applies group disabled state classes', () => {
      render(<Label>Group Disabled Label</Label>)
      const label = screen.getByText('Group Disabled Label')
      expect(label).toHaveClass(
        'group-data-[disabled=true]:pointer-events-none',
        'group-data-[disabled=true]:opacity-50'
      )
    })

    it('applies peer disabled state classes', () => {
      render(<Label>Peer Disabled Label</Label>)
      const label = screen.getByText('Peer Disabled Label')
      expect(label).toHaveClass(
        'peer-disabled:cursor-not-allowed',
        'peer-disabled:opacity-50'
      )
    })
  })

  // Prop handling tests
  describe('Prop Handling', () => {
    it('forwards ref to the label element', () => {
      const ref = React.createRef<HTMLLabelElement>()
      render(<Label ref={ref}>Ref Label</Label>)
      expect(ref.current).toBeInstanceOf(HTMLLabelElement)
      expect(ref.current?.textContent).toBe('Ref Label')
    })

    it('spreads additional props to the label element', () => {
      render(
        <Label data-testid="custom-label" title="Custom title" id="label-id">
          Props Label
        </Label>
      )
      const label = screen.getByTestId('custom-label')
      expect(label).toHaveAttribute('title', 'Custom title')
      expect(label).toHaveAttribute('id', 'label-id')
    })

    it('handles onClick event', () => {
      const handleClick = jest.fn()
      render(<Label onClick={handleClick}>Clickable Label</Label>)
      const label = screen.getByText('Clickable Label')
      fireEvent.click(label)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('handles onMouseEnter and onMouseLeave events', () => {
      const handleMouseEnter = jest.fn()
      const handleMouseLeave = jest.fn()
      render(
        <Label onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          Hover Label
        </Label>
      )
      const label = screen.getByText('Hover Label')
      
      fireEvent.mouseEnter(label)
      expect(handleMouseEnter).toHaveBeenCalledTimes(1)
      
      fireEvent.mouseLeave(label)
      expect(handleMouseLeave).toHaveBeenCalledTimes(1)
    })

    it('handles onFocus and onBlur events', () => {
      const handleFocus = jest.fn()
      const handleBlur = jest.fn()
      render(
        <Label onFocus={handleFocus} onBlur={handleBlur} tabIndex={0}>
          Focus Label
        </Label>
      )
      const label = screen.getByText('Focus Label')
      
      fireEvent.focus(label)
      expect(handleFocus).toHaveBeenCalledTimes(1)
      
      fireEvent.blur(label)
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('handles keyboard events', () => {
      const handleKeyDown = jest.fn()
      render(<Label onKeyDown={handleKeyDown}>Keyboard Label</Label>)
      const label = screen.getByText('Keyboard Label')
      
      fireEvent.keyDown(label, { key: 'Enter' })
      expect(handleKeyDown).toHaveBeenCalledTimes(1)
    })
  })

  // Edge cases and error handling
  describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
      render(<Label></Label>)
      const label = screen.getByRole('label')
      expect(label).toBeInTheDocument()
      expect(label.textContent).toBe('')
    })

    it('handles null children', () => {
      render(<Label>{null}</Label>)
      const label = screen.getByRole('label')
      expect(label).toBeInTheDocument()
      expect(label.textContent).toBe('')
    })

    it('handles undefined children', () => {
      render(<Label>{undefined}</Label>)
      const label = screen.getByRole('label')
      expect(label).toBeInTheDocument()
      expect(label.textContent).toBe('')
    })

    it('handles boolean children', () => {
      render(<Label>{true}</Label>)
      const label = screen.getByRole('label')
      expect(label).toBeInTheDocument()
      expect(label.textContent).toBe('')
    })

    it('handles number children', () => {
      render(<Label>{42}</Label>)
      const label = screen.getByText('42')
      expect(label).toBeInTheDocument()
    })

    it('handles array of children', () => {
      render(<Label>{['First', ' ', 'Second']}</Label>)
      const label = screen.getByText('First Second')
      expect(label).toBeInTheDocument()
    })

    it('handles very long text content', () => {
      const longText = 'A'.repeat(1000)
      render(<Label>{longText}</Label>)
      const label = screen.getByText(longText)
      expect(label).toBeInTheDocument()
    })

    it('handles special characters in text', () => {
      const specialText = '!@#$%^&*()_+{}|:"<>?[];\'\\,./`~'
      render(<Label>{specialText}</Label>)
      const label = screen.getByText(specialText)
      expect(label).toBeInTheDocument()
    })

    it('handles Unicode characters', () => {
      const unicodeText = '🚀 Unicode 中文 العربية'
      render(<Label>{unicodeText}</Label>)
      const label = screen.getByText(unicodeText)
      expect(label).toBeInTheDocument()
    })

    it('handles empty string className', () => {
      render(<Label className="">Empty Class Label</Label>)
      const label = screen.getByText('Empty Class Label')
      expect(label).toBeInTheDocument()
    })

    it('handles undefined className', () => {
      render(<Label className={undefined}>Undefined Class Label</Label>)
      const label = screen.getByText('Undefined Class Label')
      expect(label).toBeInTheDocument()
    })
  })

  // Integration with form elements
  describe('Form Integration', () => {
    it('works with input elements', () => {
      render(
        <div>
          <Label htmlFor="text-input">Text Input</Label>
          <input id="text-input" type="text" />
        </div>
      )
      const label = screen.getByText('Text Input')
      const input = screen.getByRole('textbox')
      
      fireEvent.click(label)
      expect(input).toHaveFocus()
    })

    it('works with checkbox elements', () => {
      render(
        <div>
          <Label htmlFor="checkbox-input">Checkbox</Label>
          <input id="checkbox-input" type="checkbox" />
        </div>
      )
      const label = screen.getByText('Checkbox')
      const checkbox = screen.getByRole('checkbox')
      
      fireEvent.click(label)
      expect(checkbox).toBeChecked()
    })

    it('works with radio buttons', () => {
      render(
        <div>
          <Label htmlFor="radio-input">Radio Option</Label>
          <input id="radio-input" type="radio" name="test" />
        </div>
      )
      const label = screen.getByText('Radio Option')
      const radio = screen.getByRole('radio')
      
      fireEvent.click(label)
      expect(radio).toBeChecked()
    })

    it('works with select elements', () => {
      render(
        <div>
          <Label htmlFor="select-input">Select Option</Label>
          <select id="select-input">
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </select>
        </div>
      )
      const label = screen.getByText('Select Option')
      const select = screen.getByRole('combobox')
      
      fireEvent.click(label)
      expect(select).toHaveFocus()
    })

    it('works with textarea elements', () => {
      render(
        <div>
          <Label htmlFor="textarea-input">Textarea</Label>
          <textarea id="textarea-input" />
        </div>
      )
      const label = screen.getByText('Textarea')
      const textarea = screen.getByRole('textbox')
      
      fireEvent.click(label)
      expect(textarea).toHaveFocus()
    })

    it('works with multiple form elements', () => {
      render(
        <form>
          <div>
            <Label htmlFor="input1">Input 1</Label>
            <input id="input1" type="text" />
          </div>
          <div>
            <Label htmlFor="input2">Input 2</Label>
            <input id="input2" type="email" />
          </div>
        </form>
      )
      
      const label1 = screen.getByText('Input 1')
      const label2 = screen.getByText('Input 2')
      const input1 = screen.getByRole('textbox', { name: 'Input 1' })
      const input2 = screen.getByRole('textbox', { name: 'Input 2' })
      
      fireEvent.click(label1)
      expect(input1).toHaveFocus()
      
      fireEvent.click(label2)
      expect(input2).toHaveFocus()
    })
  })

  // Performance and rendering tests
  describe('Performance and Rendering', () => {
    it('renders consistently with same props', () => {
      const { rerender } = render(<Label className="test">Test Label</Label>)
      const firstRender = screen.getByText('Test Label')
      
      rerender(<Label className="test">Test Label</Label>)
      const secondRender = screen.getByText('Test Label')
      
      expect(firstRender).toBe(secondRender)
    })

    it('re-renders when props change', () => {
      const { rerender } = render(<Label>Original Text</Label>)
      expect(screen.getByText('Original Text')).toBeInTheDocument()
      
      rerender(<Label>Updated Text</Label>)
      expect(screen.getByText('Updated Text')).toBeInTheDocument()
      expect(screen.queryByText('Original Text')).not.toBeInTheDocument()
    })

    it('handles rapid prop changes', () => {
      const { rerender } = render(<Label>Text 1</Label>)
      
      for (let i = 2; i <= 10; i++) {
        rerender(<Label>Text {i}</Label>)
      }
      
      expect(screen.getByText('Text 10')).toBeInTheDocument()
    })

    it('maintains stable reference when props don\'t change', () => {
      const { rerender } = render(<Label>Stable Label</Label>)
      const firstElement = screen.getByText('Stable Label')
      
      rerender(<Label>Stable Label</Label>)
      const secondElement = screen.getByText('Stable Label')
      
      expect(firstElement).toBe(secondElement)
    })
  })

  // Advanced interaction tests
  describe('Advanced Interactions', () => {
    it('handles complex nested content', () => {
      render(
        <Label>
          <span>Complex</span>
          <strong>Nested</strong>
          <em>Content</em>
          <div>
            <span>Deep</span>
            <span>Nesting</span>
          </div>
        </Label>
      )
      
      expect(screen.getByText('Complex')).toBeInTheDocument()
      expect(screen.getByText('Nested')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
      expect(screen.getByText('Deep')).toBeInTheDocument()
      expect(screen.getByText('Nesting')).toBeInTheDocument()
    })

    it('handles conditional rendering', () => {
      const { rerender } = render(
        <Label>
          {true && <span>Conditional</span>}
          {false && <span>Hidden</span>}
        </Label>
      )
      
      expect(screen.getByText('Conditional')).toBeInTheDocument()
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
      
      rerender(
        <Label>
          {false && <span>Conditional</span>}
          {true && <span>Hidden</span>}
        </Label>
      )
      
      expect(screen.queryByText('Conditional')).not.toBeInTheDocument()
      expect(screen.getByText('Hidden')).toBeInTheDocument()
    })

    it('handles dynamic content updates', () => {
      const { rerender } = render(<Label>Count: 0</Label>)
      
      for (let i = 1; i <= 5; i++) {
        rerender(<Label>Count: {i}</Label>)
        expect(screen.getByText(`Count: ${i}`)).toBeInTheDocument()
      }
    })
  })

  // Error boundary and edge case tests
  describe('Error Handling', () => {
    it('handles component errors gracefully', () => {
      const ErrorComponent = ({ shouldError }: { shouldError: boolean }) => {
        if (shouldError) {
          throw new Error('Test error')
        }
        return <span>No error</span>
      }

      // Test without error
      render(
        <Label>
          <ErrorComponent shouldError={false} />
        </Label>
      )
      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('handles invalid HTML attributes gracefully', () => {
      const invalidProps = {
        'data-invalid-attr': 'value',
        'aria-invalid-attr': 'value'
      }
      
      render(<Label {...invalidProps}>Invalid Props Label</Label>)
      const label = screen.getByText('Invalid Props Label')
      expect(label).toBeInTheDocument()
    })
  })

  // Snapshot testing
  describe('Snapshot Tests', () => {
    it('matches snapshot with default props', () => {
      const { container } = render(<Label>Snapshot Label</Label>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with custom props', () => {
      const { container } = render(
        <Label className="custom-class" htmlFor="test" id="snapshot-label">
          Custom Snapshot Label
        </Label>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with complex children', () => {
      const { container } = render(
        <Label>
          <span>Complex</span>
          <strong>Children</strong>
          <em>Structure</em>
        </Label>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with accessibility attributes', () => {
      const { container } = render(
        <Label 
          aria-label="Accessible label"
          aria-describedby="description"
          aria-required="true"
        >
          Accessible Label
        </Label>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})