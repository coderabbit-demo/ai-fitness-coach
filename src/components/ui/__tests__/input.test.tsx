import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

// Mock the cn utility since it's likely from a utils file
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

describe('Input Component', () => {
  // Happy path tests
  describe('Basic functionality', () => {
    test('renders input element correctly', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('data-slot', 'input')
    })

    test('renders with default text type', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'text')
    })

    test('applies custom className', () => {
      render(<Input className="custom-class" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-class')
    })

    test('accepts and displays value', () => {
      render(<Input value="test value" readOnly />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('test value')
    })

    test('accepts placeholder text', () => {
      render(<Input placeholder="Enter your name" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('placeholder', 'Enter your name')
    })

    test('accepts disabled state', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    test('accepts readOnly state', () => {
      render(<Input readOnly />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readonly')
    })

    test('accepts required attribute', () => {
      render(<Input required />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('required')
    })

    test('accepts name attribute', () => {
      render(<Input name="username" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('name', 'username')
    })

    test('accepts id attribute', () => {
      render(<Input id="username-input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'username-input')
    })
  })

  // Different input types tests
  describe('Input types', () => {
    test('renders password input correctly', () => {
      render(<Input type="password" />)
      const input = screen.getByLabelText('', { selector: 'input[type="password"]' })
      expect(input).toHaveAttribute('type', 'password')
    })

    test('renders email input correctly', () => {
      render(<Input type="email" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    test('renders number input correctly', () => {
      render(<Input type="number" />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })

    test('renders tel input correctly', () => {
      render(<Input type="tel" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'tel')
    })

    test('renders url input correctly', () => {
      render(<Input type="url" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'url')
    })

    test('renders search input correctly', () => {
      render(<Input type="search" />)
      const input = screen.getByRole('searchbox')
      expect(input).toHaveAttribute('type', 'search')
    })

    test('renders file input correctly', () => {
      render(<Input type="file" />)
      const input = screen.getByLabelText('', { selector: 'input[type="file"]' })
      expect(input).toHaveAttribute('type', 'file')
    })

    test('renders hidden input correctly', () => {
      render(<Input type="hidden" name="hidden-field" />)
      const input = document.querySelector('input[type="hidden"]')
      expect(input).toHaveAttribute('type', 'hidden')
      expect(input).toHaveAttribute('name', 'hidden-field')
    })

    test('renders checkbox input correctly', () => {
      render(<Input type="checkbox" />)
      const input = screen.getByRole('checkbox')
      expect(input).toHaveAttribute('type', 'checkbox')
    })

    test('renders radio input correctly', () => {
      render(<Input type="radio" />)
      const input = screen.getByRole('radio')
      expect(input).toHaveAttribute('type', 'radio')
    })
  })

  // Event handling tests
  describe('Event handling', () => {
    test('calls onChange handler when value changes', async () => {
      const handleChange = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'hello')
      
      expect(handleChange).toHaveBeenCalledTimes(5)
      expect(handleChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: 'hello'
          })
        })
      )
    })

    test('calls onFocus handler when focused', async () => {
      const handleFocus = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onFocus={handleFocus} />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    test('calls onBlur handler when blurred', async () => {
      const handleBlur = jest.fn()
      const user = userEvent.setup()
      
      render(
        <div>
          <Input onBlur={handleBlur} />
          <button>Other element</button>
        </div>
      )
      
      const input = screen.getByRole('textbox')
      const button = screen.getByRole('button')
      
      await user.click(input)
      await user.click(button)
      
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    test('calls onKeyDown handler when key is pressed', async () => {
      const handleKeyDown = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onKeyDown={handleKeyDown} />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      await user.keyboard('{Enter}')
      
      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Enter'
        })
      )
    })

    test('calls onKeyUp handler when key is released', async () => {
      const handleKeyUp = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onKeyUp={handleKeyUp} />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      await user.keyboard('a')
      
      expect(handleKeyUp).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'a'
        })
      )
    })

    test('calls onInput handler when input value changes', async () => {
      const handleInput = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onInput={handleInput} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'test')
      
      expect(handleInput).toHaveBeenCalledTimes(4)
    })

    test('calls onSubmit handler when form is submitted', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault())
      const user = userEvent.setup()
      
      render(
        <form onSubmit={handleSubmit}>
          <Input />
          <button type="submit">Submit</button>
        </form>
      )
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button')
      
      await user.type(input, 'test')
      await user.click(submitButton)
      
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })
  })

  // Edge cases and error handling
  describe('Edge cases', () => {
    test('handles empty string value', () => {
      render(<Input value="" readOnly />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    test('handles undefined value gracefully', () => {
      render(<Input value={undefined} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    test('handles null value gracefully', () => {
      render(<Input value={null as any} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    test('handles very long input values', async () => {
      const longValue = 'a'.repeat(1000)
      const user = userEvent.setup()
      
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, longValue)
      
      expect(input).toHaveValue(longValue)
    })

    test('handles special characters in input', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const user = userEvent.setup()
      
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, specialChars)
      
      expect(input).toHaveValue(specialChars)
    })

    test('handles unicode characters and emojis', async () => {
      const unicodeText = '你好 🌟 émojis 🎉'
      const user = userEvent.setup()
      
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, unicodeText)
      
      expect(input).toHaveValue(unicodeText)
    })

    test('handles multiline text correctly', async () => {
      const multilineText = 'line1\nline2\nline3'
      const user = userEvent.setup()
      
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, multilineText)
      
      expect(input).toHaveValue(multilineText)
    })

    test('handles maximum length attribute', () => {
      render(<Input maxLength={10} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('maxlength', '10')
    })

    test('handles minimum length attribute', () => {
      render(<Input minLength={5} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('minlength', '5')
    })

    test('handles pattern attribute', () => {
      render(<Input pattern="[0-9]*" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('pattern', '[0-9]*')
    })
  })

  // Accessibility tests
  describe('Accessibility', () => {
    test('supports aria-label', () => {
      render(<Input aria-label="Username input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-label', 'Username input')
    })

    test('supports aria-describedby', () => {
      render(<Input aria-describedby="help-text" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'help-text')
    })

    test('supports aria-invalid', () => {
      render(<Input aria-invalid="true" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    test('supports aria-required', () => {
      render(<Input aria-required="true" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-required', 'true')
    })

    test('supports aria-labelledby', () => {
      render(<Input aria-labelledby="label-id" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-labelledby', 'label-id')
    })

    test('is accessible via keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.tab()
      
      expect(input).toHaveFocus()
    })

    test('supports tabindex attribute', () => {
      render(<Input tabIndex={-1} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('tabindex', '-1')
    })

    test('supports title attribute for tooltips', () => {
      render(<Input title="This is a tooltip" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('title', 'This is a tooltip')
    })
  })

  // Form integration tests
  describe('Form integration', () => {
    test('works with controlled form', async () => {
      const TestForm = () => {
        const [value, setValue] = React.useState('')
        return (
          <form>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              data-testid="controlled-input"
            />
            <div data-testid="display-value">{value}</div>
          </form>
        )
      }
      
      const user = userEvent.setup()
      render(<TestForm />)
      
      const input = screen.getByTestId('controlled-input')
      const display = screen.getByTestId('display-value')
      
      await user.type(input, 'test')
      
      expect(input).toHaveValue('test')
      expect(display).toHaveTextContent('test')
    })

    test('works with uncontrolled form', async () => {
      const user = userEvent.setup()
      
      render(
        <form>
          <Input name="username" defaultValue="initial" />
        </form>
      )
      
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveValue('initial')
      
      await user.clear(input)
      await user.type(input, 'new value')
      
      expect(input).toHaveValue('new value')
    })

    test('integrates with form validation', async () => {
      const user = userEvent.setup()
      
      render(
        <form>
          <Input type="email" required />
          <button type="submit">Submit</button>
        </form>
      )
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button')
      
      await user.click(submitButton)
      
      expect(input).toBeInvalid()
    })

    test('supports autocomplete attribute', () => {
      render(<Input autoComplete="username" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('autocomplete', 'username')
    })

    test('supports form attribute', () => {
      render(
        <div>
          <form id="my-form"></form>
          <Input form="my-form" />
        </div>
      )
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('form', 'my-form')
    })
  })

  // CSS and styling tests
  describe('Styling and CSS classes', () => {
    test('applies default CSS classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      // Check for key classes from the component
      expect(input).toHaveClass('flex')
      expect(input).toHaveClass('h-9')
      expect(input).toHaveClass('w-full')
      expect(input).toHaveClass('rounded-md')
      expect(input).toHaveClass('border')
      expect(input).toHaveClass('bg-transparent')
      expect(input).toHaveClass('px-3')
      expect(input).toHaveClass('py-1')
    })

    test('merges custom className with default classes', () => {
      render(<Input className="custom-border custom-padding" />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('custom-border')
      expect(input).toHaveClass('custom-padding')
      expect(input).toHaveClass('flex')
      expect(input).toHaveClass('h-9')
    })

    test('applies focus-visible classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('focus-visible:border-ring')
      expect(input).toHaveClass('focus-visible:ring-ring/50')
    })

    test('applies aria-invalid classes', () => {
      render(<Input aria-invalid="true" />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('aria-invalid:ring-destructive/20')
      expect(input).toHaveClass('aria-invalid:border-destructive')
    })

    test('applies disabled classes', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('disabled:pointer-events-none')
      expect(input).toHaveClass('disabled:cursor-not-allowed')
      expect(input).toHaveClass('disabled:opacity-50')
    })

    test('applies file input classes', () => {
      render(<Input type="file" />)
      const input = screen.getByLabelText('', { selector: 'input[type="file"]' })
      
      expect(input).toHaveClass('file:text-foreground')
      expect(input).toHaveClass('file:inline-flex')
      expect(input).toHaveClass('file:h-7')
      expect(input).toHaveClass('file:border-0')
    })

    test('applies placeholder classes', () => {
      render(<Input placeholder="Enter text" />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('placeholder:text-muted-foreground')
    })

    test('applies selection classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('selection:bg-primary')
      expect(input).toHaveClass('selection:text-primary-foreground')
    })
  })

  // Ref forwarding tests
  describe('Ref forwarding', () => {
    test('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<Input ref={ref} />)
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
      expect(ref.current).toHaveAttribute('type', 'text')
    })

    test('allows programmatic focus via ref', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<Input ref={ref} />)
      
      ref.current?.focus()
      
      expect(ref.current).toHaveFocus()
    })

    test('allows programmatic blur via ref', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<Input ref={ref} />)
      
      ref.current?.focus()
      expect(ref.current).toHaveFocus()
      
      ref.current?.blur()
      expect(ref.current).not.toHaveFocus()
    })

    test('allows programmatic value setting via ref', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<Input ref={ref} />)
      
      if (ref.current) {
        ref.current.value = 'programmatic value'
      }
      
      expect(ref.current).toHaveValue('programmatic value')
    })

    test('allows programmatic selection via ref', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<Input ref={ref} defaultValue="test value" />)
      
      ref.current?.select()
      
      expect(ref.current?.selectionStart).toBe(0)
      expect(ref.current?.selectionEnd).toBe(10)
    })
  })

  // Performance and behavior tests
  describe('Performance and behavior', () => {
    test('handles rapid typing correctly', async () => {
      const handleChange = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'quick', { delay: 1 })
      
      expect(handleChange).toHaveBeenCalledTimes(5)
      expect(input).toHaveValue('quick')
    })

    test('maintains cursor position during controlled updates', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('initial text')
        return (
          <div>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              data-testid="cursor-input"
            />
            <button
              onClick={() => setValue('updated text')}
              data-testid="update-button"
            >
              Update
            </button>
          </div>
        )
      }
      
      const user = userEvent.setup()
      render(<TestComponent />)
      
      const input = screen.getByTestId('cursor-input') as HTMLInputElement
      const button = screen.getByTestId('update-button')
      
      await user.click(input)
      await user.click(button)
      
      expect(input).toHaveValue('updated text')
    })

    test('handles copy and paste operations', async () => {
      const user = userEvent.setup()
      
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      await user.type(input, 'test text')
      
      // Select all text
      await user.keyboard('{Control>}a{/Control}')
      
      // Copy
      await user.keyboard('{Control>}c{/Control}')
      
      // Clear and paste
      await user.keyboard('{Delete}')
      await user.keyboard('{Control>}v{/Control}')
      
      expect(input).toHaveValue('test text')
    })

    test('handles undo and redo operations', async () => {
      const user = userEvent.setup()
      
      render(<Input />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      await user.type(input, 'original')
      await user.type(input, ' modified')
      
      // Undo
      await user.keyboard('{Control>}z{/Control}')
      
      expect(input).toHaveValue('original')
    })
  })

  // Error boundary and crash tests
  describe('Error handling', () => {
    test('handles invalid onChange handler gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<Input onChange={null as any} />)
      }).not.toThrow()
      
      consoleSpy.mockRestore()
    })

    test('handles invalid event handlers gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(
          <Input
            onFocus={null as any}
            onBlur={null as any}
            onKeyDown={null as any}
            onKeyUp={null as any}
          />
        )
      }).not.toThrow()
      
      consoleSpy.mockRestore()
    })

    test('handles invalid type prop gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<Input type={'invalid-type' as any} />)
      }).not.toThrow()
      
      consoleSpy.mockRestore()
    })

    test('handles invalid className gracefully', () => {
      expect(() => {
        render(<Input className={null as any} />)
      }).not.toThrow()
    })
  })

  // Integration with external libraries
  describe('Integration scenarios', () => {
    test('works with form libraries like react-hook-form', async () => {
      const mockRegister = jest.fn(() => ({
        onChange: jest.fn(),
        onBlur: jest.fn(),
        name: 'test-field',
        ref: React.createRef<HTMLInputElement>()
      }))
      
      const user = userEvent.setup()
      
      render(<Input {...mockRegister()} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'test')
      
      expect(input).toHaveValue('test')
      expect(mockRegister).toHaveBeenCalled()
    })

    test('works with validation libraries', async () => {
      const validationFn = jest.fn((value) => value.length > 3)
      const user = userEvent.setup()
      
      const TestComponent = () => {
        const [value, setValue] = React.useState('')
        const [isValid, setIsValid] = React.useState(true)
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newValue = e.target.value
          setValue(newValue)
          setIsValid(validationFn(newValue))
        }
        
        return (
          <Input
            value={value}
            onChange={handleChange}
            aria-invalid={!isValid}
            data-testid="validation-input"
          />
        )
      }
      
      render(<TestComponent />)
      const input = screen.getByTestId('validation-input')
      
      await user.type(input, 'ab')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      
      await user.type(input, 'cd')
      expect(input).toHaveAttribute('aria-invalid', 'false')
    })
  })
})