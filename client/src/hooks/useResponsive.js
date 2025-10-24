import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook to track window dimensions and provide common responsive flags.
 * Uses Tailwind CSS default breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px).
 * @returns {Object} Current screen size and boolean flags for common device types and breakpoints.
 */
export const useResponsive = () => {
  
  // Initialize state only once using useMemo to avoid repeated calculation on every render
  const initialScreenSize = useMemo(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  }), []);

  const [screenSize, setScreenSize] = useState(initialScreenSize);

  useEffect(() => {
    // Only proceed if window object is available (client-side)
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive device type flags
  const isMobile = screenSize.width < 768;
  const isTablet = screenSize.width >= 768 && screenSize.width < 1024;
  const isDesktop = screenSize.width >= 1024;
  const isSmallMobile = screenSize.width < 480;

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    // Breakpoint helpers (useful for conditional rendering logic)
    sm: screenSize.width >= 640,
    md: screenSize.width >= 768,
    lg: screenSize.width >= 1024,
    xl: screenSize.width >= 1280,
    '2xl': screenSize.width >= 1536
  };
};

/**
 * Custom hook to listen to a specific CSS media query string.
 * @param {string} query - The media query string (e.g., '(prefers-color-scheme: dark)').
 * @returns {boolean} True if the query matches, false otherwise.
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    // Use addEventListener for modern browsers
    const listener = (event) => setMatches(event.matches);
    
    // Fallback for older browsers if necessary, though addEventListener is widely supported now
    if (media.addListener) {
        media.addListener(listener);
    } else {
        media.addEventListener('change', listener);
    }

    return () => {
        if (media.removeListener) {
            media.removeListener(listener);
        } else {
            media.removeEventListener('change', listener);
        }
    };
  }, [query]);

  return matches;
};

export default useResponsive;
