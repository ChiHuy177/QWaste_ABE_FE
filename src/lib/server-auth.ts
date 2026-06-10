export const BFF_ACCESS_TOKEN_COOKIE = 'bff_access_token';

const isCookieSecure = process.env.BFF_COOKIE_SECURE === 'true';

export const BFF_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isCookieSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60, // 1 hour
};

export const AUTH_PATHS = {
    LOGIN: 'api/authentication/v1/login',
    REFRESH: 'api/authentication/v1/refresh',
    LOGOUT: 'api/authentication/v1/logout',
};
