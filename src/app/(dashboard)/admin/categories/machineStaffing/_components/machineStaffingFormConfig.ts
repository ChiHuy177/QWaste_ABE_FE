import { FormFieldConfig } from '@/components/shared/FormModal/types';

const VALIDATION_CONFIG = Object.freeze({
    ZONE_ID: { required: true },
    MACHINE_ID: { required: true },
    MACHINE_DISPLAY: { required: false },
    OPERATOR_COUNT: { required: true, min: 1 },
    NOTES: { required: false },
});

export const getMachineStaffingFormFields = (t: any, modalData: any): FormFieldConfig[] => {
    return [
        // ZoneId (hidden)
        {
            name: 'zoneId',
            label: '',
            type: 'number',
            placeholder: '',
            required: VALIDATION_CONFIG.ZONE_ID.required,
            span: { xs: 0 },
        },

        {
            name: 'machineId',
            label: '',
            type: 'text',
            placeholder: '',
            required: VALIDATION_CONFIG.MACHINE_ID.required,
            span: { xs: 0 },
        },

        {
            name: 'machineDisplay',
            label: t('machineStaffing.form.fields.machine'),
            type: 'text',
            placeholder: '',
            required: VALIDATION_CONFIG.MACHINE_DISPLAY.required,
            disabled: true,
            span: { xs: 24, md: 12 },
        },

        {
            name: 'operatorCount',
            label: t('machineStaffing.form.fields.operatorCount'),
            type: 'number',
            placeholder: t('machineStaffing.form.placeholders.operatorCount'),
            required: VALIDATION_CONFIG.OPERATOR_COUNT.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.OPERATOR_COUNT.required,
                    message: t('machineStaffing.form.validation.required'),
                },
                {
                    type: 'number',
                    min: VALIDATION_CONFIG.OPERATOR_COUNT.min,
                    message: t('machineStaffing.form.validation.minValue', {
                        min: VALIDATION_CONFIG.OPERATOR_COUNT.min,
                    }),
                },
            ],
            span: { xs: 24, md: 12 },
        },
        {
            name: 'notes',
            label: t('machineStaffing.form.fields.notes'),
            type: 'textarea' as const,
            placeholder: t('machineStaffing.form.placeholders.notes'),
            required: VALIDATION_CONFIG.NOTES.required,
            span: { xs: 24 },
        },
    ];
};
