'use client';

import { AuthService } from '@/services/AuthService';
import { UserService } from '@/services/UserService';

import { UserProfile, UserSettings } from '@/types/User';
import { useRouter, usePathname } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { FullPageLoader } from '@/components/shared/FullPageLoader';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { setLanguageToCookie } from '@/lib/cookies';
import { useAppDispatch } from '@/stores/hook';
import { userSettingsActions } from '@/stores';
import { getApiErrorMessage, getErrorStatus } from '@/utils/apiError';

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

const createSettingsFromProfile = (userProfile: UserProfile): UserSettings => {
    const language = userProfile.preferences?.language as string | undefined;

    return {
        accountId: userProfile.userId,
        status: 'active',
        id: userProfile.userId,
        theme: userProfile.preferences?.theme || 'light',
        language: (language === 'vn' ? 'vi' : language || 'en') as UserSettings['language'],
        createdTime: Date.now(),
        updatedTime: null,
    };
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<UserProfile | null>();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { setTheme } = useTheme();
    const { i18n } = useTranslation();
    const dispatch = useAppDispatch();

    const hydrateUserSettings = (userProfile: UserProfile) => {
        dispatch(userSettingsActions.setProfile(userProfile));
        dispatch(userSettingsActions.setSettings(createSettingsFromProfile(userProfile)));
    };

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
                dispatch(userSettingsActions.resetUserSettings());
                setIsLoading(false);
                setIsAuthenticating(false);
                return;
            }

            try {
                const currentUser: UserProfile | null = await UserService.getMe();
                console.log('[AUTH] User verified:', currentUser);

                if (currentUser !== null) {
                    setUser(currentUser);
                    hydrateUserSettings(currentUser);
                    syncPreferences(currentUser);
                } else {
                    console.log('[AUTH] No user found');
                    setUser(null);
                    dispatch(userSettingsActions.resetUserSettings());
                }
            } catch (err: unknown) {
                const status = getErrorStatus(err);
                const errCode = (err as { code?: unknown })?.code;
                if (status === 401 || errCode === 401 || status === 403) {
                    console.log(
                        '[AUTH] No valid session - apiClient will handle sessionExpired event'
                    );
                    // Không gọi logout() - apiClient đã dispatch 'sessionExpired' event
                    // GlobalErrorHandler sẽ xử lý redirect
                    setUser(null);
                    dispatch(userSettingsActions.resetUserSettings());
                } else {
                    console.error('[AUTH] Failed to fetch user profile:', err);
                    setUser(null);
                    dispatch(userSettingsActions.resetUserSettings());
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
            await AuthService.login(username, password);
            const user = await UserService.getMe();
            console.log('[AUTH CONTEXT] User fetched:', user);
            console.log('[AUTH CONTEXT] Setting user state with roles:', user?.roles);
            setUser(user);
            if (user) {
                hydrateUserSettings(user);
                syncPreferences(user);
            }
            console.log('[AUTH CONTEXT] User state updated');
        } catch (err: unknown) {
            const errorMsg = getApiErrorMessage(err, 'Login failed');
            console.error('[AUTH CONTEXT] Login error:', errorMsg);
            setError(errorMsg);
            setUser(null);
            dispatch(userSettingsActions.resetUserSettings());
            throw err;
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setIsAuthenticating(true);
        setError(null);
        try {
            await AuthService.logout();
            setUser(null);
            dispatch(userSettingsActions.resetUserSettings());
        } catch (err: unknown) {
            console.error('[AUTH CONTEXT] Logout failed:', getApiErrorMessage(err));
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
            const user = await UserService.getMe();
            setUser(user);
            if (user) {
                hydrateUserSettings(user);
                syncPreferences(user);
            } else {
                dispatch(userSettingsActions.resetUserSettings());
            }
        } catch (err: unknown) {
            const errorMsg = getApiErrorMessage(err, 'Failed to sync user');
            setError(errorMsg);
            setUser(null);
            dispatch(userSettingsActions.resetUserSettings());
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
