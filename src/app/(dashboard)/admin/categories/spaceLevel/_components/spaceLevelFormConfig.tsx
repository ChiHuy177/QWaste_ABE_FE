import { FormFieldConfig } from '@/components/shared/FormModal/types';

const VALIDATION_CONFIG = Object.freeze({
    SPACE_LEVEL: { min: 1, required: true, maxLength: 9 },
    SPACE_LEVEL_NAME: { required: true, minLength: 3, maxLength: 255 },
});

export const getSpaceLevelFormFields = (
    t: (key: string, variables?: Record<string, string | number>) => string,
    _mode: 'create' | 'edit'
): FormFieldConfig[] => {
    return [
        {
            name: 'spaceLevel',
            label: t('spaceLevelManagement.form.fields.level'),
            type: 'number',
            placeholder: t('spaceLevelManagement.form.placeholders.level'),
            allowDecimal: false,
            required: VALIDATION_CONFIG.SPACE_LEVEL.required,
            maxLength: VALIDATION_CONFIG.SPACE_LEVEL.maxLength,
            disabled: true,
            rules: [
                {
                    required: VALIDATION_CONFIG.SPACE_LEVEL.required,
                    message: t('spaceLevelManagement.form.validation.required'),
                },
                {
                    type: 'number',
                    min: VALIDATION_CONFIG.SPACE_LEVEL.min,
                    message: t('spaceLevelManagement.form.validation.minValue', {
                        min: VALIDATION_CONFIG.SPACE_LEVEL.min,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
        {
            name: 'spaceLevelName',
            label: t('spaceLevelManagement.form.fields.levelName'),
            type: 'text',
            placeholder: t('spaceLevelManagement.form.placeholders.levelName'),
            required: VALIDATION_CONFIG.SPACE_LEVEL_NAME.required,
            maxLength: VALIDATION_CONFIG.SPACE_LEVEL_NAME.maxLength,
            rules: [
                {
                    required: VALIDATION_CONFIG.SPACE_LEVEL_NAME.required,
                    message: t('spaceLevelManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.SPACE_LEVEL_NAME.minLength,
                    message: t('spaceLevelManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.SPACE_LEVEL_NAME.minLength,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
    ];
};
