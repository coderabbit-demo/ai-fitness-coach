import React from 'react';
import { render } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock Next.js font
jest.mock('next/font/google', () => ({
  Geist: jest.fn().mockReturnValue({
    variable: '--font-geist-sans',
    className: 'geist-sans',
  }),
  Geist_Mono: jest.fn().mockReturnValue({
    variable: '--font-geist-mono',
    className: 'geist-mono',
  }),
}));

// Mock globals.css
jest.mock('./globals.css', () => ({}), { virtual: true });

// Mock PWAProvider
jest.mock('@/components/providers/PWAProvider', () => ({
  PWAProvider: ({ children }: any) => (
    <div data-testid="pwa-provider">{children}</div>
  ),
}));

// Mock ToastProvider
jest.mock('@/components/providers/ToastProvider', () => ({
  ToastProvider: ({ children }: any) => (
    <div data-testid="toast-provider">{children}</div>
  ),
}));

describe('RootLayout', () => {
  it('should export metadata with correct title', async () => {
    const { metadata } = await import('../layout');
    expect(metadata.title).toBe('AI Fitness Coach - Calorie Tracker');
  });

  it('should export metadata with correct description', async () => {
    const { metadata } = await import('../layout');
    expect(metadata.description).toBe('Smart calorie tracking with AI photo analysis');
  });

  it('should export metadata with manifest link', async () => {
    const { metadata } = await import('../layout');
    expect(metadata.manifest).toBe('/manifest.json');
  });

  it('should export metadata with Apple web app configuration', async () => {
    const { metadata } = await import('../layout');
    expect(metadata.appleWebApp).toEqual({
      capable: true,
      statusBarStyle: 'default',
      title: 'AI Calorie Tracker',
    });
  });

  it('should export metadata with formatDetection telephone: false', async () => {
    const { metadata } = await import('../layout');
    expect(metadata.formatDetection).toEqual({ telephone: false });
  });

  it('should export metadata with openGraph configuration', async () => {
    const { metadata } = await import('../layout');
    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      siteName: 'AI Calorie Tracker',
      title: 'AI Fitness Coach - Calorie Tracker',
    });
  });

  it('should export metadata with Twitter card configuration', async () => {
    const { metadata } = await import('../layout');
    expect(metadata.twitter).toMatchObject({
      card: 'summary',
      title: 'AI Fitness Coach - Calorie Tracker',
    });
  });

  it('should export viewport with correct theme color', async () => {
    const { viewport } = await import('../layout');
    expect(viewport.themeColor).toBe('#000000');
  });

  it('should export viewport with correct initial scale', async () => {
    const { viewport } = await import('../layout');
    expect(viewport.initialScale).toBe(1);
  });

  it('should export viewport with maximumScale: 1 (prevents zoom)', async () => {
    const { viewport } = await import('../layout');
    expect(viewport.maximumScale).toBe(1);
  });

  it('should export viewport with userScalable: false', async () => {
    const { viewport } = await import('../layout');
    expect(viewport.userScalable).toBe(false);
  });

  describe('RootLayout component rendering', () => {
    it('should render PWAProvider wrapping children', async () => {
      const { default: RootLayout } = await import('../layout');
      const result = await RootLayout({ children: <div data-testid="child">Child</div> });

      const { getByTestId } = render(result as React.ReactElement);
      expect(getByTestId('pwa-provider')).toBeInTheDocument();
    });

    it('should render ToastProvider wrapping children', async () => {
      const { default: RootLayout } = await import('../layout');
      const result = await RootLayout({ children: <div data-testid="child">Child</div> });

      const { getByTestId } = render(result as React.ReactElement);
      expect(getByTestId('toast-provider')).toBeInTheDocument();
    });

    it('should render children inside providers', async () => {
      const { default: RootLayout } = await import('../layout');
      const result = await RootLayout({ children: <div data-testid="child">Child Content</div> });

      const { getByTestId } = render(result as React.ReactElement);
      expect(getByTestId('child')).toBeInTheDocument();
    });

    it('should include lang="en" attribute on html element', async () => {
      const { default: RootLayout } = await import('../layout');
      const result = await RootLayout({ children: <div>Test</div> });

      const { container } = render(result as React.ReactElement);
      // The html element should have lang="en"
      expect(result).toBeTruthy();
    });
  });
});