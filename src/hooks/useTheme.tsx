'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { getAccountSettings } from '@/src/hooks/useAuth';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark'; // The actual theme being applied
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

export function ThemeProvider({
    children,
    defaultTheme = 'light',
    storageKey = 'theme',
}: ThemeProviderProps) {
    // Get initial theme from document (already set by inline script)
    const getInitialTheme = (): Theme => {
        if (typeof window === 'undefined') return defaultTheme;
        const stored = localStorage.getItem(storageKey) as Theme;
        return stored && ['light', 'dark', 'system'].includes(stored) ? stored : defaultTheme;
    };

    const getInitialResolvedTheme = (): 'light' | 'dark' => {
        if (typeof window === 'undefined') {
            return defaultTheme === 'dark' ? 'dark' : 'light';
        }
        // Read from document class that was set by inline script
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    };

    const [theme, setThemeState] = useState<Theme>(getInitialTheme);
    const [mounted, setMounted] = useState(false);
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(getInitialResolvedTheme);

    // Mark as mounted after first render
    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle system theme changes
    useEffect(() => {
        if (!mounted || typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleSystemThemeChange = () => {
            if (theme === 'system') {
                const systemTheme = mediaQuery.matches ? 'dark' : 'light';
                setResolvedTheme(systemTheme);
                applyThemeToDocument(systemTheme);
            }
        };

        // Initial check
        handleSystemThemeChange();

        // Listen for system theme changes
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }, [theme, mounted]);

    // Apply theme when it changes (only after mount)
    useEffect(() => {
        if (!mounted || typeof window === 'undefined') return;

        let actualTheme: 'light' | 'dark';

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            actualTheme = systemTheme;
        } else {
            actualTheme = theme;
        }

        setResolvedTheme(actualTheme);
        applyThemeToDocument(actualTheme);
    }, [theme, mounted]);

    const applyThemeToDocument = (actualTheme: 'light' | 'dark') => {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;

        // Remove existing theme classes
        root.classList.remove('light', 'dark');

        // Add new theme class
        root.classList.add(actualTheme);

        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', actualTheme === 'dark' ? '#0f0f23' : '#ffffff');
        }
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);

        if (typeof window !== 'undefined') {
            // Update localStorage
            localStorage.setItem(storageKey, newTheme);

            // Update account theme cookie for persistence across sessions
            // Note: This will be properly synced when user updates preferences via settings
            const maxAge = 365 * 24 * 60 * 60; // 1 year
            document.cookie = `accountTheme=${newTheme}; path=/; max-age=${maxAge}; SameSite=Strict`;
        }
    };

    const value: ThemeContextType = {
        theme,
        setTheme,
        resolvedTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
