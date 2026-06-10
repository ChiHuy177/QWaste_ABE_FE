import { FormFieldConfig } from '@/components/shared/FormModal/types';
import { ZonePickingResponse } from '@/types/Zone';

const VALIDATION_CONFIG = Object.freeze({
    ZONE_ID: { required: true },
    DISPLAY_ORDER: { min: 0, required: true },
    LINE_NAME: { required: true, maxLength: 50 },
    DESCRIPTION: { required: true },
});

export const getLineFormFields = (
    t: any,
    mode: 'create' | 'edit',
    zones: ZonePickingResponse[] = []
): FormFieldConfig[] => {
    const zoneOptions = zones.map((zone) => ({
        value: zone.zoneId,
        label: `${zone.zoneCode} - ${zone.zoneName}`,
    }));
    return [
        // Zone
        {
            name: 'zoneId',
            label: t('lineManagement.form.fields.zone'),
            type: 'select',
            placeholder: t('lineManagement.form.placeholders.zone'),
            required: VALIDATION_CONFIG.ZONE_ID.required,
            options: zoneOptions,
            loading: false,
            disabled: zoneOptions.length === 0,
            rules: [
                {
                    required: VALIDATION_CONFIG.ZONE_ID.required,
                    message: t('lineManagement.form.validation.required'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Order
        {
            name: 'displayOrder',
            label: t('lineManagement.form.fields.order'),
            type: 'number',
            placeholder: t('lineManagement.form.placeholders.order'),
            required: VALIDATION_CONFIG.DISPLAY_ORDER.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.DISPLAY_ORDER.required,
                    message: t('lineManagement.form.validation.required'),
                },
                {
                    type: 'number',
                    min: VALIDATION_CONFIG.DISPLAY_ORDER.min,
                    message: t('lineManagement.form.validation.minValue', {
                        min: VALIDATION_CONFIG.DISPLAY_ORDER.min,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Line Name
        {
            name: 'lineName',
            label: t('lineManagement.form.fields.lineName'),
            type: 'text',
            placeholder: t('lineManagement.form.placeholders.lineName'),
            required: VALIDATION_CONFIG.LINE_NAME.required,
            maxLength: VALIDATION_CONFIG.LINE_NAME.maxLength,
            rules: [
                {
                    required: VALIDATION_CONFIG.LINE_NAME.required,
                    message: t('lineManagement.form.validation.required'),
                },
                {
                    max: VALIDATION_CONFIG.LINE_NAME.maxLength,
                    message: t('lineManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.LINE_NAME.maxLength,
                    }),
                },
            ],
            span: { xs: 24 },
        },

        // Description
        {
            name: 'description',
            label: t('lineManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('lineManagement.form.placeholders.description'),
            required: VALIDATION_CONFIG.DESCRIPTION.required,
            span: { xs: 24 },
        },
    ];
};
