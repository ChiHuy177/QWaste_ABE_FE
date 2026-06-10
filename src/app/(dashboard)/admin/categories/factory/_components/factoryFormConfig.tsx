import { FormFieldConfig } from '@/components/shared/FormModal/types';

const VALIDATION_CONFIG = Object.freeze({
    FACTORY_CODE: { min: 2, max: 10, pattern: '^[A-Z0-9]+$', required: true },
    FACTORY_NAME: { min: 5, max: 50, required: true },
    DISPLAY_ORDER: { min: 0, required: true },
    ADDRESS: { min: 5, max: 500, required: true },
    DESCRIPTION: { required: true },
});

export const getFactoryFormFields = (t: any, mode: 'create' | 'edit'): FormFieldConfig[] => {
    return [
        // Factory Code
        {
            name: 'factoryCode',
            label: t('factoryManagement.form.fields.factoryCode'),
            type: 'text',
            placeholder: t('factoryManagement.form.placeholders.factoryCode'),
            required: VALIDATION_CONFIG.FACTORY_CODE.required,
            maxLength: VALIDATION_CONFIG.FACTORY_CODE.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.FACTORY_CODE.required,
                    message: t('factoryManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.FACTORY_CODE.min,
                    message: t('factoryManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.FACTORY_CODE.min,
                    }),
                },
                {
                    max: VALIDATION_CONFIG.FACTORY_CODE.max,
                    message: t('factoryManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.FACTORY_CODE.max,
                    }),
                },
                {
                    pattern: new RegExp(VALIDATION_CONFIG.FACTORY_CODE.pattern),
                    message: t('factoryManagement.form.validation.factoryCodePattern'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Factory Name
        {
            name: 'factoryName',
            label: t('factoryManagement.form.fields.factoryName'),
            type: 'text',
            placeholder: t('factoryManagement.form.placeholders.factoryName'),
            required: VALIDATION_CONFIG.FACTORY_NAME.required,
            maxLength: VALIDATION_CONFIG.FACTORY_NAME.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.FACTORY_NAME.required,
                    message: t('factoryManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.FACTORY_NAME.min,
                    message: t('factoryManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.FACTORY_NAME.min,
                    }),
                },
                {
                    max: VALIDATION_CONFIG.FACTORY_NAME.max,
                    message: t('factoryManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.FACTORY_NAME.max,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Display Order
        {
            name: 'displayOrder',
            label: t('factoryManagement.form.fields.order'),
            type: 'number',
            placeholder: t('factoryManagement.form.placeholders.order'),
            required: VALIDATION_CONFIG.DISPLAY_ORDER.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.DISPLAY_ORDER.required,
                    message: t('factoryManagement.form.validation.required'),
                },
                {
                    type: 'number',
                    min: VALIDATION_CONFIG.DISPLAY_ORDER.min,
                    message: t('factoryManagement.form.validation.minValue', {
                        min: VALIDATION_CONFIG.DISPLAY_ORDER.min,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Address
        {
            name: 'address',
            label: t('factoryManagement.form.fields.address'),
            type: 'text',
            placeholder: t('factoryManagement.form.placeholders.address'),
            required: VALIDATION_CONFIG.ADDRESS.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.ADDRESS.required,
                    message: t('factoryManagement.form.validation.required'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Description
        {
            name: 'description',
            label: t('factoryManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('factoryManagement.form.placeholders.description'),
            required: VALIDATION_CONFIG.DESCRIPTION.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.DESCRIPTION.required,
                    message: t('factoryManagement.form.validation.required'),
                },
            ],
            span: { xs: 24 },
        },
    ];
};
