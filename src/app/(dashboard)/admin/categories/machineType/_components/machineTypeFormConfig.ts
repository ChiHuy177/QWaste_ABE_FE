import { FormFieldConfig } from '../../../../../../components/shared/FormModal/types';

export const getMachineTypeFormFields = (
    t: any,
    mode: 'create' | 'edit'
): FormFieldConfig[] => {
    return [
        // Machine Type Name
        {
            name: 'machineTypeName',
            label: t('machineTypeManagement.form.fields.machineTypeName'),
            type: 'text',
            placeholder: t('machineTypeManagement.form.placeholders.machineTypeName'),
            required: true,
            rules: [
                {
                    required: true,
                    message: t('machineTypeManagement.form.validation.required'),
                },
                {
                    max: 50,
                    message: t('machineTypeManagement.form.validation.maxLength', { max: 50 }),
                },
            ],
            span: { xs: 24 },
        },

        // Description
        {
            name: 'description',
            label: t('machineTypeManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('machineTypeManagement.form.placeholders.description'),
            required: true,
            rules: [
                {
                    required: true,
                    message: t('machineTypeManagement.form.validation.required'),
                },
                {
                    max: 255,
                    message: t('machineTypeManagement.form.validation.maxLength', { max: 255 }),
                },
            ],
            span: { xs: 24 },
        },
    ];
};
