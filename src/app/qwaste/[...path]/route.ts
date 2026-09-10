import { NextRequest, NextResponse } from 'next/server';
import { BFF_ACCESS_TOKEN_COOKIE, BFF_COOKIE_OPTIONS, AUTH_PATHS } from '@/lib/server-auth';
import {
    BffConfigError,
    BffError,
    BffNetworkError,
    BffUnexpectedError,
    normalizeErrorBody,
    toBffErrorBody,
} from '@/lib/bff-error';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Backend dev/nội bộ thường dùng HTTPS với cert tự ký (self-signed) — Node fetch mặc định
// reject cert đó (SELF_SIGNED_CERT_IN_CHAIN). Chỉ bỏ qua verify ở môi trường dev, không bao
// giờ áp dụng ở production.
if (process.env.NODE_ENV !== 'production' && BACKEND_URL.startsWith('https:')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

type BackendResponseBody = {
    code?: number;
    message?: string;
    error?: string;
    errors?: unknown;
    result?: {
        tokens?: { accessToken?: string };
        message?: string;
        errors?: unknown;
    };
};

// Xoá cookie access token phía BFF — đây là cookie do proxy tự set ra, việc
// dọn nó không phụ thuộc backend logout trả về ok hay lỗi (token đã invalid
// là lý do gọi logout, nên logout call rất hay tự 401 — vẫn phải xoá).
function clearAccessTokenCookie(response: NextResponse) {
    const cookieString = `${BFF_ACCESS_TOKEN_COOKIE}=; HttpOnly; Path=/; Max-Age=0`;
    response.headers.append('Set-Cookie', cookieString);
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

async function handleProxy(request: NextRequest, pathSegments: string[]) {
    const path = pathSegments.join('/');

    let backendUrl: URL;
    try {
        backendUrl = new URL(`/${path}`, BACKEND_URL);
    } catch {
        // NEXT_PUBLIC_API_BASE_URL misconfigured (vd. port ngoài range 0-65535)
        throw new BffConfigError('Invalid backend URL configuration');
    }

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
                if (ct.includes('multipart/form-data') || ct.includes('application/octet-stream')) {
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
        // Backend unreachable — vẫn trả JSON theo đúng contract lỗi thay vì để Next.js render error page
        throw new BffNetworkError('Không kết nối được tới backend server');
    }

    // Parse response — BE có thể trả lỗi không phải JSON (error page mặc định, body rỗng...),
    // nếu không catch thì exception sẽ văng ra ngoài route handler và bị Next.js nuốt thành
    // 500 generic không rõ nguyên nhân, mất luôn status/message gốc từ BE.
    const rawBody = await backendRes.text();
    let data: BackendResponseBody;
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
                isSuccess: false,
                source: 'upstream',
            },
            { status: backendRes.status },
        );
    }

    // Chuẩn hoá lỗi về 1 shape cố định (code, message, errors) — backend trả lỗi
    // ở nhiều shape khác nhau tuỳ endpoint, FE không nên phải tự đoán từng đường fallback
    if (!backendRes.ok) {
        console.error(
            `[Proxy] Backend error: ${method} ${backendUrl} -> ${backendRes.status}\n${JSON.stringify(data)}`,
        );

        const response = NextResponse.json(normalizeErrorBody(data, backendRes.status), {
            status: backendRes.status,
        });

        const setCookies = backendRes.headers.getSetCookie();
        for (const cookie of setCookies) {
            response.headers.append('Set-Cookie', cookie);
        }

        if (isLogout) {
            clearAccessTokenCookie(response);
        }

        return response;
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
        clearAccessTokenCookie(response);
    }

    return response;
}

/**
 * Điểm catch tập trung duy nhất — phân biệt lỗi do chính BFF phát sinh (BffError,
 * source: 'bff') với lỗi backend trả về (đã xử lý trong handleProxy qua
 * normalizeErrorBody, source: 'upstream') hoặc bug chưa lường trước (fallback 500).
 */
async function proxyRequest(request: NextRequest, pathSegments: string[]) {
    try {
        return await handleProxy(request, pathSegments);
    } catch (error) {
        if (error instanceof BffError) {
            return NextResponse.json(toBffErrorBody(error), { status: error.httpStatus });
        }

        console.error('Unexpected BFF error:', error);
        return NextResponse.json(toBffErrorBody(new BffUnexpectedError('Unexpected BFF error')), {
            status: 500,
        });
    }
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
