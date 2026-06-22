import { FormFieldConfig } from '@/components/shared/FormModal/types';

const VALIDATION_CONFIG = Object.freeze({
    DISPLAY_NAME_EN: { min: 2, max: 100, required: true },
    DISPLAY_NAME_VI: { min: 2, max: 100, required: true },
    SHORT_NAME_EN: { max: 50, required: false },
    TIME_PATTERN: '^([01][0-9]|2[0-3]):[0-5][0-9]$', // HH:mm format
    SORT_ORDER: { min: 0, required: false },
});

export const getIndustryFilterFormFields = (
    t: any,
    mode: 'create' | 'edit'
): FormFieldConfig[] => {
    return [
        // Display Name (English)
        {
            name: 'displayNameEn',
            label: t('industryFilterManagement.form.fields.displayNameEn'),
            type: 'text',
            placeholder: t('industryFilterManagement.form.placeholders.displayNameEn'),
            required: VALIDATION_CONFIG.DISPLAY_NAME_EN.required,
            maxLength: VALIDATION_CONFIG.DISPLAY_NAME_EN.max,
            showCount: true,
            rules: [
                {
                    required: VALIDATION_CONFIG.DISPLAY_NAME_EN.required,
                    message: t('industryFilterManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.DISPLAY_NAME_EN.min,
                    message: t('industryFilterManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.DISPLAY_NAME_EN.min,
                    }),
                },
                {
                    max: VALIDATION_CONFIG.DISPLAY_NAME_EN.max,
                    message: t('industryFilterManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.DISPLAY_NAME_EN.max,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Display Name (Vietnamese)
        {
            name: 'displayNameVi',
            label: t('industryFilterManagement.form.fields.displayNameVi'),
            type: 'text',
            placeholder: t('industryFilterManagement.form.placeholders.displayNameVi'),
            required: VALIDATION_CONFIG.DISPLAY_NAME_VI.required,
            maxLength: VALIDATION_CONFIG.DISPLAY_NAME_VI.max,
            showCount: true,
            rules: [
                {
                    required: VALIDATION_CONFIG.DISPLAY_NAME_VI.required,
                    message: t('industryFilterManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.DISPLAY_NAME_VI.min,
                    message: t('industryFilterManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.DISPLAY_NAME_VI.min,
                    }),
                },
                {
                    max: VALIDATION_CONFIG.DISPLAY_NAME_VI.max,
                    message: t('industryFilterManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.DISPLAY_NAME_VI.max,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Short Name (English)
        {
            name: 'shortNameEn',
            label: t('industryFilterManagement.form.fields.shortNameEn'),
            type: 'text',
            placeholder: t('industryFilterManagement.form.placeholders.shortNameEn'),
            required: VALIDATION_CONFIG.SHORT_NAME_EN.required,
            maxLength: VALIDATION_CONFIG.SHORT_NAME_EN.max,
            showCount: true,
            rules: [
                {
                    max: VALIDATION_CONFIG.SHORT_NAME_EN.max,
                    message: t('industryFilterManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.SHORT_NAME_EN.max,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Sort Order
        {
            name: 'sortOrder',
            label: t('industryFilterManagement.form.fields.sortOrder'),
            type: 'number',
            placeholder: t('industryFilterManagement.form.placeholders.sortOrder'),
            required: VALIDATION_CONFIG.SORT_ORDER.required,
            rules: [
                {
                    type: 'number',
                    min: VALIDATION_CONFIG.SORT_ORDER.min,
                    message: t('industryFilterManagement.form.validation.minValue', {
                        min: VALIDATION_CONFIG.SORT_ORDER.min,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Start Time
        {
            name: 'startTime',
            label: t('industryFilterManagement.form.fields.startTime'),
            type: 'time',
            placeholder: 'HH:mm A (e.g., 08:00 AM)',
            required: true,
            maxLength: 5,
            rules: [
                {
                    required: true,
                    message: t('industryFilterManagement.form.validation.required'),
                },
                {
                    pattern: new RegExp(VALIDATION_CONFIG.TIME_PATTERN),
                    message: t('industryFilterManagement.form.validation.timeFormat'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // End Time
        {
            name: 'endTime',
            label: t('industryFilterManagement.form.fields.endTime'),
            type: 'time',
            placeholder: 'HH:mm A (e.g., 05:00 PM)',
            required: true,
            maxLength: 5,
            rules: [
                {
                    required: true,
                    message: t('industryFilterManagement.form.validation.required'),
                },
                {
                    pattern: new RegExp(VALIDATION_CONFIG.TIME_PATTERN),
                    message: t('industryFilterManagement.form.validation.timeFormat'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
    ];
};
