import { FormFieldConfig } from '@/components/shared/FormModal/types';
import { DurationPicker } from '@/components/shared/DurationPicker';

const VALIDATION_CONFIG = Object.freeze({
    STEP_NAME: { required: true, maxLength: 100 },
    DESCRIPTION: { maxLength: 2000 },
    MATERIAL_NAME: { maxLength: 500 },
    COMPLETION_TIME: { required: true, min: 0 },
});

export const getStepFormFields = (t: any): FormFieldConfig[] => {
    return [
        {
            name: 'stepName',
            label: t('stepManagement.form.fields.stepName'),
            type: 'text',
            placeholder: t('stepManagement.form.placeholders.stepName'),
            required: VALIDATION_CONFIG.STEP_NAME.required,
            maxLength: VALIDATION_CONFIG.STEP_NAME.maxLength,
            rules: [
                {
                    required: VALIDATION_CONFIG.STEP_NAME.required,
                    message: t('stepManagement.form.validation.stepNameRequired'),
                },
                {
                    max: VALIDATION_CONFIG.STEP_NAME.maxLength,
                    message: t('stepManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.STEP_NAME.maxLength,
                    }),
                },
            ],
            span: { xs: 24, sm: 24 },
        },
        {
            name: 'materialName',
            label: t('stepManagement.form.fields.materialName'),
            type: 'textarea',
            placeholder: t('stepManagement.form.placeholders.materialName'),
            maxLength: VALIDATION_CONFIG.MATERIAL_NAME.maxLength,
            rules: [
                {
                    max: VALIDATION_CONFIG.MATERIAL_NAME.maxLength,
                    message: t('stepManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.MATERIAL_NAME.maxLength,
                    }),
                },
            ],
            span: { xs: 24, sm: 24 },
            rows: 2,
        },
        {
            name: 'description',
            label: t('stepManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('stepManagement.form.placeholders.description'),
            maxLength: VALIDATION_CONFIG.DESCRIPTION.maxLength,
            rules: [
                {
                    max: VALIDATION_CONFIG.DESCRIPTION.maxLength,
                    message: t('stepManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.DESCRIPTION.maxLength,
                    }),
                },
            ],
            span: { xs: 24, sm: 24 },
        },
        {
            name: 'defaultCompletionTimeSeconds',
            label: t('stepManagement.form.fields.defaultTime'),
            type: 'custom',
            required: VALIDATION_CONFIG.COMPLETION_TIME.required,
            renderCustom: (fieldKey) => <DurationPicker size="middle" disabled={false} />,
            rules: [
                {
                    required: VALIDATION_CONFIG.COMPLETION_TIME.required,
                    message: t('stepManagement.form.validation.defaultTimeRequired'),
                },
                {
                    type: 'number',
                    min: VALIDATION_CONFIG.COMPLETION_TIME.min,
                    message: t('stepManagement.form.validation.defaultTimeMin'),
                },
            ],
            span: { xs: 24, sm: 16 },
        },
        {
            name: 'requiresQc',
            label: t('stepManagement.form.fields.requiresQc'),
            type: 'switch',
            span: { xs: 24, sm: 8 },
            // Initial value for switch can be passed when FormModal is opened
            // via initialData or managed natively (default false)
        },
    ];
};
