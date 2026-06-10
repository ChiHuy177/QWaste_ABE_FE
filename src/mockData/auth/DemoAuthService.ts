'use client';

import {
    DEMO_AUTH_ACCOUNTS,
    DEMO_AUTH_COOKIE_NAME,
    DEMO_AUTH_STORAGE_KEY,
} from './accounts';
import type { UserProfile } from '@/types/User';

const DEMO_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const cloneProfile = (profile: UserProfile): UserProfile => ({
    ...profile,
    roles: [...profile.roles],
    preferences: { ...profile.preferences },
    permissions: profile.permissions?.map((permission) => ({ ...permission })),
    accessibleFactories: profile.accessibleFactories?.map((factory) => ({ ...factory })),
});

const setDemoCookie = (userId: string) => {
    document.cookie = `${DEMO_AUTH_COOKIE_NAME}=demo-${userId}; Path=/; Max-Age=${DEMO_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

const clearDemoCookie = () => {
    document.cookie = `${DEMO_AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
};

export class DemoAuthService {
    static getDemoAccounts() {
        return DEMO_AUTH_ACCOUNTS;
    }

    static login(account: string, password: string): UserProfile {
        const normalizedAccount = account.trim().toLowerCase();
        const demoAccount = DEMO_AUTH_ACCOUNTS.find(
            (item) =>
                (item.username.toLowerCase() === normalizedAccount ||
                    item.email.toLowerCase() === normalizedAccount) &&
                item.password === password
        );

        if (!demoAccount) {
            throw new Error('Sai tai khoan hoac mat khau demo.');
        }

        localStorage.setItem(DEMO_AUTH_STORAGE_KEY, demoAccount.profile.userId);
        setDemoCookie(demoAccount.profile.userId);

        return cloneProfile(demoAccount.profile);
    }

    static getCurrentUser(): UserProfile | null {
        const currentUserId = localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
        if (!currentUserId) return null;

        const demoAccount = DEMO_AUTH_ACCOUNTS.find(
            (item) => item.profile.userId === currentUserId
        );

        if (!demoAccount) {
            this.logout();
            return null;
        }

        setDemoCookie(demoAccount.profile.userId);
        return cloneProfile(demoAccount.profile);
    }

    static logout() {
        localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
        clearDemoCookie();
    }
}
