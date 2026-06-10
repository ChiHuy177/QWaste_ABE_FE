import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/admin', '/operator', '/qc'];
const AUTH_COOKIE_NAME = 'bff_access_token';
const LOGIN_ROUTE = '/login';
const DEFAULT_LOCALE = 'vi';
const SUPPORTED_LOCALES = ['vi', 'en', 'ch'];
const COOKIE_NAME = 'NEXT_LOCALE';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const locale = request.cookies.get(COOKIE_NAME)?.value;

    if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
        const response = NextResponse.next();
        response.cookies.set(COOKIE_NAME, DEFAULT_LOCALE, {
            path: '/',
            maxAge: 365 * 24 * 60 * 60,
        });
        return response;
    }

    // Home page redirection
    if (pathname === '/') {
        const isAuthCookie = request.cookies.get(AUTH_COOKIE_NAME);``
        if (isAuthCookie) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.next();
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
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
