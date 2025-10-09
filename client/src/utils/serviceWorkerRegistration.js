// This file handles the service worker registration and update flow

// Note: Previously used to detect localhost; not needed currently
// Keeping here for potential future logic
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

// Register the service worker
const register = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
      
      // Check for updates to the service worker
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available; refresh the page
              console.log('New content is available; please refresh.');
              // You can show a notification to the user here
            } else {
              // Content is cached for offline use
              console.log('Content is cached for offline use.');
            }
          }
        };
      };
      
      return registration;
    } catch (error) {
      console.error('Error during service worker registration:', error);
      throw error;
    }
  }
  return null;
};

// Unregister the service worker
const unregister = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const unregistered = await registration.unregister();
      if (unregistered) {
        console.log('Service worker unregistered');
      }
    } catch (error) {
      console.error('Error unregistering service worker:', error);
      throw error;
    }
  }
};

// Check if the service worker has been updated
const checkForUpdate = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    } catch (error) {
      console.error('Error checking for service worker update:', error);
      throw error;
    }
  }
};

// Initialize the service worker
const initializeServiceWorker = async () => {
  // Only register service worker in production, not in development
  if (import.meta.env.MODE === 'production') {
    try {
      const reg = await register();
      
      // Check for updates every hour
      setInterval(checkForUpdate, 60 * 60 * 1000);
      
      // Listen for controller changes (when a new service worker takes over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
      
      return reg;
    } catch (error) {
      console.error('Failed to initialize service worker:', error);
    }
  }
  return null;
};

export { initializeServiceWorker, register, unregister, checkForUpdate };
