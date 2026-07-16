'use client';

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

export const REFRESH_TOKEN_URL = '/api/authentication/v1/refresh';

const apiClient: AxiosInstance = axios.create({
    baseURL: '/qwaste',
    timeout: 30000,
    withCredentials: true,
});


let isRefreshing = false;
let failedQueue: {
    resolve: () => void;
    reject: (error?: any) => void;
}[] = [];

const processQueue = (error: any) => {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        if (!error.response || !originalRequest) {
            return Promise.reject(error);
        }

        const is401 = error.response.status === 401;
        const is403 = error.response.status === 403;
        const isRefreshCall = (originalRequest?.url as string)?.includes(REFRESH_TOKEN_URL);
        const isMeCall = (originalRequest?.url as string)?.includes('/api/users/v1/me');

        if (is401 && !isRefreshCall && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: () => resolve(apiClient(originalRequest)),
                        reject: (err: any) => reject(err),
                    });
                });
            }

            isRefreshing = true;

            try {
                await apiClient.post(REFRESH_TOKEN_URL);
                // Proxy đã cập nhật httpOnly cookie — chỉ cần retry
                processQueue(null);
                return apiClient(originalRequest);
            } catch (refreshErr: any) {
                const status = refreshErr.response?.status;
                const errorMessage = refreshErr.response?.data?.message || refreshErr.message;

                if (status === 417) {
                    console.error('[AUTH] Refresh token invalid (417):', errorMessage);
                } else {
                    console.error('[AUTH] Refresh failed (status=' + status + '):', errorMessage);
                }

                processQueue(refreshErr);

                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('sessionExpired'));
                }

                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        if (is403 && !isMeCall && !isRefreshCall) {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(
                    new CustomEvent('forbidden_access', {
                        detail: error.response?.data || 'Permission denied',
                    })
                );
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
