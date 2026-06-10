import { FormFieldConfig } from '@/components/shared/FormModal/types';

const VALIDATION_CONFIG = Object.freeze({
    MOLD_CODE_NAME: { min: 2, max: 100, required: true },
    DESCRIPTION: { required: true },
});

export const getMoldCodeFormFields = (t: any, _mode: 'create' | 'edit'): FormFieldConfig[] => {
    return [
        {
            name: 'moldCodeName',
            label: t('moldCodeManagement.form.fields.moldCodeName'),
            type: 'text',
            placeholder: t('moldCodeManagement.form.placeholders.moldCodeName'),
            required: VALIDATION_CONFIG.MOLD_CODE_NAME.required,
            maxLength: VALIDATION_CONFIG.MOLD_CODE_NAME.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.MOLD_CODE_NAME.required,
                    message: t('moldCodeManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.MOLD_CODE_NAME.min,
                    message: t('moldCodeManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.MOLD_CODE_NAME.min,
                    }),
                },
                {
                    max: VALIDATION_CONFIG.MOLD_CODE_NAME.max,
                    message: t('moldCodeManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.MOLD_CODE_NAME.max,
                    }),
                },
            ],
            span: { xs: 24 },
        },
        {
            name: 'description',
            label: t('moldCodeManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('moldCodeManagement.form.placeholders.description'),
            required: VALIDATION_CONFIG.DESCRIPTION.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.DESCRIPTION.required,
                    message: t('moldCodeManagement.form.validation.required'),
                },
            ],
            span: { xs: 24 },
        },
        {
            name: 'status',
            label: t('moldCodeManagement.form.fields.status'),
            type: 'select',
            placeholder: t('moldCodeManagement.form.placeholders.status'),
            required: true,
            options: [
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'INACTIVE', value: 'INACTIVE' },
            ],
            rules: [
                {
                    required: true,
                    message: t('moldCodeManagement.form.validation.required'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
    ];
};
