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

export function setGlobalToast(toastFn: (options: ToastOptions) => void) {
  globalToastFn = toastFn;
}

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