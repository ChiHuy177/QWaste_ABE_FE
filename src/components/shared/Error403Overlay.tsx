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
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>KHÔNG CÓ QUYỀN</h1>
        </div>
    );
}
