import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import viCommon from './src/locales/vi/common.json';
import enCommon from './src/locales/en/common.json';
import chCommon from './src/locales/ch/common.json';
import { getLanguageFromCookie, setLanguageToCookie } from '@/lib/cookies';

const resources = {
    vi: { common: viCommon },
    en: { common: enCommon },
    ch: { common: chCommon },
} as const;

const DEFAULT_LANGUAGE = 'vi';
const SUPPORTED_LANGUAGES = ['vi', 'en', 'ch'];

const getInitialLanguage = (): string => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

    const savedLanguage = getLanguageFromCookie();

    if (!savedLanguage) {
        setLanguageToCookie(DEFAULT_LANGUAGE);
        return DEFAULT_LANGUAGE;
    }

    if (SUPPORTED_LANGUAGES.includes(savedLanguage)) {
        return savedLanguage;
    }

    setLanguageToCookie(DEFAULT_LANGUAGE);
    return DEFAULT_LANGUAGE;
};

const initialLanguage = getInitialLanguage();

if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
        resources,
        lng: initialLanguage,
        fallbackLng: DEFAULT_LANGUAGE,
        interpolation: { escapeValue: false },
        defaultNS: 'common',
        ns: ['common'],
        supportedLngs: SUPPORTED_LANGUAGES,
    });
}

i18n.on('languageChanged', (lng) => {
    if (typeof window !== 'undefined' && SUPPORTED_LANGUAGES.includes(lng)) {
        setLanguageToCookie(lng);
    }
});

export default i18n;
