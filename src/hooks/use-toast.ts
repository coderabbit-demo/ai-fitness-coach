'use client'

import { useCallback } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

// Global toast function for non-React contexts
let globalToastFn: ((options: ToastOptions) => void) | null = null;

/**
 * Registers a module-level global toast handler used when emitting toast notifications.
 *
 * @param toastFn - Function invoked with `ToastOptions` to display or handle a toast
 */
export function setGlobalToast(toastFn: (options: ToastOptions) => void) {
  globalToastFn = toastFn;
}

/**
 * Provides a React hook that emits toast notifications and forwards them to a global toast handler when available.
 *
 * The returned `toast` function accepts a `ToastOptions` object, constructs a message from `title` and optional `description`,
 * logs the message to the console (`console.error` when `variant` is `'destructive'`, otherwise `console.log`), and calls
 * the globally registered toast function if one has been set; if no global handler is registered it logs a warning.
 *
 * @returns An object with a `toast` function.
 * @remarks
 * The `toast` function signature: `(options: ToastOptions) => void` where `ToastOptions` includes:
 * - `title: string`
 * - `description?: string`
 * - `variant?: 'default' | 'destructive'`
 * - `duration?: number`
 */
export function useToast() {
  const toast = useCallback(({ title, description, variant, duration }: ToastOptions) => {
    // Log to console for debugging purposes
    const message = description ? `${title}: ${description}` : title;
    if (variant === 'destructive') {
      console.error(message);
    } else {
      console.log(message);
    }
    
    // Try to use the global toast function if available
    if (globalToastFn) {
      globalToastFn({ title, description, variant, duration });
    } else {
      // Fallback - log a warning that toast system isn't ready
      console.warn('Toast system not initialized, message:', message);
    }
  }, []);

  return { toast };
} 