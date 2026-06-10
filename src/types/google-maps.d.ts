// Type declarations for Google Maps JavaScript API
// This file provides TypeScript support for Google Maps without installing @types/google.maps

declare global {
    interface Window {
        google: typeof google;
    }

    namespace google {
        namespace maps {
            class LatLng {
                constructor(lat: number, lng: number);
                lat(): number;
                lng(): number;
            }

            namespace places {
                class Autocomplete {
                    constructor(
                        input: HTMLInputElement,
                        opts?: AutocompleteOptions
                    );
                    addListener(
                        eventName: string,
                        handler: () => void
                    ): void;
                    getPlace(): PlaceResult;
                }

                interface AutocompleteOptions {
                    componentRestrictions?: {
                        country: string | string[];
                    };
                    fields?: string[];
                    types?: string[];
                }

                interface PlaceResult {
                    formatted_address?: string;
                    geometry?: {
                        location: LatLng;
                    };
                }
            }

            namespace event {
                function clearInstanceListeners(instance: any): void;
            }
        }
    }

    const google: typeof google;
}

export { };
