import { NextRequest, NextResponse } from 'next/server';
import { BFF_ACCESS_TOKEN_COOKIE, BFF_COOKIE_OPTIONS, AUTH_PATHS } from '@/lib/server-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * BFF Proxy — Tất cả API call đi qua đây.
 *
 * Flow:
 *   Client → /api/bff/{path} → Proxy đọc httpOnly cookie → Gắn Authorization → Backend
 *
 * Cách dùng:
 *   Đổi apiClient.ts baseURL từ process.env.NEXT_PUBLIC_API_BASE_URL thành '/api/bff'
 *   Bỏ request interceptor gắn Authorization header (proxy xử lý)
 *
 * Ví dụ:
 *   Client gọi: /api/bff/api/users/v1/me
 *   Proxy forward: ${BACKEND_URL}/api/users/v1/me + Authorization: Bearer {token}
 */

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
    const path = pathSegments.join('/');
    const backendUrl = new URL(`/${path}`, BACKEND_URL);

    // Forward query params
    request.nextUrl.searchParams.forEach((value, key) => {
        backendUrl.searchParams.append(key, value);
    });

    // Đọc access token từ httpOnly cookie
    const accessToken = request.cookies.get(BFF_ACCESS_TOKEN_COOKIE)?.value;

    const headers: HeadersInit = {};

    const contentType = request.headers.get('content-type');
    if (contentType) {
        headers['Content-Type'] = contentType;
    }

    // Gắn Authorization — skip cho refresh endpoint (dùng refresh token cookie thay vì access token)
    if (accessToken && path !== AUTH_PATHS.REFRESH) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Forward cookies tới backend (refresh token httpOnly cookie từ backend, etc.)
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
    }

    const method = request.method;
    const isLogout = path === AUTH_PATHS.LOGOUT;
    let body: string | undefined;

    if (method !== 'GET' && method !== 'HEAD') {
        if (isLogout && accessToken) {
            // Backend logout cần token trong body
            body = JSON.stringify({ token: accessToken });
            headers['Content-Type'] = 'application/json';
        } else {
            try {
                body = await request.text();
            } catch {
                // No body
            }
        }
    }

    // Forward request tới backend
    const backendRes = await fetch(backendUrl.toString(), {
        method,
        headers,
        body,
    });

    // Parse response
    const data = await backendRes.json();

    // Xử lý auth-specific: lưu/xóa access token trong httpOnly cookie
    const isLogin = path === AUTH_PATHS.LOGIN;
    const isRefresh = path === AUTH_PATHS.REFRESH;

    let newAccessToken: string | undefined;

    if ((isLogin || isRefresh) && data.code === 200) {
        newAccessToken = data.result?.tokens?.accessToken;
        // Strip token khỏi response — client không cần thấy
        if (newAccessToken && data.result?.tokens) {
            delete data.result.tokens;
        }
    }

    const response = NextResponse.json(data, { status: backendRes.status });

    // Forward Set-Cookie từ backend (chứa refresh_token)
    const setCookies = backendRes.headers.getSetCookie();
    for (const cookie of setCookies) {
        response.headers.append('Set-Cookie', cookie);
    }

    // Set httpOnly cookie cho access token bằng raw string để tránh Next.js overwrite
    if (newAccessToken) {
        const isSecure = BFF_COOKIE_OPTIONS.secure ? 'Secure; ' : '';
        const cookieString = `${BFF_ACCESS_TOKEN_COOKIE}=${newAccessToken}; HttpOnly; ${isSecure}SameSite=${BFF_COOKIE_OPTIONS.sameSite}; Path=${BFF_COOKIE_OPTIONS.path}; Max-Age=${BFF_COOKIE_OPTIONS.maxAge}`;
        response.headers.append('Set-Cookie', cookieString);
    }

    // Logout: xóa access token cookie
    if (isLogout) {
        const cookieString = `${BFF_ACCESS_TOKEN_COOKIE}=; HttpOnly; Path=/; Max-Age=0`;
        response.headers.append('Set-Cookie', cookieString);
    }

    return response;
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    return proxyRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    return proxyRequest(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    return proxyRequest(request, path);
}
