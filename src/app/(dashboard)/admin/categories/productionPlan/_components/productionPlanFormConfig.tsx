import { FormFieldConfig } from '@/components/shared/FormModal/types';

const VALIDATION_CONFIG = Object.freeze({
    MACHINE_ID: { required: true, min: 1 },
});

export const getProductionPlanFormFields = (t: any, _mode: 'create' | 'edit'): FormFieldConfig[] => {
    return [
        {
            name: 'filterId',
            label: t('productionPlanManagement.form.fields.filterId'),
            type: 'select',
            placeholder: t('productionPlanManagement.form.placeholders.filterId'),
            required: true,
            options: [
                { label: t('productionPlanManagement.form.filterOptions.day'), value: 'DAY' },
                { label: t('productionPlanManagement.form.filterOptions.week'), value: 'WEEK' },
            ],
            rules: [
                {
                    required: true,
                    message: t('productionPlanManagement.form.validation.required'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
        {
            name: 'machineId',
            label: t('productionPlanManagement.form.fields.machineId'),
            type: 'number',
            placeholder: t('productionPlanManagement.form.placeholders.machineId'),
            required: VALIDATION_CONFIG.MACHINE_ID.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.MACHINE_ID.required,
                    message: t('productionPlanManagement.form.validation.required'),
                },
                {
                    type: 'number',
                    min: VALIDATION_CONFIG.MACHINE_ID.min,
                    message: t('productionPlanManagement.form.validation.minValue', {
                        min: VALIDATION_CONFIG.MACHINE_ID.min,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
    ];
};
