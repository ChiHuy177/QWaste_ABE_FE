import { FormFieldConfig } from '../../../../../../components/shared/FormModal/types';

export const getGroupFormFields = (t: any, mode: 'create' | 'edit'): FormFieldConfig[] => {
    return [
        // Group Name
        {
            name: 'groupName',
            label: t('groupManagement.form.fields.groupName'),
            type: 'text',
            placeholder: t('groupManagement.form.placeholders.groupName'),
            required: true,
            rules: [
                {
                    required: true,
                    message: t('groupManagement.form.validation.required'),
                },
            ],
            span: { xs: 24 },
        },

        // Description
        {
            name: 'description',
            label: t('groupManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('groupManagement.form.placeholders.description'),
            required: true,
            rules: [
                {
                    required: true,
                    message: t('groupManagement.form.validation.required'),
                },
            ],
            span: { xs: 24 },
        },
    ];
};
