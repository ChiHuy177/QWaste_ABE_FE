import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DemoUserSettingService, USE_MOCK_USERS } from '@/mockData/admin/users';
import { UserService } from '@/services/UserService';
import { UserSettingService } from '@/services/UserSettingService';
import { UserProfile, UserSettings } from '@/types/User';
import type { AppDispatch, RootState } from './configureStore';

type UserReferencesUpdate = {
    preferences?: Partial<UserProfile['preferences']>;
};

const updateUserReferences = async (
    payload: UserReferencesUpdate,
    userId?: string
): Promise<unknown> => {
    if (USE_MOCK_USERS) {
        return DemoUserSettingService.updateReferences(payload, userId);
    }

    return UserSettingService.updateReferences(payload as unknown as string[]);
};

const requestPasswordVerification = async (
    currentPassword: string,
    userId?: string
): Promise<string> => {
    if (USE_MOCK_USERS) {
        return DemoUserSettingService.changePasswordVerifycation(currentPassword, userId);
    }

    return UserService.changePasswordVerifycation(currentPassword);
};

const changePasswordWithCode = async (
    otpCode: string,
    newPassword: string,
    confirmPassword: string,
    userId?: string
): Promise<string> => {
    if (USE_MOCK_USERS) {
        return DemoUserSettingService.changePasswordWithCode(
            otpCode,
            newPassword,
            confirmPassword,
            userId
        );
    }

    return UserService.changePasswordWithCode(otpCode, newPassword, confirmPassword);
};

export interface IUserSettingsStoreState {
    profile: UserProfile | null;
    settings: UserSettings | null;
    isRequestingOTP: boolean;
    isVerifying: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: IUserSettingsStoreState = {
    profile: null,
    settings: null,
    isRequestingOTP: false,
    isVerifying: false,
    isLoading: false,
    error: null,
};

const slice = createSlice({
    name: 'userSettings',
    initialState,
    reducers: {
        setProfile: (state, action: PayloadAction<UserProfile>) => {
            state.profile = action.payload;
        },

        updateProfileOptimistic: (state, action: PayloadAction<Partial<UserProfile>>) => {
            if (!state.profile) return;

            state.profile = {
                ...state.profile,
                ...action.payload,
            };
        },

        updateAvatarOptimistic: (state, action: PayloadAction<string>) => {
            if (!state.profile) return;

            state.profile = {
                ...state.profile,
                preferences: {
                    ...state.profile.preferences,
                    avatarUrl: action.payload,
                },
            };
        },

        setSettings: (state, action: PayloadAction<UserSettings>) => {
            state.settings = action.payload;
        },

        updateSettingsOptimistic: (state, action: PayloadAction<Partial<UserSettings>>) => {
            if (!state.settings) return;

            state.settings = {
                ...state.settings,
                ...action.payload,
            };
        },

        setRequestingOTP: (state, action: PayloadAction<boolean>) => {
            state.isRequestingOTP = action.payload;
        },

        setVerifying: (state, action: PayloadAction<boolean>) => {
            state.isVerifying = action.payload;
        },

        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },

        resetUserSettings: () => initialState,
    },
});

export const { reducer } = slice;

export const userSettingsActions = {
    setProfile: slice.actions.setProfile,

    updateAvatar:
        (avatarUrl: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
            const previousProfile = getState().userSettings.profile;

            if (!previousProfile) {
                return { success: false, error: 'No profile found' };
            }

            dispatch(slice.actions.updateAvatarOptimistic(avatarUrl));

            const avatarPayload: UserReferencesUpdate = {
                preferences: {
                    avatarUrl,
                },
            };

            try {
                await updateUserReferences(avatarPayload, previousProfile.userId);
                return { success: true };
            } catch {
                dispatch(slice.actions.setProfile(previousProfile));
                return { success: false, error: 'Failed to update avatar' };
            }
        },

    setSettings: slice.actions.setSettings,

    updateSettings:
        (updates: Partial<UserSettings>) =>
        async (dispatch: AppDispatch, getState: () => RootState) => {
            const previousSettings = getState().userSettings.settings;

            if (!previousSettings) {
                return { success: false, error: 'No settings found' };
            }

            dispatch(slice.actions.updateSettingsOptimistic(updates));

            const preferences: Partial<UserProfile['preferences']> = {};
            if (updates.theme) preferences.theme = updates.theme;
            if (updates.language) preferences.language = updates.language;

            try {
                await updateUserReferences({ preferences }, previousSettings.accountId);
                return { success: true };
            } catch {
                dispatch(slice.actions.setSettings(previousSettings));
                return { success: false, error: 'Failed to update settings' };
            }
        },

    requestOTP:
        (currentPassword: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
            dispatch(slice.actions.setRequestingOTP(true));
            dispatch(slice.actions.setError(null));

            try {
                const userId = getState().userSettings.profile?.userId;
                await requestPasswordVerification(currentPassword, userId);
                return { success: true };
            } catch {
                dispatch(slice.actions.setError('Failed to request OTP'));
                return { success: false, error: 'Co loi xay ra' };
            } finally {
                dispatch(slice.actions.setRequestingOTP(false));
            }
        },

    verifyOTP:
        (otpCode: string, newPassword: string, confirmPassword: string) =>
        async (dispatch: AppDispatch, getState: () => RootState) => {
            dispatch(slice.actions.setVerifying(true));
            dispatch(slice.actions.setError(null));

            try {
                const userId = getState().userSettings.profile?.userId;
                await changePasswordWithCode(otpCode, newPassword, confirmPassword, userId);
                return { success: true };
            } catch {
                dispatch(slice.actions.setError('Failed to verify OTP'));
                return { success: false, error: 'Co loi xay ra' };
            } finally {
                dispatch(slice.actions.setVerifying(false));
            }
        },

    setLoading: slice.actions.setLoading,
    setError: slice.actions.setError,
    resetUserSettings: slice.actions.resetUserSettings,
};
