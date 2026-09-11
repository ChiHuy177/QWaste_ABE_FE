import { createSlice, PayloadAction, Dispatch } from '@reduxjs/toolkit';
import { UserProfile, UserSettings } from '@/types/User';
import { UserService, UserSettingService } from '@/services';
import { UpdateUserPreferencesRequest } from '@/services/UserSettingService';
import type { RootState } from './configureStore';

/**
 * User Settings Store State Interface
 */
export interface IUserSettingsStoreState {
    // Profile state
    profile: UserProfile | null;

    // Settings state
    settings: UserSettings | null;

    // Password state
    isRequestingOTP: boolean;
    isVerifying: boolean;

    // Common state
    isLoading: boolean;
    error: string | null;
}

/**
 * Initial State
 */
const initialState: IUserSettingsStoreState = {
    profile: null,
    settings: null,
    isRequestingOTP: false,
    isVerifying: false,
    isLoading: false,
    error: null,
};

/**
 * Create User Settings Slice
 */
const slice = createSlice({
    name: 'userSettings',
    initialState,
    reducers: {
        // Profile reducers
        setProfile: (state, action: PayloadAction<UserProfile>) => {
            state.profile = action.payload;
        },

        updateProfileOptimistic: (state, action: PayloadAction<Partial<UserProfile>>) => {
            if (state.profile) {
                state.profile = {
                    ...state.profile,
                    ...action.payload,
                };
            }
        },

        updateAvatarOptimistic: (state, action: PayloadAction<string>) => {
            if (state.profile) {
                state.profile = {
                    ...state.profile,
                    preferences: {
                        ...state.profile.preferences,
                        avatarUrl: action.payload,
                    },
                };
            }
        },

        // Settings reducers
        setSettings: (state, action: PayloadAction<UserSettings>) => {
            state.settings = action.payload;
        },

        updateSettingsOptimistic: (state, action: PayloadAction<Partial<UserSettings>>) => {
            if (state.settings) {
                state.settings = {
                    ...state.settings,
                    ...action.payload,
                };
            }
        },

        // Password reducers
        setRequestingOTP: (state, action: PayloadAction<boolean>) => {
            state.isRequestingOTP = action.payload;
        },

        setVerifying: (state, action: PayloadAction<boolean>) => {
            state.isVerifying = action.payload;
        },

        // Common reducers
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },

        // Reset state
        resetUserSettings: () => initialState,
    },
});

/**
 * Export reducer
 */
export const { reducer } = slice;

/**
 * Action Creators (Async Thunks)
 */
export const userSettingsActions = {
    /**
     * Set profile
     */
    setProfile: slice.actions.setProfile,

    /**
     * Update avatar
     */
    updateAvatar: (avatarUrl: string) => async (dispatch: Dispatch, getState: () => RootState) => {
        const previousProfile = getState().userSettings.profile;

        if (!previousProfile) {
            return { success: false, error: 'No profile found' };
        }

        // Optimistic update
        dispatch(slice.actions.updateAvatarOptimistic(avatarUrl));

        const avatarPayload: UpdateUserPreferencesRequest = {
            preferences: {
                avatarUrl: avatarUrl,
            },
        };

        try {
            await UserSettingService.updateReferences(avatarPayload);
            return { success: true };
        } catch (error) {
            // Rollback on error
            dispatch(slice.actions.setProfile(previousProfile));
            return { success: false, error: 'Failed to update avatar' };
        }
    },

    /**
     * Set settings
     */
    setSettings: slice.actions.setSettings,

    /**
     * Update settings
     */
    updateSettings:
        (updates: Partial<UserSettings>) =>
        async (dispatch: Dispatch, getState: () => RootState) => {
            const previousSettings = getState().userSettings.settings;

            if (!previousSettings) {
                return { success: false, error: 'No settings found' };
            }

            // Optimistic update
            dispatch(slice.actions.updateSettingsOptimistic(updates));

            const payload: UpdateUserPreferencesRequest = { preferences: {} };
            if (updates.theme) payload.preferences.theme = updates.theme;
            if (updates.language) payload.preferences.language = updates.language;

            try {
                await UserSettingService.updateReferences(payload);
                return { success: true };
            } catch (error) {
                // Rollback on error
                dispatch(slice.actions.setSettings(previousSettings));
                return { success: false, error: 'Failed to update settings' };
            }
        },

    /**
     * Request OTP for password change
     */
    requestOTP: (currentPassword: string) => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setRequestingOTP(true));
        dispatch(slice.actions.setError(null));

        try {
            await UserService.changePasswordVerifycation(currentPassword);
            dispatch(slice.actions.setRequestingOTP(false));
            return { success: true };
        } catch (error) {
            dispatch(slice.actions.setRequestingOTP(false));
            dispatch(slice.actions.setError('Failed to request OTP'));
            return { success: false, error: 'Có lỗi xảy ra' };
        }
    },

    /**
     * Verify OTP and change password
     */
    verifyOTP:
        (otpCode: string, newPassword: string, confirmPassword: string) =>
        async (dispatch: Dispatch) => {
            dispatch(slice.actions.setVerifying(true));
            dispatch(slice.actions.setError(null));

            try {
                await UserService.changePasswordWithCode(otpCode, newPassword, confirmPassword);
                dispatch(slice.actions.setVerifying(false));
                return { success: true };
            } catch (error) {
                dispatch(slice.actions.setVerifying(false));
                dispatch(slice.actions.setError('Failed to verify OTP'));
                return { success: false, error: 'Có lỗi xảy ra' };
            }
        },

    // Re-export sync actions
    setLoading: slice.actions.setLoading,
    setError: slice.actions.setError,
    resetUserSettings: slice.actions.resetUserSettings,
};
