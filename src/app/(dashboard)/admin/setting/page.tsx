'use client';

import { SettingsPage } from '@/app/(dashboard)/admin/setting/components/SettingPage';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { DemoUserService, USE_MOCK_USERS } from '@/mockData/admin/users';
import { UserService } from '@/services/UserService';
import { UserProfile, UserSettings } from '@/types/User';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { userSettingsActions } from '@/stores';

const activeUserService = USE_MOCK_USERS ? DemoUserService : UserService;

const buildUserSettings = (profile: UserProfile): UserSettings => ({
    accountId: profile.userId,
    status: 'active',
    id: profile.userId,
    theme: profile.preferences.theme || 'light',
    language: profile.preferences.language || 'en',
    createdTime: Date.now(),
    updatedTime: null,
});

const SettingPage = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    // Redux hooks
    const dispatch = useAppDispatch();
    const { profile, settings, isLoading, error } = useAppSelector((state) => state.userSettings);

    usePageTitle(t('pageTitle.settings'));

    // Initialize data
    useEffect(() => {
        const initializeData = async () => {
            try {
                dispatch(userSettingsActions.setLoading(true));
                dispatch(userSettingsActions.setError(null));

                const userData = user ?? (await activeUserService.getMe());

                dispatch(userSettingsActions.setProfile(userData));
                dispatch(userSettingsActions.setSettings(buildUserSettings(userData)));
            } catch {
                dispatch(userSettingsActions.setError(t('settingsPage.errors.settingsError')));
            } finally {
                dispatch(userSettingsActions.setLoading(false));
            }
        };

        initializeData();
    }, [user, dispatch, t]);

    // Profile update handler
    const handleProfileUpdate = useCallback(
        async (updates: Partial<UserProfile>) => {
            if (updates.preferences?.avatarUrl) {
                const result = await dispatch(
                    userSettingsActions.updateAvatar(updates.preferences.avatarUrl)
                );

                if (result.success) {
                    toast.success(t('avatarUpload.updateSuccess'));
                    if (!USE_MOCK_USERS) {
                        window.location.reload();
                    }
                } else {
                    toast.error(result.error || t('avatarUpload.updateError'));
                }

                return result;
            }

            toast.success(t('accountSettings.messages.updateSuccess'));
            return { success: true };
        },
        [dispatch, t]
    );

    // Settings update handler
    const handleSettingsUpdate = useCallback(
        async (updates: Partial<UserSettings>) => {
            const result = await dispatch(userSettingsActions.updateSettings(updates));

            if (result.success) {
                toast.success(t('settingsPage.success'));
            } else {
                toast.error(result.error || t('settingsPage.error'));
            }

            return result;
        },
        [dispatch, t]
    );

    // Request OTP handler
    const handleRequestOTP = useCallback(
        async (currentPassword: string) => {
            return await dispatch(userSettingsActions.requestOTP(currentPassword));
        },
        [dispatch]
    );

    // Verify OTP handler
    const handleVerifyOTP = useCallback(
        async (otpCode: string, newPassword: string, confirmPassword: string) => {
            return await dispatch(
                userSettingsActions.verifyOTP(otpCode, newPassword, confirmPassword)
            );
        },
        [dispatch]
    );

    return (
        <SettingsPage
            userProfile={profile || null}
            userSettings={settings}
            isLoading={isLoading}
            error={error}
            onProfileUpdate={handleProfileUpdate}
            onSettingsUpdate={handleSettingsUpdate}
            onRequestOTP={handleRequestOTP}
            onVerifyOTP={handleVerifyOTP}
        />
    );
};

export default SettingPage;
