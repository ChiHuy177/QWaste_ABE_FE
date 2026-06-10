// useMediaQuery.ts - A hook for responsive design in React
'use client'

import { useState, useEffect } from 'react';

/**
 * A hook that returns whether a media query matches the current viewport size
 * @param query - A valid CSS media query string
 * @returns boolean indicating if the media query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
 */
export function useMediaQuery(query: string): boolean {
  // Initial match state - will be updated after mount
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure this only runs on the client side
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Update initial state
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      
      // Define listener for changes
      const listener = () => {
        setMatches(media.matches);
      };
      
      // Add listener
      // Using addEventListener with { once: false } for better browser compatibility
      if (media.addEventListener) {
        media.addEventListener('change', listener);
      } else {
        // For older browsers that don't support addEventListener
        media.addListener(listener);
      }
      
      // Clean up
      return () => {
        if (media.removeEventListener) {
          media.removeEventListener('change', listener);
        } else {
          // For older browsers
          media.removeListener(listener);
        }
      };
    }
  }, [query]);

  return matches;
}
