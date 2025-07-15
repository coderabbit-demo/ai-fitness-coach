'use client';

import { useEffect } from 'react';
import { swManager } from '@/lib/pwa/service-worker';
import { syncService } from '@/lib/pwa/sync-service';
import { offlineStorage } from '@/lib/pwa/offline-storage';
import { useToast } from '@/hooks/use-toast';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const { toast } = useToast();

  useEffect(() => {
    // Initialize PWA features
    initializePWA();
  }, []);

  const initializePWA = async () => {
    try {
      // Initialize offline storage
      await offlineStorage.init();
      console.log('Offline storage initialized');

      // Register service worker
      if ('serviceWorker' in navigator) {
        await swManager.register();
        console.log('Service worker registered');
      }

      // Start auto-sync
      syncService.startAutoSync();
      console.log('Auto-sync started');

      // Listen for app update events
      window.addEventListener('sw-update-available', () => {
        toast({
          title: "Update available",
          description: "A new version is available. Reload to update."
        });
        // Auto-reload after 5 seconds
        setTimeout(() => window.location.reload(), 5000);
      });

      // Add app install prompt handler
      let deferredPrompt: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show custom install prompt after a delay
        setTimeout(() => {
          if (deferredPrompt) {
            showInstallPrompt(deferredPrompt);
          }
        }, 60000); // Show after 1 minute
      });

      // Handle successful installation
      window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        toast({
          title: "App installed!",
          description: "You can now use the app offline",
        });
      });

    } catch (error) {
      console.error('Failed to initialize PWA features:', error);
    }
  };

  const showInstallPrompt = (prompt: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    toast({
      title: "Install app?",
      description: "Add to home screen for quick access and offline use"
    });
    // Auto-prompt install after 2 seconds
    setTimeout(async () => {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        console.log(`Install prompt outcome: ${outcome}`);
      } catch (error) {
        console.error('Install prompt error:', error);
      }
    }, 2000);
  };

  return <>{children}</>;
}