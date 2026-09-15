import type { AxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types/ApiResponse';
import apiClient from './apiClient';

/** apiClient's response interceptor doesn't currently read this flag off the
 * request config (see apiClient.ts) — kept as-is, not part of this cleanup. */
interface RequestConfig extends AxiosRequestConfig {
    skipAuthHandling?: boolean;
}

interface RequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    data?: unknown;
    headers?: AxiosRequestConfig['headers'];
    cancelToken?: string;
    skipAuthHandling?: boolean;
}

interface FormDataRequestOptions {
    method: 'POST' | 'PUT' | 'PATCH';
    url: string;
    data: FormData;
    cancelToken?: string;
    skipAuthHandling?: boolean;
}

const pendingRequests = new Map<string, AbortController>();

export interface DownloadResult {
    blob: Blob;
    fileName: string | null;
}

const parseFileNameFromContentDisposition = (contentDisposition?: string): string | null => {
    if (!contentDisposition) return null;

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match) {
        try {
            return decodeURIComponent(utf8Match[1].trim());
        } catch {
            // fall through to plain filename
        }
    }

    const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    return plainMatch ? plainMatch[1].trim() : null;
};

export class NetworkService {
    static async requestJson<T = unknown>(opts: RequestOptions): Promise<ApiResponse<T>> {
        const { method, url, data, headers, cancelToken, skipAuthHandling } = opts;

        let abortSignal;

        if (cancelToken) {
            if (pendingRequests.has(cancelToken)) {
                pendingRequests.get(cancelToken)?.abort();
            }
            const controller = new AbortController();
            pendingRequests.set(cancelToken, controller);
            abortSignal = controller.signal;
        }

        const config: RequestConfig = {
            method,
            url,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...headers,
            },
            signal: abortSignal,
            skipAuthHandling,
        };

        if (method === 'GET' || method === 'DELETE') {
            config.params = data;
        } else {
            config.data = data || {};
        }

        try {
            const response = await apiClient(config);
            return response.data;
        } finally {
            if (cancelToken) {
                pendingRequests.delete(cancelToken);
            }
        }
    }

    static async requestFormData<T = unknown>(opts: FormDataRequestOptions): Promise<ApiResponse<T>> {
        const { method, url, data, cancelToken, skipAuthHandling } = opts;

        let abortSignal;

        if (cancelToken) {
            if (pendingRequests.has(cancelToken)) {
                pendingRequests.get(cancelToken)?.abort();
            }
            const controller = new AbortController();
            pendingRequests.set(cancelToken, controller);
            abortSignal = controller.signal;
        }

        const config: RequestConfig = {
            method,
            url,
            // Không set Content-Type — axios tự gắn multipart/form-data + boundary
            headers: { Accept: 'application/json' },
            data,
            signal: abortSignal,
            skipAuthHandling,
        };

        try {
            const response = await apiClient(config);
            return response.data;
        } finally {
            if (cancelToken) {
                pendingRequests.delete(cancelToken);
            }
        }
    }

    static async requestBlob(opts: RequestOptions): Promise<Blob> {
        const { blob } = await NetworkService.requestDownload(opts);
        return blob;
    }

    static async requestDownload(opts: RequestOptions): Promise<DownloadResult> {
        const { method, url, data, headers, cancelToken, skipAuthHandling } = opts;

        let abortSignal;

        if (cancelToken) {
            if (pendingRequests.has(cancelToken)) {
                pendingRequests.get(cancelToken)?.abort();
            }
            const controller = new AbortController();
            pendingRequests.set(cancelToken, controller);
            abortSignal = controller.signal;
        }

        const config: RequestConfig = {
            method,
            url,
            headers: {
                // Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ...headers,
            },
            responseType: 'blob',
            signal: abortSignal,
            skipAuthHandling,
        };

        if (method === 'GET' || method === 'DELETE') {
            config.params = data;
        } else {
            config.data = data || {};
        }

        try {
            const response = await apiClient(config);
            return {
                blob: response.data,
                fileName: parseFileNameFromContentDisposition(
                    response.headers?.['content-disposition']
                ),
            };
        } finally {
            if (cancelToken) {
                pendingRequests.delete(cancelToken);
            }
        }
    }
}
