'use client';

import { useError } from '@/contexts/ErrorContext';
import { useEffect } from 'react';

export function Error403Overlay() {
    const { error403, clearError403 } = useError();

    // Auto-clear error when navigating away
    useEffect(() => {
        if (error403) {
            const handleRouteChange = () => {
                clearError403();
            };

            // Listen for route changes
            window.addEventListener('popstate', handleRouteChange);
            return () => {
                window.removeEventListener('popstate', handleRouteChange);
            };
        }
    }, [error403, clearError403]);

    if (!error403) return null;

    // Full-page overlay with simple text
    // TODO: Replace with image later
    return (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
            <h1 className="text-4xl font-bold text-foreground">KHÔNG CÓ QUYỀN 1</h1>
        </div>
    );
}
