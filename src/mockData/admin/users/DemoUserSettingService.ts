import { DEMO_AUTH_ACCOUNTS, DEMO_AUTH_STORAGE_KEY } from '@/mockData/auth';
import type { UserPreference, UserProfile } from '@/types/User';
import { DEMO_STAFF } from './users';

type UserReferencesUpdate = {
    preferences?: Partial<UserPreference>;
};

const DEMO_OTP_CODE = '123456';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const getActiveUserId = (userId?: string): string => {
    if (userId) return userId;

    if (typeof window !== 'undefined') {
        const storedUserId = localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
        if (storedUserId) return storedUserId;
    }

    return DEMO_STAFF[0].userId;
};

const findDemoStaff = (userId: string): UserProfile => {
    const staff = DEMO_STAFF.find((item) => item.userId === userId);
    if (!staff) {
        throw new Error('Demo staff was not found');
    }

    return staff;
};

const findDemoAccount = (userId: string) =>
    DEMO_AUTH_ACCOUNTS.find((account) => account.profile.userId === userId);

const syncPreferences = (userId: string, preferences: Partial<UserPreference>): UserProfile => {
    const staff = findDemoStaff(userId);
    const account = findDemoAccount(userId);

    staff.preferences = {
        ...staff.preferences,
        ...preferences,
    };

    if (account) {
        account.profile.preferences = {
            ...account.profile.preferences,
            ...preferences,
        };
    }

    return staff;
};

const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Demo avatar upload failed'));
        reader.readAsDataURL(file);
    });

export class DemoUserSettingService {
    static async updateReferences(
        payload: UserReferencesUpdate,
        userId?: string
    ): Promise<UserProfile> {
        const activeUserId = getActiveUserId(userId);
        const staff = syncPreferences(activeUserId, payload.preferences ?? {});

        return clone(staff);
    }

    static async uploadAvatarFile(file: File): Promise<string> {
        return readFileAsDataUrl(file);
    }

    static async changePasswordVerifycation(
        currentPassword: string,
        userId?: string
    ): Promise<string> {
        const activeUserId = getActiveUserId(userId);
        const account = findDemoAccount(activeUserId);

        if (!account || account.password !== currentPassword) {
            throw new Error('Current demo password is incorrect');
        }

        return `Demo OTP code: ${DEMO_OTP_CODE}`;
    }

    static async changePasswordWithCode(
        otpCode: string,
        newPassword: string,
        confirmPassword: string,
        userId?: string
    ): Promise<string> {
        if (otpCode !== DEMO_OTP_CODE) {
            throw new Error('Demo OTP code is invalid');
        }

        if (newPassword !== confirmPassword) {
            throw new Error('Password confirmation does not match');
        }

        const activeUserId = getActiveUserId(userId);
        const account = findDemoAccount(activeUserId);

        if (account) {
            account.password = newPassword;
        }

        return 'Demo password updated';
    }
}
