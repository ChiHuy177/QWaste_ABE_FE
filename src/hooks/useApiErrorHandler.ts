import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getApiErrorMessage, getErrorStatus, shouldUseServerMessage } from '@/utils/apiError';

export interface ApiErrorOptions {
    fallbackKey?: string;
    customMappings?: Record<number, string>;
}

export const useApiErrorHandler = () => {
    const { t } = useTranslation();

    const handleError = useCallback(
        (error: unknown, options?: ApiErrorOptions) => {
            const status = getErrorStatus(error);
            const apiMessage = getApiErrorMessage(error);

            let errorMessage = '';

            if (status && options?.customMappings?.[status]) {
                errorMessage = t(options.customMappings[status]);
            } else if (shouldUseServerMessage(status)) {
                errorMessage = apiMessage || t('common.server.conflict');
            } else {
                switch (status) {
                    case 400: // Validation failure
                        errorMessage = t('common.server.badRequest');
                        break;
                    case 401: // Unauthorized
                        errorMessage = t('common.server.unauthorized');
                        break;
                    case 403: // Forbidden
                        errorMessage = t('common.server.forbidden');
                        break;
                    case 404: // Not Found
                        errorMessage = t('common.server.notFound');
                        break;
                    case 429: // Rate limit
                        errorMessage = t('common.server.rateLimit');
                        break;
                    case 500: // Server Error
                        errorMessage = t('common.server.serverError');
                        break;
                    case 502: // Bad Gateway
                    case 503: // Service Unavailable
                        errorMessage = t('common.server.serviceUnavailable');
                        break;
                    default:
                        errorMessage = options?.fallbackKey
                            ? t(options.fallbackKey)
                            : t('common.server.unknown');
                        break;
                }
            }

            toast.error(errorMessage);
        },
        [t]
    );

    return { handleError };
};
