import { FormFieldConfig } from '@/components/shared/FormModal/types';
import { SelectOption } from '@/types/Common';
const VALIDATION_CONFIG = Object.freeze({
    FACTORY_ID: { required: true },
    DISPLAY_ORDER: { min: 0, required: true },
    ZONE_CODE: { required: true, maxLength: 10, minLength: 2, pattern: /^[A-Z0-9]+$/ },
    ZONE_NAME: { required: true, maxLength: 50, minLength: 2 },
    DESCRIPTION: { required: true },
});
export const getZoneFormFields = (
    t: any,
    mode: 'create' | 'edit',
    factoryOptions: SelectOption[] = [],
    isLoadingFactories: boolean = false
): FormFieldConfig[] => {
    return [
        // Factory
        {
            name: 'factoryId',
            label: t('zoneManagement.form.fields.factory'),
            type: 'select',
            placeholder: t('zoneManagement.form.placeholders.factory'),
            required: VALIDATION_CONFIG.FACTORY_ID.required,
            options: factoryOptions,
            loading: isLoadingFactories,
            disabled: isLoadingFactories,
            rules: [
                {
                    required: VALIDATION_CONFIG.FACTORY_ID.required,
                    message: t('zoneManagement.form.validation.required'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
        // Order
        {
            name: 'displayOrder',
            label: t('zoneManagement.form.fields.order'),
            type: 'number',
            placeholder: t('zoneManagement.form.placeholders.order'),
            required: VALIDATION_CONFIG.DISPLAY_ORDER.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.DISPLAY_ORDER.required,
                    message: t('zoneManagement.form.validation.required'),
                },
                {
                    type: 'number',
                    min: VALIDATION_CONFIG.DISPLAY_ORDER.min,
                    message: t('zoneManagement.form.validation.minValue', {
                        min: VALIDATION_CONFIG.DISPLAY_ORDER.min,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Zone Code
        {
            name: 'zoneCode',
            label: t('zoneManagement.form.fields.zoneCode'),
            type: 'text',
            placeholder: t('zoneManagement.form.placeholders.zoneCode'),
            required: VALIDATION_CONFIG.ZONE_CODE.required,
            maxLength: VALIDATION_CONFIG.ZONE_CODE.maxLength,
            rules: [
                {
                    required: VALIDATION_CONFIG.ZONE_CODE.required,
                    message: t('zoneManagement.form.validation.required'),
                },
                {
                    max: VALIDATION_CONFIG.ZONE_CODE.maxLength,
                    message: t('zoneManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.ZONE_CODE.maxLength,
                    }),
                },
                {
                    min: VALIDATION_CONFIG.ZONE_CODE.minLength,
                    message: t('zoneManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.ZONE_CODE.minLength,
                    }),
                },
                {
                    pattern: VALIDATION_CONFIG.ZONE_CODE.pattern,
                    message: t('zoneManagement.form.validation.zoneCodePattern'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Zone Name
        {
            name: 'zoneName',
            label: t('zoneManagement.form.fields.zoneName'),
            type: 'text',
            placeholder: t('zoneManagement.form.placeholders.zoneName'),
            required: VALIDATION_CONFIG.ZONE_NAME.required,
            maxLength: VALIDATION_CONFIG.ZONE_NAME.maxLength,
            rules: [
                {
                    required: VALIDATION_CONFIG.ZONE_NAME.required,
                    message: t('zoneManagement.form.validation.required'),
                },
                {
                    max: VALIDATION_CONFIG.ZONE_NAME.maxLength,
                    message: t('zoneManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.ZONE_NAME.maxLength,
                    }),
                },
                {
                    min: VALIDATION_CONFIG.ZONE_NAME.minLength,
                    message: t('zoneManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.ZONE_NAME.minLength,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Description
        {
            name: 'description',
            label: t('zoneManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('zoneManagement.form.placeholders.description'),
            required: VALIDATION_CONFIG.DESCRIPTION.required,
            span: { xs: 24 },
        },
    ];
};
