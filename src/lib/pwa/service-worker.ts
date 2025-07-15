export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;

  async register(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');

        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                this.notifyUpdateAvailable();
              }
            });
          }
        });

        // Check for updates periodically
        setInterval(() => {
          this.registration?.update();
        }, 60 * 60 * 1000); // Check every hour
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = null;
    }
  }

  private notifyUpdateAvailable(): void {
    // You can dispatch a custom event or use a state management solution
    // to notify the UI about the update
    const event = new CustomEvent('sw-update-available');
    window.dispatchEvent(event);
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async scheduleNotification(title: string, options: NotificationOptions): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    const permission = await this.requestNotificationPermission();
    if (!permission) {
      throw new Error('Notification permission denied');
    }

    await this.registration.showNotification(title, options);
  }

  async syncOfflineData(): Promise<void> {
    if (!this.registration || !('sync' in this.registration)) {
      console.log('Background sync not supported');
      return;
    }

    try {
      // Type assertion for sync API
      const syncManager = (this.registration as any).sync;
      if (syncManager && syncManager.register) {
        await syncManager.register('sync-meals');
        console.log('Background sync registered');
      }
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
}

// Singleton instance
export const swManager = new ServiceWorkerManager();