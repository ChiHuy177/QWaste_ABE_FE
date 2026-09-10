import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/admin', '/qc'];
const AUTH_COOKIE_NAME = 'bff_access_token';
const LOGIN_ROUTE = '/login';
const LEGACY_FACTORY_OVERVIEW_ROUTE = '/admin/factory-overview';
const SPACE_MONITORING_ROUTE = '/admin/space-monitoring';
const DEFAULT_LOCALE = 'vi';
const SUPPORTED_LOCALES = ['vi', 'en', 'ch'];
const COOKIE_NAME = 'NEXT_LOCALE';

function generateNonce() {
    return Buffer.from(crypto.randomUUID()).toString('base64');
}

// REST calls all go through the same-origin BFF proxy (see apiClient.ts baseURL
// '/qwaste' + src/app/qwaste/[...path]/route.ts), so they're covered by 'self' —
// no need to whitelist the real backend origin for them.
// WebSocket is the one exception: WebSocketContext.tsx connects to the backend
// directly, bypassing the proxy, so its origin must be derived here. SockJS
// (used by WebSocketService) also needs the plain http(s) origin alongside
// ws(s): before it opens the real WebSocket it first does an XHR handshake to
// <origin>/ws/info to probe server capabilities.
function buildConnectSrc() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const origins = [
        "'self'",
        'https://maps.googleapis.com',
        'https://*.uploadthing.com',
        'https://*.utfs.io',
    ];

    if (apiBaseUrl) {
        try {
            const url = new URL(apiBaseUrl);
            origins.push(url.origin);
            origins.push(`${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}`);
        } catch {
            // Invalid/unset backend URL — fall back to same-origin only.
        }
    }

    return origins.join(' ');
}

function buildCsp(isHttps: boolean) {
    // React needs eval() in dev to reconstruct server error stacks in the
    // browser; it never uses eval() in production, so this stays dev-only.
    // https://nextjs.org/docs/app/guides/content-security-policy
    const isDev = process.env.NODE_ENV === 'development';

    return [
        `default-src 'self'`,
        // TEMPORARY: 'strict-dynamic' + nonce dropped from script-src.
        // @uploadthing/react's <NextSSRPlugin> (see layout.tsx) injects an
        // inline <script> via useServerInsertedHTML with no way to attach a
        // nonce, so it was being blocked outright under the nonce/strict-dynamic
        // policy (nonce present => 'unsafe-inline' is ignored by the browser).
        // Falling back to plain 'unsafe-inline' here until that's fixed
        // upstream or the plugin usage is replaced. https://github.com/pingdotgg/uploadthing/issues
        `script-src 'self' https: 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
        // Without an explicit worker-src, browsers fall back to script-src to
        // gate Worker creation — which lacks blob:, so any library (or browser
        // extension content script) that spins up a Worker from a blob URL
        // gets silently blocked. Declare it explicitly instead of relying on
        // the fallback.
        `worker-src 'self' blob:`,
        `style-src 'self' 'unsafe-inline'`,
        `img-src 'self' data: blob: https:`,
        `font-src 'self' data:`,
        `connect-src ${buildConnectSrc()}`,
        `object-src 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
        `frame-ancestors 'self'`,
        // Only force http->https upgrades when the request actually arrived over
        // HTTPS (directly or via a TLS-terminating proxy). Forcing it on plain-HTTP
        // deployments (e.g. internal IP, no TLS) makes the browser try to re-fetch
        // every resource over HTTPS and fail with ERR_SSL_PROTOCOL_ERROR.
        isHttps ? `upgrade-insecure-requests` : '',
    ]
        .filter(Boolean)
        .join('; ');
}

// Trusts x-forwarded-proto from a TLS-terminating reverse proxy when present,
// otherwise falls back to the protocol the request actually arrived on.
function isHttpsRequest(request: NextRequest) {
    const forwardedProto = request.headers.get('x-forwarded-proto');
    if (forwardedProto) return forwardedProto.split(',')[0].trim() === 'https';
    return request.nextUrl.protocol === 'https:';
}

function withSecurityHeaders(response: NextResponse, csp?: string) {
    if (csp) response.headers.set('Content-Security-Policy', csp);
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
}

// Builds the "next" response with the nonce and CSP forwarded to the request
// so Server Components (see layout.tsx) can read the nonce via headers() and
// stamp it onto any inline <script> they render, and so Next.js itself can
// parse the CSP off the request to auto-nonce the inline scripts it
// generates internally (RSC/hydration payloads) during SSR.
// https://nextjs.org/docs/app/guides/content-security-policy#how-nonces-work-in-nextjs
function nextWithNonce(request: NextRequest, nonce: string, csp: string) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', csp);
    return NextResponse.next({ request: { headers: requestHeaders } });
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const nonce = generateNonce();
    const csp = buildCsp(isHttpsRequest(request));

    const locale = request.cookies.get(COOKIE_NAME)?.value;
    const shouldSetDefaultLocale = !locale || !SUPPORTED_LOCALES.includes(locale);
    // Redirects don't render any content, so CSP is largely moot for them — only
    // the plain security headers are worth setting. The one "let the request
    // through" response at the bottom carries the full CSP + nonce.
    const withDefaultLocale = (response: NextResponse, includeCsp = false) => {
        if (shouldSetDefaultLocale) {
            response.cookies.set(COOKIE_NAME, DEFAULT_LOCALE, {
                path: '/',
                maxAge: 365 * 24 * 60 * 60,
            });
        }

        return withSecurityHeaders(response, includeCsp ? csp : undefined);
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

    return withDefaultLocale(nextWithNonce(request, nonce, csp), true);
}

export const config = {
    matcher: ['/((?!api|qwaste|_next/static|_next/image|favicon.ico).*)'],
};
