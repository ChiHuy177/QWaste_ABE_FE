import axios from 'axios';

const toMessage = (value: unknown): string => {
    if (typeof value === 'string' && value.trim()) {
        return value;
    }

    return '';
};

const toMessages = (value: unknown): string => {
    if (!Array.isArray(value)) {
        return '';
    }

    return value
        .map((item) => {
            if (typeof item === 'string') {
                return item;
            }

            if (item && typeof item === 'object') {
                const record = item as Record<string, unknown>;
                return (
                    toMessage(record.message) ||
                    toMessage(record.error) ||
                    toMessage(record.defaultMessage)
                );
            }

            return '';
        })
        .filter(Boolean)
        .join('\n');
};

interface ApiErrorLike {
    response?: {
        data?: unknown;
        status?: number;
    };
    message?: string;
}

export const getApiErrorMessage = (error: unknown, fallback = ''): string => {
    const errorObject = error as ApiErrorLike;
    const errorData = errorObject?.response?.data as Record<string, unknown> | undefined;

    const apiMessage =
        toMessage(errorData?.message) ||
        toMessages(errorData?.errors) ||
        toMessage(errorData?.error) ||
        toMessage((errorData?.result as Record<string, unknown> | undefined)?.message) ||
        toMessages((errorData?.result as Record<string, unknown> | undefined)?.errors);

    return apiMessage || fallback || toMessage(errorObject?.message);
};

export const getErrorStatus = (error: unknown): number | undefined => {
    return (error as ApiErrorLike)?.response?.status;
};

export const shouldUseServerMessage = (status?: number): boolean => {
    return status === 409;
};

export const isRequestCancelled = (error: unknown): boolean => {
    return axios.isCancel(error);
};
