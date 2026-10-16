import { TFunction } from 'i18next';
import { FormFieldConfig } from '@/components/shared/FormModal/types';

export const VALIDATION_CONFIG = Object.freeze({
    ROOT_CAUSE: { required: true, maxLength: 2000 },
    RESOLUTION: { required: false, maxLength: 2000 },
});

export const getErrorManagementFormFields = (
    t: TFunction,
    _mode: 'create' | 'edit' = 'edit'
): FormFieldConfig[] => {
    return [
        {
            name: 'rootCause',
            label: t('errorManagement.modal.cause'),
            type: 'textarea',
            placeholder: t('errorManagement.modal.causePlaceholder'),
            required: VALIDATION_CONFIG.ROOT_CAUSE.required,
            maxLength: VALIDATION_CONFIG.ROOT_CAUSE.maxLength,
            rows: 4,
            showCount: true,
            rules: [
                {
                    required: VALIDATION_CONFIG.ROOT_CAUSE.required,
                    message: t('errorManagement.modal.causeRequired'),
                },
                {
                    max: VALIDATION_CONFIG.ROOT_CAUSE.maxLength,
                    message: t('common.maxLength', {
                        count: VALIDATION_CONFIG.ROOT_CAUSE.maxLength,
                        defaultValue: `Tối đa ${VALIDATION_CONFIG.ROOT_CAUSE.maxLength} ký tự`,
                    }),
                },
            ],
            span: { xs: 24 },
        },
        {
            name: 'resolution',
            label: t('errorManagement.modal.resolution'),
            type: 'textarea',
            placeholder: t('errorManagement.modal.resolutionPlaceholder'),
            required: VALIDATION_CONFIG.RESOLUTION.required,
            maxLength: VALIDATION_CONFIG.RESOLUTION.maxLength,
            rows: 4,
            showCount: true,
            rules: [
                {
                    max: VALIDATION_CONFIG.RESOLUTION.maxLength,
                    message: t('common.maxLength', {
                        count: VALIDATION_CONFIG.RESOLUTION.maxLength,
                        defaultValue: `Tối đa ${VALIDATION_CONFIG.RESOLUTION.maxLength} ký tự`,
                    }),
                },
            ],
            span: { xs: 24 },
        },
    ];
};
