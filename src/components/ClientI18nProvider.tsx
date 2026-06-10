'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { getLanguageFromCookie, setLanguageToCookie } from '@/lib/cookies';
import i18n from '../../i18n';

const DEFAULT_LANGUAGE = 'vi';
type Lng = 'vi' | 'en' | 'ch';

interface ClientI18nProviderProps {
    children: React.ReactNode;
    initialLanguage?: Lng; // Language from server-side cookie
}

export default function ClientI18nProvider({ children, initialLanguage }: ClientI18nProviderProps) {
    // Initialize i18n with server-provided language to avoid hydration mismatch
    useEffect(() => {
        // Use server-provided language if available, otherwise read from cookie
        const targetLanguage = initialLanguage || getLanguageFromCookie() || DEFAULT_LANGUAGE;

        // Only change language if it's different from current
        if (i18n.language !== targetLanguage) {
            i18n.changeLanguage(targetLanguage);
        }

        // Ensure cookie is set (in case it wasn't set on server)
        if (!getLanguageFromCookie()) {
            setLanguageToCookie(targetLanguage);
        }
    }, [initialLanguage]);

    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
