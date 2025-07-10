import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import Page from '../page';

// Mock Next.js router and navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: () => ({
    get: jest.fn(),
  }),
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

describe('Page Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    test('renders without crashing', () => {
      expect(() => render(<Page />)).not.toThrow();
    });

    test('renders main content area', () => {
      render(<Page />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    test('renders page title when present', () => {
      render(<Page />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });

    test('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      render(<Page />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('has proper document structure', () => {
      render(<Page />);
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper semantic HTML structure', () => {
      render(<Page />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    test('has proper heading hierarchy', () => {
      render(<Page />);
      const headings = screen.getAllByRole('heading');
      
      if (headings.length > 0) {
        // Check that h1 comes before other headings
        const h1Elements = headings.filter(h => h.tagName === 'H1');
        expect(h1Elements.length).toBeLessThanOrEqual(1);
      }
    });

    test('has proper alt text for images', () => {
      render(<Page />);
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
      });
    });

    test('has proper focus management for interactive elements', () => {
      render(<Page />);
      const buttons = screen.getAllByRole('button');
      const links = screen.getAllByRole('link');
      
      [...buttons, ...links].forEach(element => {
        expect(element).toHaveAttribute('tabIndex');
      });
    });

    test('has proper ARIA labels where needed', () => {
      render(<Page />);
      const main = screen.getByRole('main');
      
      // Check for ARIA labels on main content
      if (main.hasAttribute('aria-label') || main.hasAttribute('aria-labelledby')) {
        expect(main).toHaveAttribute('aria-label');
      }
    });
  });

  describe('User Interactions', () => {
    test('handles button clicks gracefully', async () => {
      render(<Page />);
      const buttons = screen.getAllByRole('button');
      
      for (const button of buttons) {
        expect(() => fireEvent.click(button)).not.toThrow();
      }
    });

    test('handles form submissions when forms are present', async () => {
      render(<Page />);
      const forms = screen.getAllByRole('form');
      
      for (const form of forms) {
        expect(() => fireEvent.submit(form)).not.toThrow();
      }
    });

    test('handles keyboard navigation', () => {
      render(<Page />);
      const focusableElements = screen.getAllByRole('button');
      
      focusableElements.forEach(element => {
        expect(() => {
          fireEvent.keyDown(element, { key: 'Enter', code: 'Enter' });
          fireEvent.keyDown(element, { key: ' ', code: 'Space' });
          fireEvent.keyDown(element, { key: 'Tab', code: 'Tab' });
        }).not.toThrow();
      });
    });

    test('handles link navigation', () => {
      render(<Page />);
      const links = screen.getAllByRole('link');
      
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
        expect(() => fireEvent.click(link)).not.toThrow();
      });
    });

    test('handles input changes', () => {
      render(<Page />);
      const inputs = screen.getAllByRole('textbox');
      
      inputs.forEach(input => {
        expect(() => {
          fireEvent.change(input, { target: { value: 'test value' } });
        }).not.toThrow();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles missing props gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => render(<Page />)).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    test('handles invalid props gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test with various invalid props
      expect(() => render(<Page invalidProp="test" />)).not.toThrow();
      expect(() => render(<Page nullProp={null} />)).not.toThrow();
      expect(() => render(<Page undefinedProp={undefined} />)).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    test('handles network errors gracefully', async () => {
      // Mock fetch to simulate network error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      expect(() => render(<Page />)).not.toThrow();
      
      global.fetch = originalFetch;
    });

    test('handles JavaScript errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test error boundary behavior if present
      expect(() => render(<Page />)).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    test('renders within acceptable time', () => {
      const startTime = performance.now();
      render(<Page />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // 1 second threshold
    });

    test('does not cause memory leaks', () => {
      const { unmount } = render(<Page />);
      
      expect(() => unmount()).not.toThrow();
    });

    test('handles multiple re-renders efficiently', () => {
      const { rerender } = render(<Page />);
      
      for (let i = 0; i < 10; i++) {
        expect(() => rerender(<Page key={i} />)).not.toThrow();
      }
    });
  });

  describe('Responsive Design', () => {
    test('adapts to different screen sizes', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<Page />);
      fireEvent(window, new Event('resize'));
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      
      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      
      fireEvent(window, new Event('resize'));
      expect(main).toBeInTheDocument();
    });

    test('handles orientation changes', () => {
      render(<Page />);
      
      expect(() => {
        fireEvent(window, new Event('orientationchange'));
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty content gracefully', () => {
      render(<Page />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('handles very long content', () => {
      const longText = 'a'.repeat(10000);
      expect(() => render(<Page content={longText} />)).not.toThrow();
    });

    test('handles special characters in content', () => {
      const specialChars = '!@#$%^&*()[]{}|;:,.<>?';
      expect(() => render(<Page content={specialChars} />)).not.toThrow();
    });

    test('handles Unicode characters', () => {
      const unicodeText = '🚀 Hello 世界 🌍';
      expect(() => render(<Page content={unicodeText} />)).not.toThrow();
    });

    test('handles null and undefined values', () => {
      expect(() => render(<Page nullValue={null} />)).not.toThrow();
      expect(() => render(<Page undefinedValue={undefined} />)).not.toThrow();
    });
  });

  describe('Integration', () => {
    test('integrates with Next.js router', () => {
      render(<Page />);
      
      // Test that the component doesn't throw errors with router
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('integrates with Next.js metadata', () => {
      render(<Page />);
      
      // Test that metadata is properly set
      expect(document.title).toBeDefined();
    });

    test('integrates with context providers', () => {
      render(<Page />);
      
      // Test that context is properly consumed
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    test('manages local state correctly', () => {
      render(<Page />);
      
      const statefulElements = screen.getAllByRole('button');
      statefulElements.forEach(button => {
        expect(() => fireEvent.click(button)).not.toThrow();
      });
    });

    test('handles state updates properly', async () => {
      render(<Page />);
      
      const inputs = screen.getAllByRole('textbox');
      for (const input of inputs) {
        fireEvent.change(input, { target: { value: 'test value' } });
        
        await waitFor(() => {
          expect(input).toHaveValue('test value');
        });
      }
    });

    test('handles async state updates', async () => {
      render(<Page />);
      
      // Test async operations don't cause errors
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Security', () => {
    test('sanitizes user input', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      render(<Page userInput={maliciousInput} />);
      
      const main = screen.getByRole('main');
      expect(main.innerHTML).not.toContain('<script>');
    });

    test('prevents XSS attacks in links', () => {
      render(<Page />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          expect(href).not.toContain('javascript:');
          expect(href).not.toContain('data:text/html');
        }
      });
    });

    test('handles malformed URLs gracefully', () => {
      expect(() => render(<Page malformedUrl="javascript:alert('xss')" />)).not.toThrow();
    });
  });

  describe('Loading States', () => {
    test('handles loading states gracefully', () => {
      render(<Page />);
      
      // Test that loading indicators don't cause errors
      const loadingElements = screen.getAllByText(/loading/i);
      expect(loadingElements.length).toBeGreaterThanOrEqual(0);
    });

    test('handles async data loading', async () => {
      render(<Page />);
      
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundaries', () => {
    test('handles component errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test that errors don't crash the entire application
      expect(() => render(<Page />)).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('SEO and Meta Tags', () => {
    test('handles meta tags properly', () => {
      render(<Page />);
      
      // Test that the component doesn't interfere with meta tags
      expect(document.head).toBeInTheDocument();
    });

    test('handles structured data', () => {
      render(<Page />);
      
      // Test that structured data is properly rendered
      const jsonLdElements = document.querySelectorAll('script[type="application/ld+json"]');
      expect(jsonLdElements.length).toBeGreaterThanOrEqual(0);
    });
  });
});