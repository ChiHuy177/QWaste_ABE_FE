'use client';

import { AuthService } from '@/services/AuthService';
import { UserService } from '@/services/UserService';

import { UserProfile } from '@/types/User';
import { useRouter, usePathname } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { FullPageLoader } from '@/components/shared/FullPageLoader';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { setLanguageToCookie } from '@/lib/cookies';
import { DemoAuthService, USE_DEMO_AUTH } from '@/mockData/auth';

interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    syncUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<UserProfile | null>();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { setTheme } = useTheme();
    const { i18n } = useTranslation();

    const syncPreferences = (userProfile: UserProfile) => {
        if (!userProfile.preferences) return;

        if (userProfile.preferences.theme) {
            setTheme(userProfile.preferences.theme);
        }

        if (userProfile.preferences.language) {
            const backendLang = userProfile.preferences.language as string;
            const frontendLang = backendLang === 'vn' ? 'vi' : backendLang;

            i18n.changeLanguage(frontendLang);
            setLanguageToCookie(frontendLang);
        }
    };

    const PUBLIC_ROUTES = ['/', '/login', '/register'];
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    useEffect(() => {
        const initAuth = async () => {
            if (isPublicRoute) {
                console.log('[AUTH] Public route detected, skipping auth check');
                setUser(null);
                setIsLoading(false);
                setIsAuthenticating(false);
                return;
            }

            if (USE_DEMO_AUTH) {
                const currentUser = DemoAuthService.getCurrentUser();
                setUser(currentUser);
                if (currentUser) {
                    syncPreferences(currentUser);
                }
                setIsLoading(false);
                setIsAuthenticating(false);
                return;
            }

            try {
                const currentUser: UserProfile | null = await UserService.getMe();
                console.log('[AUTH] User verified:', currentUser);

                if (currentUser !== null) {
                    setUser(currentUser);
                    syncPreferences(currentUser);
                } else {
                    console.log('[AUTH] No user found');
                    setUser(null);
                }
            } catch (err: any) {
                if (
                    err.response?.status === 401 ||
                    err.code === 401 ||
                    err.response?.status === 403
                ) {
                    console.log(
                        '[AUTH] No valid session - apiClient will handle sessionExpired event'
                    );
                    // Không gọi logout() - apiClient đã dispatch 'sessionExpired' event
                    // GlobalErrorHandler sẽ xử lý redirect
                    setUser(null);
                } else {
                    console.error('[AUTH] Failed to fetch user profile:', err);
                    setUser(null);
                }
            } finally {
                setIsLoading(false);
                setIsAuthenticating(false);
            }
        };

        initAuth();
    }, [isPublicRoute]);

    const login = async (username: string, password: string) => {
        setError(null);

        console.log('[AUTH CONTEXT] Login attempt for:', username);
        try {
            const user = USE_DEMO_AUTH
                ? DemoAuthService.login(username, password)
                : await AuthService.login(username, password).then(() => UserService.getMe());
            console.log('[AUTH CONTEXT] User fetched:', user);
            console.log('[AUTH CONTEXT] Setting user state with roles:', user?.roles);
            setUser(user);
            if (user) {
                syncPreferences(user);
            }
            console.log('[AUTH CONTEXT] User state updated');
        } catch (err: any) {
            const errorMsg = err.message || 'Login failed';
            console.error('[AUTH CONTEXT] Login error:', errorMsg);
            setError(errorMsg);
            setUser(null);
            throw err;
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setIsAuthenticating(true);
        setError(null);
        try {
            if (USE_DEMO_AUTH) {
                DemoAuthService.logout();
            } else {
                await AuthService.logout();
            }
            setUser(null);
        } catch (err: any) {
            console.error('[AUTH CONTEXT] Logout failed:', err.message);
        } finally {
            console.log('[AUTH CONTEXT] Logout completed');
            setIsLoading(false);
            setIsAuthenticating(false);
            router.replace('/login');
        }
    };

    const syncUser = async () => {
        setError(null);

        try {
            const user = USE_DEMO_AUTH
                ? DemoAuthService.getCurrentUser()
                : await UserService.getMe();
            setUser(user);
            if (user) {
                syncPreferences(user);
            }
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to sync user';
            setError(errorMsg);
            setUser(null);
            throw err;
        }
    };

    const value: AuthContextType = {
        user: user || null,
        isLoading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        syncUser,
    };

    return (
        <>
            {isAuthenticating && <FullPageLoader message="Authenticating..." />}
            <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
        </>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
