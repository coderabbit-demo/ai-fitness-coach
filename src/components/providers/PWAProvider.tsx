'use client';

import { useEffect, useCallback, useRef } from 'react';
import { swManager } from '@/lib/pwa/service-worker';
import { syncService } from '@/lib/pwa/sync-service';
import { offlineStorage } from '@/lib/pwa/offline-storage';
import { useToast } from '@/hooks/use-toast';

interface PWAProviderProps {
  children: React.ReactNode;
}

// Type definition for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const { toast } = useToast();
  const cleanupRef = useRef<(() => void)[]>([]);

  const showInstallPrompt = useCallback((prompt: BeforeInstallPromptEvent) => {
    toast({
      title: "Install app?",
      description: "Add to home screen for quick access and offline use"
    });
    // Auto-prompt install after 2 seconds
    const timeoutId = setTimeout(async () => {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        console.log(`Install prompt outcome: ${outcome}`);
      } catch (error) {
        console.error('Install prompt error:', error);
      }
    }, 2000);
    cleanupRef.current.push(() => clearTimeout(timeoutId));
  }, [toast]);

  const initializePWA = useCallback(async () => {
    try {
      // Initialize offline storage
      if (offlineStorage) {
        await offlineStorage.init();
        console.log('Offline storage initialized');
      }

      // Register service worker
      if ('serviceWorker' in navigator && swManager) {
        await swManager.register();
        console.log('Service worker registered');
      }

      // Start auto-sync
      if (syncService) {
        syncService.startAutoSync();
        console.log('Auto-sync started');
      }

      // Listen for app update events
      const updateEventHandler = () => {
        // Show non-intrusive notification without auto-reload
        toast({
          title: "Update Available",
          description: "A new version is ready. Refresh the page when you're ready to update (Ctrl+R or F5)."
        });
        
        // Optionally, add a keyboard shortcut listener for easy reload
        const handleKeyPress = (e: KeyboardEvent) => {
          // Allow Ctrl+Shift+R for hard reload when update is available
          if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            window.location.reload();
          }
        };
        
        document.addEventListener('keydown', handleKeyPress);
        cleanupRef.current.push(() => document.removeEventListener('keydown', handleKeyPress));
      };
      window.addEventListener('sw-update-available', updateEventHandler);
      cleanupRef.current.push(() => window.removeEventListener('sw-update-available', updateEventHandler));

      // Add app install prompt handler
      let deferredPrompt: BeforeInstallPromptEvent | null = null;
      const beforeInstallHandler = (e: Event) => {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
        
        // Show custom install prompt after a delay
        const timeoutId = setTimeout(() => {
          if (deferredPrompt) {
            showInstallPrompt(deferredPrompt);
          }
        }, 60000); // Show after 1 minute
        cleanupRef.current.push(() => clearTimeout(timeoutId));
      };
      window.addEventListener('beforeinstallprompt', beforeInstallHandler);
      cleanupRef.current.push(() => window.removeEventListener('beforeinstallprompt', beforeInstallHandler));

      // Handle successful installation
      const installedHandler = () => {
        console.log('PWA installed successfully');
        toast({
          title: "App installed!",
          description: "You can now use the app offline",
        });
      };
      window.addEventListener('appinstalled', installedHandler);
      cleanupRef.current.push(() => window.removeEventListener('appinstalled', installedHandler));

    } catch (error) {
      console.error('Failed to initialize PWA features:', error);
    }
  }, [toast, showInstallPrompt]);

  useEffect(() => {
    // Initialize PWA features
    initializePWA();

    // Cleanup function
    return () => {
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, [initializePWA]);

  return <>{children}</>;
}