export interface RegisterFormData {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    fullname: string;
    userCode: string;
    phoneNumber: string;
    gender: string;
    address: string;
    spaceId: number | null;
}

export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    fullname: string;
    phoneNumber: string;
    gender: string;
    userCode: string;
    address: string;
    spaceId: number;
}

export interface FormErrors {
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    fullname?: string;
    userCode?: string;
    phoneNumber?: string;
    gender?: string;
    address?: string;
    factoryId?: string;
    general?: string;
}
