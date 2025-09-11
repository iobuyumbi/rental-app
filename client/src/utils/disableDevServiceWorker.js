/**
 * This utility helps unregister any existing service workers in development mode
 * to prevent conflicts with Vite's HMR WebSocket connections
 */

export const disableDevServiceWorker = async () => {
  if (process.env.NODE_ENV !== 'production' && 'serviceWorker' in navigator) {
    try {
      // Get all service worker registrations and unregister them
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Development service worker unregistered to prevent HMR conflicts');
      }
      
      // Clear caches that might have been created
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Development caches cleared');
      }
      
      return true;
    } catch (error) {
      console.error('Error unregistering development service worker:', error);
      return false;
    }
  }
  return false;
};