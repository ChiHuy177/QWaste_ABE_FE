/**
 * Google Maps Script Loader
 * Loads Google Maps JavaScript API script dynamically
 * Uses singleton pattern to prevent multiple loads
 */

let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (): Promise<void> => {
    // If already loaded, return immediately
    if (isLoaded) {
        return Promise.resolve();
    }

    // If currently loading, return existing promise
    if (isLoading && loadPromise) {
        return loadPromise;
    }

    // Start loading
    isLoading = true;
    loadPromise = new Promise((resolve, reject) => {
        // Check if API key is available
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            console.warn('Google Maps API key not found. Address autocomplete will not work.');
            isLoading = false;
            reject(new Error('Google Maps API key not configured'));
            return;
        }

        // Check if script already exists in DOM
        const existingScript = document.querySelector(
            'script[src*="maps.googleapis.com/maps/api/js"]'
        );

        if (existingScript) {
            isLoaded = true;
            isLoading = false;
            resolve();
            return;
        }

        // Create and append script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=vi`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            isLoaded = true;
            isLoading = false;
            resolve();
        };

        script.onerror = () => {
            isLoading = false;
            loadPromise = null;
            reject(new Error('Failed to load Google Maps script'));
        };

        document.head.appendChild(script);

        // Timeout after 10 seconds
        setTimeout(() => {
            if (!isLoaded) {
                isLoading = false;
                loadPromise = null;
                reject(new Error('Google Maps script loading timeout'));
            }
        }, 10000);
    });

    return loadPromise;
};

/**
 * Check if Google Maps API is loaded
 */
export const isGoogleMapsLoaded = (): boolean => {
    return isLoaded && typeof google !== 'undefined' && typeof google.maps !== 'undefined';
};
