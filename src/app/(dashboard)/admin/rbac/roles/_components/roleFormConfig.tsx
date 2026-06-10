import { FormFieldConfig } from '@/components/shared/FormModal/types';
import { PermissionChecklist } from './PermissionChecklist';

export const getRoleFormFields = (t: any, mode: 'create' | 'edit'): FormFieldConfig[] => {
    return [
        // Role Name
        {
            name: 'roleName',
            label: t('roleManagement.form.roleName.label'),
            type: 'text',
            placeholder: t('roleManagement.form.roleName.placeholder'),
            required: true,
            disabled: mode === 'edit',
            rules: [
                {
                    required: true,
                    message: t('roleManagement.form.roleName.required'),
                },
                {
                    min: 2,
                    max: 50,
                    message: t('roleManagement.form.roleName.lengthError'),
                },
            ],
            span: { xs: 24 },
        },

        // Description
        {
            name: 'description',
            label: t('roleManagement.form.description.label'),
            type: 'textarea',
            placeholder: t('roleManagement.form.description.placeholder'),
            required: false,
            rows: 2,
            span: { xs: 24 },
        },

        // Permission Checklist
        {
            name: 'permissionIds',
            label: t('roleManagement.form.permissions.label'),
            type: 'text',
            required: true,
            rules: [
                {
                    required: true,
                    message: t('roleManagement.form.permissions.required'),
                },
            ],
            render: (props) => <PermissionChecklist {...props} />,
            span: { xs: 24 },
        },
    ];
};
