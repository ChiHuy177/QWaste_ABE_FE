'use client';

import AppLayout from '@/components/layouts/AntdLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { hasRouteAccessWithAbility, getDefaultRoute } from '@/configs/permissions/routeAccess';
import { FullPageLoader } from '@/components/shared/FullPageLoader';
import { useAbility } from '@/contexts/AbilityContext';
import { WorkCalendarAlarmModal } from '@/components/shared/WorkCalendarAlarmModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const ability = useAbility();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        const hasAccess = hasRouteAccessWithAbility(pathname, ability);

        if (!hasAccess) {
            const defaultRoute = getDefaultRoute(ability);

            if (pathname !== defaultRoute) {
                router.replace(defaultRoute);
            }
        }
    }, [isLoading, user, pathname, router, ability]);

    if (isLoading || !user) {
        return <FullPageLoader message="Loading..." />;
    }

    return (
        <AppLayout>
            {children}
            <WorkCalendarAlarmModal />
        </AppLayout>
    );
}
