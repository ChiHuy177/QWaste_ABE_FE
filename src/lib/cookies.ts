export const LANGUAGE_COOKIE_NAME = 'NEXT_LOCALE';

export const getCookie = (name: string): string | null => {
    if (typeof window === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }

    return null;
};

export const setCookie = (name: string, value: string, days: number = 365) => {
    if (typeof window === 'undefined') return;

    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;

    document.cookie = `${name}=${value};${expires};path=/`;
};

export const getLanguageFromCookie = (): string | null => {
    return getCookie(LANGUAGE_COOKIE_NAME);
};

export const setLanguageToCookie = (language: string) => {
    setCookie(LANGUAGE_COOKIE_NAME, language);
};
