'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { AuthService } from '@/services/AuthService';

const BACKEND_UNREACHABLE_MESSAGE = 'KHÔNG THỂ KẾT NỐI MÁY CHỦ. VUI LÒNG THỬ LẠI SAU';

export default function GlobalErrorHandler() {
    const router = useRouter();

    console.log('[GlobalErrorHandler] Component mounted');

    const handleSessionExpired = useCallback(async () => {
        console.log('[GlobalErrorHandler] Session expired - cleaning up and redirecting');

        // Save current URL for redirect after login
        const currentPath = window.location.pathname;
        const isProtectedRoute = currentPath.startsWith('/admin') || currentPath.startsWith('/qc');

        try {
            await AuthService.logout();
            console.log('[GlobalErrorHandler] Logout successful - cookie cleared');
        } catch (error) {
            console.error('[GlobalErrorHandler] Logout failed but continuing:', error);
        }

        toast.error('PHIÊN ĐĂNG NHẬP ĐÃ HẾT HẠN - VUI LÒNG ĐĂNG NHẬP LẠI', {
            duration: 2000,
            position: 'top-center',
            style: {
                background: '#BF5058',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
            },
        });

        // Redirect sau khi logout đã xóa cookie
        setTimeout(() => {
            const loginUrl =
                isProtectedRoute && currentPath !== '/admin'
                    ? `/login?returnUrl=${encodeURIComponent(currentPath)}`
                    : '/login?logout=true';
            console.log('[GlobalErrorHandler] Redirecting to:', loginUrl);
            console.log('[GlobalErrorHandler] currentPath:', currentPath);
            console.log('[GlobalErrorHandler] isProtectedRoute:', isProtectedRoute);
            router.push(loginUrl);
        }, 1000);
    }, [router]);

    // Backend unreachable (network/502/503...) — chỉ báo lỗi tạm thời, KHÔNG logout:
    // đây không phải phiên hết hạn, user vẫn đang đăng nhập hợp lệ.
    const handleBackendUnreachable = useCallback(() => {
        console.log('[GlobalErrorHandler] Backend unreachable - showing toast without logout');
        toast.error(BACKEND_UNREACHABLE_MESSAGE, {
            duration: 3000,
            position: 'top-center',
        });
    }, []);

    const handleForbidden = useCallback((event: Event) => {
        const customEvent = event as CustomEvent;
        const detail = customEvent.detail;

        let errorMsg = 'Bạn không có quyền thực hiện thao tác này.';
        if (typeof detail === 'string') {
            errorMsg = detail;
        } else if (detail && typeof detail === 'object') {
            errorMsg = detail.message || detail.error || errorMsg;
        }

        toast.error(errorMsg);
    }, []);

    useEffect(() => {
        window.addEventListener('sessionExpired', handleSessionExpired);
        window.addEventListener('forbidden_access', handleForbidden);
        window.addEventListener('backendUnreachable', handleBackendUnreachable);
        console.log('[GlobalErrorHandler] Event listeners added successfully');

        return () => {
            window.removeEventListener('sessionExpired', handleSessionExpired);
            window.removeEventListener('forbidden_access', handleForbidden);
            window.removeEventListener('backendUnreachable', handleBackendUnreachable);
            console.log('[GlobalErrorHandler] Event listeners removed');
        };
    }, [handleSessionExpired, handleForbidden, handleBackendUnreachable]);

    return null;
}
