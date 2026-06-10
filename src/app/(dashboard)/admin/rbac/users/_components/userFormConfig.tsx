import { FormFieldConfig } from '@/components/shared/FormModal/types';

export const getUserBasicInfoFields = (t: any, mode: 'create' | 'edit'): FormFieldConfig[] => {
    return [
        // Username
        {
            name: 'username',
            label: t('userManagement.form.username.label'),
            type: 'text',
            placeholder: t('userManagement.form.username.placeholder'),
            required: true,
            disabled: mode === 'edit',
            rules: [
                {
                    required: true,
                    message: t('userManagement.form.username.required'),
                },
                {
                    min: 3,
                    max: 50,
                    message: t('userManagement.form.username.lengthError'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Email
        {
            name: 'email',
            label: t('userManagement.form.email.label'),
            type: 'email',
            placeholder: t('userManagement.form.email.placeholder'),
            required: true,
            rules: [
                {
                    required: true,
                    message: t('userManagement.form.email.required'),
                },
                {
                    type: 'email',
                    message: t('userManagement.form.email.validError'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // First Name
        {
            name: 'firstName',
            label: t('userManagement.form.firstName.label'),
            type: 'text',
            placeholder: t('userManagement.form.firstName.placeholder'),
            required: true,
            rules: [
                {
                    required: true,
                    message: t('userManagement.form.firstName.required'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Last Name
        {
            name: 'lastName',
            label: t('userManagement.form.lastName.label'),
            type: 'text',
            placeholder: t('userManagement.form.lastName.placeholder'),
            required: true,
            rules: [
                {
                    required: true,
                    message: t('userManagement.form.lastName.required'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Phone Number
        {
            name: 'phoneNumber',
            label: t('userManagement.form.phoneNumber.label'),
            type: 'text',
            placeholder: t('userManagement.form.phoneNumber.placeholder'),
            required: false,
            span: { xs: 24, sm: 12 },
        },

        // User Code
        {
            name: 'userCode',
            label: t('userManagement.form.userCode.label'),
            type: 'text',
            placeholder: t('userManagement.form.userCode.placeholder'),
            required: false,
            span: { xs: 24, sm: 12 },
        },

        // Address
        {
            name: 'address',
            label: t('userManagement.form.address.label'),
            type: 'textarea',
            placeholder: t('userManagement.form.address.placeholder'),
            required: false,
            rows: 2,
            span: { xs: 24 },
        },
    ];
};
