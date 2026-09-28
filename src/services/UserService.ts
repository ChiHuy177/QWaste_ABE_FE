import {
    UserProfile,
    UserRolesPermissionsSummary,
    UserForPickingByRole,
    UserCreationRequest,
    UserUpdationRequest,
    UserRolesAndPermissionsUpdationRequest,
    UserListResponse,
    UserQueryParams,
    RegistrationResendResponse,
} from '@/types/User';
import { PageResponse } from '@/types/Common';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class UserService {
    static async getStaffById(userId: string): Promise<UserProfile> {
        const response = await NetworkService.requestJson<UserProfile>({
            method: 'GET',
            url: ENDPOINTS.USERS.DETAIL(userId),
        });
        return response.result as UserProfile;
    }

    static async getAllStaff(params?: UserQueryParams): Promise<UserProfile[]> {
        const response = await NetworkService.requestJson<
            PageResponse<UserListResponse> | UserProfile[]
        >({
            method: 'GET',
            url: ENDPOINTS.USERS.BASE,
            data: params,
        });
        const result = response.result;
        if (!result) return [];
        if (Array.isArray(result)) return result as UserProfile[];
        if (typeof result === 'object' && result !== null && 'content' in result) {
            const page = result as PageResponse<UserListResponse>;
            if (Array.isArray(page.content)) {
                return page.content as unknown as UserProfile[];
            }
        }
        return [];
    }

    static async createStaff(
        userData: UserCreationRequest | Partial<UserProfile>
    ): Promise<UserProfile> {
        const response = await NetworkService.requestJson<UserProfile>({
            method: 'POST',
            url: ENDPOINTS.USERS.BASE,
            data: userData,
        });
        return response.result as UserProfile;
    }

    static async getMe(): Promise<UserProfile> {
        const response = await NetworkService.requestJson({
            method: 'GET',
            url: ENDPOINTS.USERS.ME,
        });
        return response.result as UserProfile;
    }

    static async updateStaff(userData: UserUpdationRequest | UserProfile): Promise<UserProfile> {
        const response = await NetworkService.requestJson<UserProfile>({
            method: 'PUT',
            url: ENDPOINTS.USERS.BASE,
            data: userData,
        });
        return response.result as UserProfile;
    }

    static async deleteStaff(userId: string): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.USERS.DETAIL(userId),
        });
        return response.result;
    }

    static async restoreStaff(userId: string): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'PUT',
            url: ENDPOINTS.USERS.RESTORE(userId),
        });
        return response.result;
    }

    static async changePasswordVerification(currentPassword: string): Promise<string> {
        const response = await NetworkService.requestJson<string>({
            method: 'POST',
            url: ENDPOINTS.USERS.CHANGE_PASSWORD_VERIFY,
            data: { currentPassword },
        });
        return response.message as string;
    }

    static async changePasswordVerifycation(currentPassword: string): Promise<string> {
        return this.changePasswordVerification(currentPassword);
    }

    static async changePasswordWithCode(
        otpCode: string,
        newPassword: string,
        confirmPassword: string
    ): Promise<string> {
        const response = await NetworkService.requestJson<string>({
            method: 'PUT',
            url: ENDPOINTS.USERS.CHANGE_PASSWORD_CODE,
            data: { verificationCode: otpCode, newPassword, confirmNewPassword: confirmPassword },
        });
        return response.message as string;
    }

    static async adminResetPassword(userId: string): Promise<string> {
        const response = await NetworkService.requestJson<string>({
            method: 'PUT',
            url: ENDPOINTS.USERS.ADMIN_RESET_PASSWORD(userId),
        });
        return response.message as string;
    }

    static async getRolesAndPermissionsSummary(
        userId: string
    ): Promise<UserRolesPermissionsSummary> {
        const response = await NetworkService.requestJson<UserRolesPermissionsSummary>({
            method: 'GET',
            url: ENDPOINTS.USERS.ROLES_PERMISSIONS_SUMMARY(userId),
        });
        return response.result as UserRolesPermissionsSummary;
    }

    static async updateRolesAndPermissions(
        data: UserRolesAndPermissionsUpdationRequest
    ): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'PUT',
            url: ENDPOINTS.USERS.UPDATE_ROLES_PERMISSIONS,
            data,
        });
        return response.result;
    }

    static async getOperators(): Promise<UserProfile[]> {
        try {
            const allUsers = await this.getAllStaff();
            const operators = allUsers.filter((user) => {
                if (!user) return false;
                return user.roles && Array.isArray(user.roles);
            });
            return operators;
        } catch (error) {
            console.error('Error fetching operators:', error);
            return [];
        }
    }

    static async getUsersByRole(roleName: string): Promise<UserForPickingByRole[]> {
        const response = await NetworkService.requestJson<UserForPickingByRole[]>({
            method: 'GET',
            url: `${ENDPOINTS.USERS.PICKING_BY_ROLE}?roleName=${roleName}`,
        });
        return response.result as UserForPickingByRole[];
    }

    static async resendRegistrationCode(email: string): Promise<RegistrationResendResponse> {
        const response = await NetworkService.requestJson<RegistrationResendResponse>({
            method: 'POST',
            url: ENDPOINTS.USERS.REGISTER_RESEND,
            data: { email },
        });
        return response.result as RegistrationResendResponse;
    }
}
