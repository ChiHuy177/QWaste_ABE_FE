import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/admin', '/qc'];
const AUTH_COOKIE_NAME = 'bff_access_token';
const LOGIN_ROUTE = '/login';
const LEGACY_FACTORY_OVERVIEW_ROUTE = '/admin/factory-overview';
const SPACE_MONITORING_ROUTE = '/admin/space-monitoring';
const DEFAULT_LOCALE = 'vi';
const SUPPORTED_LOCALES = ['vi', 'en', 'ch'];
const COOKIE_NAME = 'NEXT_LOCALE';

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const locale = request.cookies.get(COOKIE_NAME)?.value;
    const shouldSetDefaultLocale = !locale || !SUPPORTED_LOCALES.includes(locale);
    const withDefaultLocale = (response: NextResponse) => {
        if (shouldSetDefaultLocale) {
            response.cookies.set(COOKIE_NAME, DEFAULT_LOCALE, {
                path: '/',
                maxAge: 365 * 24 * 60 * 60,
            });
        }

        return response;
    };

    if (
        pathname === LEGACY_FACTORY_OVERVIEW_ROUTE ||
        pathname.startsWith(`${LEGACY_FACTORY_OVERVIEW_ROUTE}/`)
    ) {
        const redirectUrl = new URL(request.nextUrl);
        redirectUrl.pathname = pathname.replace(
            LEGACY_FACTORY_OVERVIEW_ROUTE,
            SPACE_MONITORING_ROUTE
        );
        return withDefaultLocale(NextResponse.redirect(redirectUrl));
    }

    // Home page redirection
    if (pathname === '/') {
        const isAuthCookie = request.cookies.get(AUTH_COOKIE_NAME);
        if (isAuthCookie) {
            return withDefaultLocale(
                NextResponse.redirect(new URL(SPACE_MONITORING_ROUTE, request.url))
            );
        }
        return withDefaultLocale(NextResponse.redirect(new URL(LOGIN_ROUTE, request.url)));
    }

    if (pathname === '/admin') {
        const isAuthCookie = request.cookies.get(AUTH_COOKIE_NAME);
        if (isAuthCookie) {
            return withDefaultLocale(
                NextResponse.redirect(new URL(SPACE_MONITORING_ROUTE, request.url))
            );
        }
    }

    const isProtectedRoute = PROTECTED_ROUTES.find((route) => pathname.startsWith(route));

    if (isProtectedRoute) {
        const isAuthCookie = request.cookies.get(AUTH_COOKIE_NAME);

        if (!isAuthCookie) {
            const loginUrl = new URL(LOGIN_ROUTE, request.url);
            if (pathname !== '/admin') {
                loginUrl.searchParams.set('returnUrl', pathname);
            } else {
                loginUrl.searchParams.set('logout', 'true');
            }
            return withDefaultLocale(NextResponse.redirect(loginUrl));
        }
    }

    return withDefaultLocale(NextResponse.next());
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
