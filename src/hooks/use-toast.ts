import { useCallback } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = useCallback(({ title, description, variant }: ToastOptions) => {
    const message = description ? `${title}: ${description}` : title;
    if (variant === 'destructive') {
      console.error(message);
    } else {
      console.log(message);
    }
    // For now, use browser alert as a simple toast replacement
    alert(message);
  }, []);

  return { toast };
} 