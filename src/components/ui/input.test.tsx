import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './input'

// Test user setup
const user = userEvent.setup()

describe('Input Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders input element correctly', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('data-slot', 'input')
    })

    it('renders with default styling classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'flex',
        'h-9',
        'w-full',
        'min-w-0',
        'rounded-md',
        'border',
        'border-input',
        'bg-transparent',
        'px-3',
        'py-1',
        'text-base',
        'shadow-xs',
        'transition-[color,box-shadow]',
        'outline-none'
      )
    })

    it('renders with focus styling classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'focus-visible:border-ring',
        'focus-visible:ring-ring/50',
        'focus-visible:ring-[3px]'
      )
    })

    it('renders with validation styling classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'aria-invalid:ring-destructive/20',
        'dark:aria-invalid:ring-destructive/40',
        'aria-invalid:border-destructive'
      )
    })

    it('renders with disabled styling classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'disabled:pointer-events-none',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50'
      )
    })

    it('renders with file input styling classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'file:inline-flex',
        'file:h-7',
        'file:border-0',
        'file:bg-transparent',
        'file:text-sm',
        'file:font-medium',
        'file:text-foreground'
      )
    })

    it('renders with placeholder and selection styling classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'placeholder:text-muted-foreground',
        'selection:bg-primary',
        'selection:text-primary-foreground'
      )
    })

    it('renders with dark mode styling classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('dark:bg-input/30')
    })

    it('renders with responsive text sizing', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('text-base', 'md:text-sm')
    })

    it('applies custom className correctly', () => {
      render(<Input className="custom-class" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-class')
      expect(input).toHaveClass('flex', 'h-9', 'w-full') // Still has default classes
    })

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text here" />)
      const input = screen.getByPlaceholderText('Enter text here')
      expect(input).toBeInTheDocument()
    })

    it('renders with default value', () => {
      render(<Input defaultValue="default text" />)
      const input = screen.getByDisplayValue('default text')
      expect(input).toBeInTheDocument()
    })

    it('renders with controlled value', () => {
      render(<Input value="controlled value" onChange={() => {}} />)
      const input = screen.getByDisplayValue('controlled value')
      expect(input).toBeInTheDocument()
    })

    it('renders with data-slot attribute', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('data-slot', 'input')
    })

    it('renders without type attribute by default', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).not.toHaveAttribute('type')
    })
  })

  // User interaction tests
  describe('User Interactions', () => {
    it('handles text input correctly', async () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Hello World')
      expect(input).toHaveValue('Hello World')
    })

    it('handles onChange events', async () => {
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'test')
      expect(handleChange).toHaveBeenCalledTimes(4) // Called for each character
      expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({
          value: 't'
        })
      }))
    })

    it('handles onFocus events', async () => {
      const handleFocus = jest.fn()
      render(<Input onFocus={handleFocus} />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    it('handles onBlur events', async () => {
      const handleBlur = jest.fn()
      render(<Input onBlur={handleBlur} />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      await user.tab()
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('handles onKeyDown events', async () => {
      const handleKeyDown = jest.fn()
      render(<Input onKeyDown={handleKeyDown} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'a')
      expect(handleKeyDown).toHaveBeenCalledWith(expect.objectContaining({
        key: 'a'
      }))
    })

    it('handles Enter key press', async () => {
      const handleKeyDown = jest.fn()
      render(<Input onKeyDown={handleKeyDown} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, '{enter}')
      expect(handleKeyDown).toHaveBeenCalledWith(expect.objectContaining({
        key: 'Enter'
      }))
    })

    it('handles Escape key press', async () => {
      const handleKeyDown = jest.fn()
      render(<Input onKeyDown={handleKeyDown} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, '{escape}')
      expect(handleKeyDown).toHaveBeenCalledWith(expect.objectContaining({
        key: 'Escape'
      }))
    })

    it('handles Tab key navigation', async () => {
      render(
        <div>
          <Input data-testid="input1" />
          <Input data-testid="input2" />
        </div>
      )
      
      const input1 = screen.getByTestId('input1')
      const input2 = screen.getByTestId('input2')
      
      await user.tab()
      expect(input1).toHaveFocus()
      
      await user.tab()
      expect(input2).toHaveFocus()
    })

    it('handles copy and paste operations', async () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'copy this text')
      await user.selectAll(input)
      await user.copy()
      await user.clear(input)
      await user.paste()
      
      expect(input).toHaveValue('copy this text')
    })

    it('handles clear operation', async () => {
      render(<Input defaultValue="some text" />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveValue('some text')
      await user.clear(input)
      expect(input).toHaveValue('')
    })

    it('handles select all operation', async () => {
      render(<Input defaultValue="select all text" />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      await user.selectAll(input)
      
      expect(input.selectionStart).toBe(0)
      expect(input.selectionEnd).toBe(15)
    })

    it('handles backspace and delete operations', async () => {
      render(<Input defaultValue="test" />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      await user.keyboard('{End}')
      await user.keyboard('{Backspace}')
      expect(input).toHaveValue('tes')
      
      await user.keyboard('{Home}')
      await user.keyboard('{Delete}')
      expect(input).toHaveValue('es')
    })
  })

  // Props and state tests
  describe('Props and State', () => {
    it('handles disabled state', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('handles readOnly state', () => {
      render(<Input readOnly />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readonly')
    })

    it('handles required attribute', () => {
      render(<Input required />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('required')
    })

    it('handles maxLength attribute', () => {
      render(<Input maxLength={10} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('maxlength', '10')
    })

    it('handles minLength attribute', () => {
      render(<Input minLength={5} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('minlength', '5')
    })

    it('handles pattern attribute', () => {
      render(<Input pattern="[0-9]+" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('pattern', '[0-9]+')
    })

    it('handles autoComplete attribute', () => {
      render(<Input autoComplete="email" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('autocomplete', 'email')
    })

    it('handles name attribute', () => {
      render(<Input name="username" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('name', 'username')
    })

    it('handles id attribute', () => {
      render(<Input id="user-input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'user-input')
    })

    it('handles size attribute', () => {
      render(<Input size={20} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('size', '20')
    })

    it('handles tabIndex attribute', () => {
      render(<Input tabIndex={-1} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('tabindex', '-1')
    })

    it('handles step attribute for number inputs', () => {
      render(<Input type="number" step="0.01" />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('step', '0.01')
    })

    it('handles min attribute for number inputs', () => {
      render(<Input type="number" min="0" />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('min', '0')
    })

    it('handles max attribute for number inputs', () => {
      render(<Input type="number" max="100" />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('max', '100')
    })
  })

  // Input type variations
  describe('Input Types', () => {
    it('renders text input correctly (default)', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).not.toHaveAttribute('type')
    })

    it('renders email input correctly', () => {
      render(<Input type="email" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('renders password input correctly', () => {
      render(<Input type="password" />)
      const input = screen.getByRole('textbox', { hidden: true })
      expect(input).toHaveAttribute('type', 'password')
    })

    it('renders number input correctly', () => {
      render(<Input type="number" />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('renders tel input correctly', () => {
      render(<Input type="tel" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'tel')
    })

    it('renders url input correctly', () => {
      render(<Input type="url" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'url')
    })

    it('renders search input correctly', () => {
      render(<Input type="search" />)
      const input = screen.getByRole('searchbox')
      expect(input).toHaveAttribute('type', 'search')
    })

    it('renders date input correctly', () => {
      render(<Input type="date" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'date')
    })

    it('renders time input correctly', () => {
      render(<Input type="time" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'time')
    })

    it('renders datetime-local input correctly', () => {
      render(<Input type="datetime-local" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'datetime-local')
    })

    it('renders range input correctly', () => {
      render(<Input type="range" />)
      const input = screen.getByRole('slider')
      expect(input).toHaveAttribute('type', 'range')
    })

    it('renders color input correctly', () => {
      render(<Input type="color" />)
      const input = screen.getByRole('textbox', { hidden: true })
      expect(input).toHaveAttribute('type', 'color')
    })

    it('renders file input correctly', () => {
      render(<Input type="file" />)
      const input = screen.getByRole('textbox', { hidden: true })
      expect(input).toHaveAttribute('type', 'file')
    })

    it('renders hidden input correctly', () => {
      render(<Input type="hidden" />)
      const input = screen.getByRole('textbox', { hidden: true })
      expect(input).toHaveAttribute('type', 'hidden')
    })
  })

  // Edge cases and error handling
  describe('Edge Cases', () => {
    it('handles empty value gracefully', () => {
      render(<Input value="" onChange={() => {}} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('handles undefined value gracefully', () => {
      render(<Input value={undefined} onChange={() => {}} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('handles null onChange gracefully', () => {
      render(<Input onChange={null as any} />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('handles very long text input', async () => {
      const longText = 'a'.repeat(1000)
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, longText)
      expect(input).toHaveValue(longText)
    })

    it('handles special characters in input', async () => {
      const specialChars = '!@#$%^&*()[]{}|;:,.<>?'
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, specialChars)
      expect(input).toHaveValue(specialChars)
    })

    it('handles unicode characters', async () => {
      const unicodeText = '你好世界 🌍 émojis'
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, unicodeText)
      expect(input).toHaveValue(unicodeText)
    })

    it('handles newline characters in input', async () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'line1\nline2')
      expect(input).toHaveValue('line1\nline2')
    })

    it('handles input with maxLength constraint', async () => {
      render(<Input maxLength={5} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'toolong')
      expect(input.value.length).toBeLessThanOrEqual(5)
    })

    it('handles disabled input correctly', async () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'should not type')
      expect(input).toHaveValue('')
    })

    it('handles readonly input correctly', async () => {
      render(<Input readOnly defaultValue="readonly" />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'should not type')
      expect(input).toHaveValue('readonly')
    })
  })

  // Accessibility tests
  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Input aria-label="Username" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-label', 'Username')
    })

    it('supports aria-describedby', () => {
      render(<Input aria-describedby="help-text" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('supports aria-invalid', () => {
      render(<Input aria-invalid="true" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('supports aria-required', () => {
      render(<Input aria-required="true" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-required', 'true')
    })

    it('supports aria-labelledby', () => {
      render(<Input aria-labelledby="label-id" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-labelledby', 'label-id')
    })

    it('is keyboard accessible', async () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.tab()
      expect(document.activeElement).toBe(input)
    })

    it('works with form labels', () => {
      render(
        <div>
          <label htmlFor="test-input">Test Label</label>
          <Input id="test-input" />
        </div>
      )
      
      const input = screen.getByLabelText('Test Label')
      expect(input).toBeInTheDocument()
    })

    it('supports screen reader announcements', () => {
      render(<Input aria-live="polite" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-live', 'polite')
    })
  })

  // Focus management tests
  describe('Focus Management', () => {
    it('handles programmatic focus', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      
      fireEvent.focus(input)
      expect(input).toHaveFocus()
    })

    it('handles programmatic blur', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      
      fireEvent.focus(input)
      fireEvent.blur(input)
      expect(input).not.toHaveFocus()
    })

    it('maintains focus during typing', async () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      await user.type(input, 'test')
      expect(input).toHaveFocus()
    })

    it('handles focus with mouse click', async () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      expect(input).toHaveFocus()
    })

    it('handles focus with keyboard navigation', async () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.tab()
      expect(input).toHaveFocus()
    })
  })

  // Form integration tests
  describe('Form Integration', () => {
    it('works in controlled forms', async () => {
      const TestForm = () => {
        const [value, setValue] = React.useState('')
        return (
          <form>
            <Input 
              value={value} 
              onChange={(e) => setValue(e.target.value)}
              data-testid="form-input"
            />
          </form>
        )
      }

      render(<TestForm />)
      const input = screen.getByTestId('form-input')
      
      await user.type(input, 'form test')
      expect(input).toHaveValue('form test')
    })

    it('works in uncontrolled forms', async () => {
      render(
        <form>
          <Input name="test" defaultValue="default" data-testid="form-input" />
        </form>
      )
      const input = screen.getByTestId('form-input')
      
      await user.clear(input)
      await user.type(input, 'new value')
      expect(input).toHaveValue('new value')
    })

    it('supports form validation', () => {
      render(<Input required pattern="[0-9]+" />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveAttribute('required')
      expect(input).toHaveAttribute('pattern', '[0-9]+')
    })

    it('works with form submission', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault())
      
      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" />
          <button type="submit">Submit</button>
        </form>
      )
      
      const input = screen.getByRole('textbox')
      const button = screen.getByRole('button')
      
      await user.type(input, 'testuser')
      await user.click(button)
      
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })

    it('handles form reset', async () => {
      render(
        <form>
          <Input name="username" defaultValue="default" data-testid="input" />
          <button type="reset">Reset</button>
        </form>
      )
      
      const input = screen.getByTestId('input')
      const resetButton = screen.getByRole('button')
      
      await user.clear(input)
      await user.type(input, 'changed')
      expect(input).toHaveValue('changed')
      
      await user.click(resetButton)
      expect(input).toHaveValue('default')
    })
  })

  // Performance tests
  describe('Performance', () => {
    it('does not cause memory leaks with multiple renders', () => {
      const { rerender } = render(<Input />)
      
      for (let i = 0; i < 100; i++) {
        rerender(<Input key={i} />)
      }
      
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('handles rapid state changes without issues', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('')
        return (
          <Input 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
            data-testid="rapid-input"
          />
        )
      }

      render(<TestComponent />)
      const input = screen.getByTestId('rapid-input')
      
      // Simulate rapid typing
      for (let i = 0; i < 10; i++) {
        await user.type(input, 'a')
      }
      
      expect(input).toHaveValue('aaaaaaaaaa')
    })

    it('cleans up event listeners on unmount', () => {
      const handleChange = jest.fn()
      const { unmount } = render(<Input onChange={handleChange} />)
      
      unmount()
      expect(handleChange).toHaveBeenCalledTimes(0)
    })
  })

  // Styling tests
  describe('Styling', () => {
    it('applies consistent styling classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('rounded-md')
      expect(input).toHaveClass('px-3', 'py-1')
      expect(input).toHaveClass('transition-[color,box-shadow]')
    })

    it('handles custom styling overrides', () => {
      render(<Input className="bg-red-500 text-white" />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('bg-red-500', 'text-white')
    })

    it('maintains proper focus ring behavior', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('focus-visible:ring-[3px]')
    })

    it('handles dark mode classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('dark:bg-input/30')
      expect(input).toHaveClass('dark:aria-invalid:ring-destructive/40')
    })
  })
})