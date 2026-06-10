import { UserProfile } from './User';

export interface ApiResponse<T> {
    code: number;
    message?: string;
    result?: T;
    isSuccess?: boolean;
    errors?: string[];
}

export interface Token {
    accessToken: string;
    refreshToken: string;
}

export interface LoginResponse {
    authenticated: boolean;
    tokens: Token;
    user: UserProfile;
}
