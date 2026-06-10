import { FormFieldConfig } from '@/components/shared/FormModal/types';

const VALIDATION_CONFIG = Object.freeze({
    ERROR_NAME: { min: 2, max: 100, required: true },
    DESCRIPTION: { required: true },
});

export const getErrorDetailFormFields = (t: any, _mode: 'create' | 'edit'): FormFieldConfig[] => {
    return [
        {
            name: 'errorName',
            label: t('errorDetailManagement.form.fields.errorName'),
            type: 'text',
            placeholder: t('errorDetailManagement.form.placeholders.errorName'),
            required: VALIDATION_CONFIG.ERROR_NAME.required,
            maxLength: VALIDATION_CONFIG.ERROR_NAME.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.ERROR_NAME.required,
                    message: t('errorDetailManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.ERROR_NAME.min,
                    message: t('errorDetailManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.ERROR_NAME.min,
                    }),
                },
                {
                    max: VALIDATION_CONFIG.ERROR_NAME.max,
                    message: t('errorDetailManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.ERROR_NAME.max,
                    }),
                },
            ],
            span: { xs: 24 },
        },
        {
            name: 'description',
            label: t('errorDetailManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('errorDetailManagement.form.placeholders.description'),
            required: VALIDATION_CONFIG.DESCRIPTION.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.DESCRIPTION.required,
                    message: t('errorDetailManagement.form.validation.required'),
                },
            ],
            span: { xs: 24 },
        },
        {
            name: 'status',
            label: t('errorDetailManagement.form.fields.status'),
            type: 'select',
            placeholder: t('errorDetailManagement.form.placeholders.status'),
            required: true,
            options: [
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'INACTIVE', value: 'INACTIVE' },
            ],
            rules: [
                {
                    required: true,
                    message: t('errorDetailManagement.form.validation.required'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
    ];
};
