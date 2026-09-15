'use client';

import { SettingsPage } from '@/features/dashboard/setting';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { UserService } from '@/services/UserService';
import { UserProfile, UserSettings } from '@/types/User';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { userSettingsActions } from '@/stores';

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
            if (user) {
                dispatch(userSettingsActions.setProfile(user));

                if (user.preferences) {
                    dispatch(
                        userSettingsActions.setSettings({
                            accountId: user.userId,
                            status: 'active',
                            id: user.userId,
                            theme: user.preferences.theme || 'light',
                            language: user.preferences.language || 'en',
                            createdTime: Date.now(),
                            updatedTime: null,
                        })
                    );
                }
            } else {
                try {
                    const userData = await UserService.getMe();
                    dispatch(userSettingsActions.setProfile(userData));

                    if (userData.preferences) {
                        dispatch(
                            userSettingsActions.setSettings({
                                accountId: userData.userId,
                                status: 'active',
                                id: userData.userId,
                                theme: userData.preferences.theme || 'light',
                                language: userData.preferences.language || 'en',
                                createdTime: Date.now(),
                                updatedTime: null,
                            })
                        );
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        };

        initializeData();
    }, [user, dispatch]);

    // Profile update handler
    const handleProfileUpdate = useCallback(
        async (updates: Partial<UserProfile>) => {
            if (updates.preferences?.avatarUrl) {
                const result = await dispatch(
                    userSettingsActions.updateAvatar(updates.preferences.avatarUrl)
                );

                if (result.success) {
                    toast.success(t('avatarUpload.updateSuccess'));
                    window.location.reload();
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
