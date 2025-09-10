// This file handles the service worker registration and update flow

let isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
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
  if (process.env.NODE_ENV === 'production' || isLocalhost) {
    try {
      await register();
      
      // Check for updates every hour
      setInterval(checkForUpdate, 60 * 60 * 1000);
      
      // Listen for controller changes (when a new service worker takes over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
      
    } catch (error) {
      console.error('Failed to initialize service worker:', error);
    }
  }
};

export { initializeServiceWorker, register, unregister, checkForUpdate };
