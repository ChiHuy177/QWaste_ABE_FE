import { ApiResponse } from '@/types/ApiResponse';
import apiClient from './apiClient';

interface RequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    data?: any;
    headers?: any;
    cancelToken?: string;
}

const pendingRequests = new Map<string, AbortController>();

export class NetworkService {
    static async requestJson<T = any>(opts: RequestOptions): Promise<ApiResponse<T>> {
        const { method, url, data, headers, cancelToken } = opts;

        let abortSignal;

        if (cancelToken) {
            if (pendingRequests.has(cancelToken)) {
                pendingRequests.get(cancelToken)?.abort();
            }
            const controller = new AbortController();
            pendingRequests.set(cancelToken, controller);
            abortSignal = controller.signal;
        }

        const config: any = {
            method,
            url,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=UTF-8',
                ...headers,
            },
            signal: abortSignal,
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

    static async requestBlob(opts: RequestOptions): Promise<Blob> {
        const { method, url, data, headers, cancelToken } = opts;

        let abortSignal;

        if (cancelToken) {
            if (pendingRequests.has(cancelToken)) {
                pendingRequests.get(cancelToken)?.abort();
            }
            const controller = new AbortController();
            pendingRequests.set(cancelToken, controller);
            abortSignal = controller.signal;
        }

        const config: any = {
            method,
            url,
            headers: {
                Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ...headers,
            },
            responseType: 'blob',
            signal: abortSignal,
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
}
