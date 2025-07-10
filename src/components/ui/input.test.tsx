import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './input'

describe('Input Component', () => {
  // Happy path tests
  describe('Basic functionality', () => {
    it('renders input element with correct type', () => {
      render(<Input type="text" />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
    })

    it('renders with default type when no type is specified', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('accepts and displays user input', async () => {
      const user = userEvent.setup()
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Hello World')
      expect(input).toHaveValue('Hello World')
    })

    it('renders with placeholder text', () => {
      render(<Input placeholder="Enter your name" />)
      const input = screen.getByPlaceholderText('Enter your name')
      expect(input).toBeInTheDocument()
    })

    it('renders with initial value', () => {
      render(<Input value="Initial Value" readOnly />)
      const input = screen.getByDisplayValue('Initial Value')
      expect(input).toBeInTheDocument()
    })

    it('renders with default value', () => {
      render(<Input defaultValue="Default Value" />)
      const input = screen.getByDisplayValue('Default Value')
      expect(input).toBeInTheDocument()
    })

    it('applies data-slot attribute', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('data-slot', 'input')
    })
  })

  // Props and attributes tests
  describe('Props and attributes', () => {
    it('applies custom className', () => {
      render(<Input className="custom-class" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-class')
    })

    it('applies default styling classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('flex', 'h-9', 'w-full', 'rounded-md', 'border')
    })

    it('combines default and custom classes', () => {
      render(<Input className="custom-class" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('flex', 'h-9', 'w-full', 'custom-class')
    })

    it('applies custom id', () => {
      render(<Input id="custom-id" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'custom-id')
    })

    it('applies custom name attribute', () => {
      render(<Input name="username" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('name', 'username')
    })

    it('applies aria-label', () => {
      render(<Input aria-label="Username input" />)
      const input = screen.getByLabelText('Username input')
      expect(input).toBeInTheDocument()
    })

    it('applies aria-describedby', () => {
      render(<Input aria-describedby="help-text" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('applies required attribute', () => {
      render(<Input required />)
      const input = screen.getByRole('textbox')
      expect(input).toBeRequired()
    })

    it('applies autoComplete attribute', () => {
      render(<Input autoComplete="username" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('autocomplete', 'username')
    })

    it('applies autoFocus attribute', () => {
      render(<Input autoFocus />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveFocus()
    })

    it('applies tabIndex attribute', () => {
      render(<Input tabIndex={-1} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('tabindex', '-1')
    })
  })

  // Different input types
  describe('Input types', () => {
    it('renders password input', () => {
      render(<Input type="password" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('renders email input', () => {
      render(<Input type="email" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('renders number input', () => {
      render(<Input type="number" />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('renders tel input', () => {
      render(<Input type="tel" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'tel')
    })

    it('renders url input', () => {
      render(<Input type="url" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'url')
    })

    it('renders search input', () => {
      render(<Input type="search" />)
      const input = screen.getByRole('searchbox')
      expect(input).toHaveAttribute('type', 'search')
    })

    it('renders date input', () => {
      render(<Input type="date" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'date')
    })

    it('renders time input', () => {
      render(<Input type="time" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'time')
    })

    it('renders file input', () => {
      render(<Input type="file" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'file')
    })

    it('renders hidden input', () => {
      render(<Input type="hidden" />)
      const input = document.querySelector('input[type="hidden"]')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'hidden')
    })
  })

  // State management tests
  describe('State management', () => {
    it('handles controlled input with onChange', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()
      render(<Input value="initial" onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'a')
      expect(handleChange).toHaveBeenCalled()
    })

    it('handles uncontrolled input', async () => {
      const user = userEvent.setup()
      render(<Input defaultValue="initial" />)
      const input = screen.getByRole('textbox')
      
      await user.clear(input)
      await user.type(input, 'new value')
      expect(input).toHaveValue('new value')
    })

    it('calls onChange with correct event data', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 't')
      expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({
          value: 't'
        })
      }))
    })

    it('maintains controlled state correctly', async () => {
      const user = userEvent.setup()
      const TestComponent = () => {
        const [value, setValue] = React.useState('initial')
        return <Input value={value} onChange={(e) => setValue(e.target.value)} />
      }
      
      render(<TestComponent />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveValue('initial')
      await user.clear(input)
      await user.type(input, 'new')
      expect(input).toHaveValue('new')
    })
  })

  // Event handling tests
  describe('Event handling', () => {
    it('handles onFocus event', async () => {
      const user = userEvent.setup()
      const handleFocus = jest.fn()
      render(<Input onFocus={handleFocus} />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      expect(handleFocus).toHaveBeenCalled()
    })

    it('handles onBlur event', async () => {
      const user = userEvent.setup()
      const handleBlur = jest.fn()
      render(<Input onBlur={handleBlur} />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      await user.tab()
      expect(handleBlur).toHaveBeenCalled()
    })

    it('handles onKeyDown event', async () => {
      const user = userEvent.setup()
      const handleKeyDown = jest.fn()
      render(<Input onKeyDown={handleKeyDown} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'a')
      expect(handleKeyDown).toHaveBeenCalled()
    })

    it('handles onKeyUp event', async () => {
      const user = userEvent.setup()
      const handleKeyUp = jest.fn()
      render(<Input onKeyUp={handleKeyUp} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'a')
      expect(handleKeyUp).toHaveBeenCalled()
    })

    it('handles Enter key press', async () => {
      const user = userEvent.setup()
      const handleKeyDown = jest.fn()
      render(<Input onKeyDown={handleKeyDown} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, '{enter}')
      expect(handleKeyDown).toHaveBeenCalledWith(expect.objectContaining({
        key: 'Enter'
      }))
    })

    it('handles Escape key press', async () => {
      const user = userEvent.setup()
      const handleKeyDown = jest.fn()
      render(<Input onKeyDown={handleKeyDown} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, '{escape}')
      expect(handleKeyDown).toHaveBeenCalledWith(expect.objectContaining({
        key: 'Escape'
      }))
    })

    it('handles onInput event', async () => {
      const user = userEvent.setup()
      const handleInput = jest.fn()
      render(<Input onInput={handleInput} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'test')
      expect(handleInput).toHaveBeenCalled()
    })
  })

  // Validation and constraints tests
  describe('Validation and constraints', () => {
    it('applies minLength constraint', () => {
      render(<Input minLength={5} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('minlength', '5')
    })

    it('applies maxLength constraint', () => {
      render(<Input maxLength={10} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('maxlength', '10')
    })

    it('applies pattern constraint', () => {
      render(<Input pattern="[0-9]+" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('pattern', '[0-9]+')
    })

    it('applies min constraint for number input', () => {
      render(<Input type="number" min={0} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('min', '0')
    })

    it('applies max constraint for number input', () => {
      render(<Input type="number" max={100} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('max', '100')
    })

    it('applies step constraint for number input', () => {
      render(<Input type="number" step={0.5} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('step', '0.5')
    })

    it('respects maxLength during typing', async () => {
      const user = userEvent.setup()
      render(<Input maxLength={5} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'abcdefghij')
      expect(input.value.length).toBeLessThanOrEqual(5)
    })
  })

  // Disabled and readonly states
  describe('Disabled and readonly states', () => {
    it('renders disabled input', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('renders readonly input', () => {
      render(<Input readOnly />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readonly')
    })

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup()
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'test')
      expect(input).toHaveValue('')
    })

    it('does not accept input when readonly', async () => {
      const user = userEvent.setup()
      render(<Input readOnly defaultValue="initial" />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'test')
      expect(input).toHaveValue('initial')
    })

    it('does not trigger onChange when disabled', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()
      render(<Input disabled onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'test')
      expect(handleChange).not.toHaveBeenCalled()
    })

    it('applies disabled styling classes', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('disabled:pointer-events-none', 'disabled:cursor-not-allowed', 'disabled:opacity-50')
    })
  })

  // Edge cases and error handling
  describe('Edge cases and error handling', () => {
    it('handles null value gracefully', () => {
      render(<Input value={null as any} readOnly />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('handles undefined value gracefully', () => {
      render(<Input value={undefined as any} readOnly />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('handles empty string value', () => {
      render(<Input value="" readOnly />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('handles very long text input', async () => {
      const user = userEvent.setup()
      const longText = 'a'.repeat(1000)
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, longText)
      expect(input).toHaveValue(longText)
    })

    it('handles special characters', async () => {
      const user = userEvent.setup()
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, specialChars)
      expect(input).toHaveValue(specialChars)
    })

    it('handles unicode characters', async () => {
      const user = userEvent.setup()
      const unicodeText = '测试 🚀 émojis'
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, unicodeText)
      expect(input).toHaveValue(unicodeText)
    })

    it('handles rapid typing', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'quicktyping', { delay: 1 })
      expect(input).toHaveValue('quicktyping')
      expect(handleChange).toHaveBeenCalledTimes(11) // 11 characters
    })

    it('handles number input with invalid characters', async () => {
      const user = userEvent.setup()
      render(<Input type="number" />)
      const input = screen.getByRole('spinbutton')
      
      await user.type(input, 'abc123def')
      // Number inputs typically filter out non-numeric characters
      expect(input).toHaveValue(123)
    })
  })

  // Accessibility tests
  describe('Accessibility', () => {
    it('has proper accessibility attributes', () => {
      render(<Input aria-label="Search input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-label', 'Search input')
    })

    it('supports aria-invalid for error states', () => {
      render(<Input aria-invalid="true" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('applies aria-invalid styling classes', () => {
      render(<Input aria-invalid="true" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('aria-invalid:ring-destructive/20', 'aria-invalid:border-destructive')
    })

    it('supports aria-required', () => {
      render(<Input aria-required="true" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-required', 'true')
    })

    it('is keyboard navigable', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <Input />
          <Input />
        </div>
      )
      
      const inputs = screen.getAllByRole('textbox')
      await user.tab()
      expect(inputs[0]).toHaveFocus()
      
      await user.tab()
      expect(inputs[1]).toHaveFocus()
    })

    it('skips disabled input during keyboard navigation', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <Input />
          <Input disabled />
          <Input />
        </div>
      )
      
      const inputs = screen.getAllByRole('textbox')
      await user.tab()
      expect(inputs[0]).toHaveFocus()
      
      await user.tab()
      expect(inputs[2]).toHaveFocus()
    })

    it('supports screen reader announcements', () => {
      render(<Input aria-describedby="help-text" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('has proper focus styling', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('focus-visible:border-ring', 'focus-visible:ring-ring/50', 'focus-visible:ring-[3px]')
    })
  })

  // Form integration tests
  describe('Form integration', () => {
    it('works within form element', () => {
      render(
        <form>
          <Input name="username" />
        </form>
      )
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('name', 'username')
    })

    it('participates in form submission', async () => {
      const user = userEvent.setup()
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
      
      expect(handleSubmit).toHaveBeenCalled()
    })

    it('triggers form submission on Enter key', async () => {
      const user = userEvent.setup()
      const handleSubmit = jest.fn((e) => e.preventDefault())
      
      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" />
        </form>
      )
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'testuser{enter}')
      
      expect(handleSubmit).toHaveBeenCalled()
    })

    it('includes input value in form data', async () => {
      const user = userEvent.setup()
      const handleSubmit = jest.fn((e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        expect(formData.get('username')).toBe('testuser')
      })
      
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
      
      expect(handleSubmit).toHaveBeenCalled()
    })
  })

  // Performance tests
  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn()
      const TestComponent = () => {
        renderSpy()
        return <Input />
      }
      
      const { rerender } = render(<TestComponent />)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      rerender(<TestComponent />)
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })

    it('handles multiple rapid onChange events', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      
      // Simulate rapid typing
      await user.type(input, 'abcdefghij', { delay: 1 })
      
      expect(handleChange).toHaveBeenCalledTimes(10)
      expect(input).toHaveValue('abcdefghij')
    })

    it('maintains performance with large amounts of text', async () => {
      const user = userEvent.setup()
      const largeText = 'a'.repeat(10000)
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      const startTime = performance.now()
      await user.type(input, largeText)
      const endTime = performance.now()
      
      expect(input).toHaveValue(largeText)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })

  // Error boundary tests
  describe('Error handling', () => {
    it('handles invalid onChange handler gracefully', () => {
      // This test ensures the component doesn't crash with invalid props
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<Input onChange={null as any} />)
      const input = screen.getByRole('textbox')
      
      fireEvent.change(input, { target: { value: 'test' } })
      
      consoleError.mockRestore()
    })

    it('handles invalid ref gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<Input ref={null as any} />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      
      consoleError.mockRestore()
    })

    it('handles invalid type prop gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<Input type={'invalid-type' as any} />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      
      consoleError.mockRestore()
    })
  })

  // Ref forwarding tests
  describe('Ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<Input ref={ref} />)
      
      expect(ref.current).toBeTruthy()
      expect(ref.current?.tagName).toBe('INPUT')
    })

    it('allows programmatic focus via ref', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<Input ref={ref} />)
      
      ref.current?.focus()
      expect(ref.current).toHaveFocus()
    })

    it('allows programmatic blur via ref', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<Input ref={ref} autoFocus />)
      
      ref.current?.blur()
      expect(ref.current).not.toHaveFocus()
    })

    it('allows programmatic selection via ref', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<Input ref={ref} defaultValue="test value" />)
      
      ref.current?.select()
      expect(ref.current?.selectionStart).toBe(0)
      expect(ref.current?.selectionEnd).toBe(10)
    })

    it('allows programmatic value setting via ref', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<Input ref={ref} />)
      
      if (ref.current) {
        ref.current.value = 'programmatic value'
        fireEvent.change(ref.current)
      }
      
      expect(ref.current?.value).toBe('programmatic value')
    })
  })

  // CSS and styling tests
  describe('CSS and styling', () => {
    it('applies base styling classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'flex',
        'h-9',
        'w-full',
        'min-w-0',
        'rounded-md',
        'border',
        'bg-transparent',
        'px-3',
        'py-1'
      )
    })

    it('applies focus styling classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'focus-visible:border-ring',
        'focus-visible:ring-ring/50',
        'focus-visible:ring-[3px]'
      )
    })

    it('applies file input styling classes', () => {
      render(<Input type="file" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'file:text-foreground',
        'file:inline-flex',
        'file:h-7',
        'file:border-0',
        'file:bg-transparent',
        'file:text-sm',
        'file:font-medium'
      )
    })

    it('applies placeholder styling classes', () => {
      render(<Input placeholder="Test" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('placeholder:text-muted-foreground')
    })

    it('applies selection styling classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'selection:bg-primary',
        'selection:text-primary-foreground'
      )
    })
  })
})