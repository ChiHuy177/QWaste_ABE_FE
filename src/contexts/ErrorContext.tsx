'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface Error403Details {
    message?: string;
    resource?: string;
    action?: string;
    statusCode: number;
    endpoint?: string;
    source?: 'client' | 'server';
}

declare global {
    interface Window {
        __handle403Error?: (error: Error403Details) => void;
    }
}

interface ErrorContextType {
    error403: Error403Details | null;
    setError403: (error: Error403Details) => void;
    setError403FromPermission: (resource: string, action: string) => void;
    clearError403: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
    children: ReactNode;
}

export const ErrorProvider = ({ children }: ErrorProviderProps) => {
    const [error403, setError403State] = useState<Error403Details | null>(null);

    const setError403 = (error: Error403Details) => {
        console.log('[ERROR CONTEXT] Setting 403 error:', error);
        setError403State(error);
    };

    const setError403FromPermission = (resource: string, action: string) => {
        console.log('[ERROR CONTEXT] Setting 403 from CASL permission check:', { resource, action });
        setError403State({
            message: `You don't have permission to ${action} ${resource}`,
            resource,
            action,
            statusCode: 403,
            source: 'client',
        });
    };

    const clearError403 = () => {
        console.log('[ERROR CONTEXT] Clearing 403 error');
        setError403State(null);
    };

    // Register global error handler for apiClient
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__handle403Error = setError403;
            console.log('[ERROR CONTEXT] Registered global 403 error handler');

            return () => {
                delete window.__handle403Error;
            };
        }
    }, []);

    const value: ErrorContextType = {
        error403,
        setError403,
        setError403FromPermission,
        clearError403,
    };

    return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

export const useError = (): ErrorContextType => {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useError must be used within ErrorProvider');
    }
    return context;
};
