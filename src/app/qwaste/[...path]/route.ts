import { NextRequest, NextResponse } from 'next/server';
import { BFF_ACCESS_TOKEN_COOKIE, BFF_COOKIE_OPTIONS, AUTH_PATHS } from '@/lib/server-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Backend dev/nội bộ thường dùng HTTPS với cert tự ký (self-signed) — Node fetch mặc định
// reject cert đó (SELF_SIGNED_CERT_IN_CHAIN). Chỉ bỏ qua verify ở môi trường dev, không bao
// giờ áp dụng ở production.
if (process.env.NODE_ENV !== 'production' && BACKEND_URL.startsWith('https:')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

/**
 * BFF Proxy — Tất cả API call đi qua đây.
 *
 * Flow:
 *   Client → /qwaste/{path} → Proxy đọc httpOnly cookie → Gắn Authorization → Backend
 *
 * Cách dùng:
 *   Đổi apiClient.ts baseURL từ process.env.NEXT_PUBLIC_API_BASE_URL thành '/qwaste'
 *   Bỏ request interceptor gắn Authorization header (proxy xử lý)
 *
 * Ví dụ:
 *   Client gọi: /qwaste/api/users/v1/me
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
    let body: BodyInit | undefined;

    if (method !== 'GET' && method !== 'HEAD') {
        if (isLogout && accessToken) {
            // Backend logout cần token trong body
            body = JSON.stringify({ token: accessToken });
            headers['Content-Type'] = 'application/json';
        } else {
            try {
                const ct = request.headers.get('content-type') || '';
                if (
                    ct.includes('multipart/form-data') ||
                    ct.includes('application/octet-stream')
                ) {
                    body = await request.arrayBuffer();
                } else {
                    body = await request.text();
                }
            } catch {
                // No body
            }
        }
    }

    // Forward request tới backend
    let backendRes: Response;
    try {
        backendRes = await fetch(backendUrl.toString(), {
            method,
            headers,
            body,
        });
    } catch (error) {
        console.error(`[Proxy] Không kết nối được backend: ${method} ${backendUrl}`, error);
        return NextResponse.json(
            { code: 502, message: 'Không kết nối được tới backend server', error: String(error) },
            { status: 502 },
        );
    }

    // Parse response — BE có thể trả lỗi không phải JSON (error page mặc định, body rỗng...),
    // nếu không catch thì exception sẽ văng ra ngoài route handler và bị Next.js nuốt thành
    // 500 generic không rõ nguyên nhân, mất luôn status/message gốc từ BE.
    const rawBody = await backendRes.text();
    let data: { code?: number; result?: { tokens?: { accessToken?: string } } };
    try {
        data = rawBody ? JSON.parse(rawBody) : {};
    } catch {
        console.error(
            `[Proxy] Backend trả về non-JSON body: ${method} ${backendUrl} -> ${backendRes.status}\n${rawBody.slice(0, 2000)}`,
        );
        return NextResponse.json(
            {
                code: backendRes.status,
                message: 'Backend trả về response không phải JSON',
                rawBody: rawBody.slice(0, 2000),
            },
            { status: backendRes.status },
        );
    }

    if (!backendRes.ok) {
        console.error(
            `[Proxy] Backend error: ${method} ${backendUrl} -> ${backendRes.status}\n${JSON.stringify(data)}`,
        );
    }

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
