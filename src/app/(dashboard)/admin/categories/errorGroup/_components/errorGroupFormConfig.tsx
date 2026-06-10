import { FormFieldConfig } from '@/components/shared/FormModal/types';

const VALIDATION_CONFIG = Object.freeze({
    ERROR_GROUP_NAME: { min: 2, max: 100, required: true },
    DESCRIPTION: { required: true },
});

export const getErrorGroupFormFields = (t: any, _mode: 'create' | 'edit'): FormFieldConfig[] => {
    return [
        {
            name: 'errorGroupName',
            label: t('errorGroupManagement.form.fields.errorGroupName'),
            type: 'text',
            placeholder: t('errorGroupManagement.form.placeholders.errorGroupName'),
            required: VALIDATION_CONFIG.ERROR_GROUP_NAME.required,
            maxLength: VALIDATION_CONFIG.ERROR_GROUP_NAME.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.ERROR_GROUP_NAME.required,
                    message: t('errorGroupManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.ERROR_GROUP_NAME.min,
                    message: t('errorGroupManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.ERROR_GROUP_NAME.min,
                    }),
                },
                {
                    max: VALIDATION_CONFIG.ERROR_GROUP_NAME.max,
                    message: t('errorGroupManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.ERROR_GROUP_NAME.max,
                    }),
                },
            ],
            span: { xs: 24 },
        },
        {
            name: 'description',
            label: t('errorGroupManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('errorGroupManagement.form.placeholders.description'),
            required: VALIDATION_CONFIG.DESCRIPTION.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.DESCRIPTION.required,
                    message: t('errorGroupManagement.form.validation.required'),
                },
            ],
            span: { xs: 24 },
        },
        {
            name: 'status',
            label: t('errorGroupManagement.form.fields.status'),
            type: 'select',
            placeholder: t('errorGroupManagement.form.placeholders.status'),
            required: true,
            options: [
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'INACTIVE', value: 'INACTIVE' },
            ],
            rules: [
                {
                    required: true,
                    message: t('errorGroupManagement.form.validation.required'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
    ];
};
