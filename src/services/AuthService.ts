import { LoginResponse } from '@/types/ApiResponse';
import { NetworkService } from './NetworkService';
import { AuthStore } from '@/stores/AuthStore';
import { ENDPOINTS } from './endpoints';
import { RegisterRequest } from '@/types/Register';
import { getApiErrorMessage } from '@/utils/apiError';

export class AuthService {
    private static storeAuthTokens(result: LoginResponse): void {
        AuthStore.setUser(result.user?.fullname || '');
    }

    static async login(username: string, password: string): Promise<LoginResponse> {
        try {
            const response = await NetworkService.requestJson<LoginResponse>({
                method: 'POST',
                url: ENDPOINTS.AUTH.LOGIN,
                data: {
                    username,
                    password,
                },
            });

            if (response.code !== 200 || !response.result?.authenticated) {
                throw new Error(response.message || 'Login failed');
            }

            this.storeAuthTokens(response.result);

            return response.result as LoginResponse;
        } catch (error: unknown) {
            console.log(error);
            throw error;
        }
    }

    static async refreshToken(): Promise<void> {
        try {
            const response = await NetworkService.requestJson({
                method: 'POST',
                url: ENDPOINTS.AUTH.REFRESH,
            });

            if (response.code !== 200) {
                throw new Error(response.message || 'Refresh failed');
            }
            // BFF: Proxy cập nhật httpOnly cookie, client không cần token
        } catch (error: unknown) {
            console.error('[AUTH SERVICE] Refresh failed:', getApiErrorMessage(error));
            throw error;
        }
    }

    static async logout(): Promise<void> {
        try {
            await NetworkService.requestJson({
                method: 'POST',
                url: ENDPOINTS.AUTH.LOGOUT,
            });
        } catch (error: unknown) {
            console.error('[AUTH SERVICE] Logout failed:', getApiErrorMessage(error));
        } finally {
            AuthStore.clear();
        }
    }

    static async register(data: RegisterRequest): Promise<{ success: boolean; error?: string }> {
        try {
            console.log('Registering with data:', data);
            const response = await NetworkService.requestJson({
                method: 'POST',
                url: ENDPOINTS.AUTH.REGISTER,
                skipAuthHandling: true,
                data,
            });

            if (response.code !== 200 && response.code !== 201) {
                return {
                    success: false,
                    error: response.message || 'Registration failed',
                };
            }

            return { success: true };
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error, 'Registration failed');
            console.error('[AUTH SERVICE] Registration failed:', errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    static async verifyRegistration(
        email: string,
        verificationCode: string
    ): Promise<LoginResponse> {
        try {
            const response = await NetworkService.requestJson<LoginResponse>({
                method: 'POST',
                url: ENDPOINTS.AUTH.REGISTER_VERIFY,
                data: {
                    email,
                    verificationCode,
                },
            });

            if (response.code !== 200 || response.result?.authenticated !== true) {
                throw new Error(response.message);
            }

            this.storeAuthTokens(response.result);

            return response.result as LoginResponse;
        } catch (error: unknown) {
            console.error('[AUTH SERVICE] Verification failed:', getApiErrorMessage(error));
            throw error;
        }
    }
}
