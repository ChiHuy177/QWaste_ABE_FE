import { TFunction } from 'i18next';
import { FormFieldConfig } from '@/components/shared/FormModal/types';
import { getAllSubjects } from '@/configs/permissions/permissionRegistry';
import { ACTIONS } from '@/configs/permissions/caslAbility';

export const getPermissionFormFields = (t: TFunction, mode: 'create' | 'edit'): FormFieldConfig[] => {
    const subjects = getAllSubjects();
    const actions = ACTIONS;

    return [
        // Permission Name
        {
            name: 'permissionName',
            label: t('permissionManagement.form.permissionName.label'),
            type: 'text',
            placeholder: t('permissionManagement.form.permissionName.placeholder'),
            required: true,
            rules: [
                {
                    required: true,
                    message: t('permissionManagement.form.permissionName.required'),
                },
                {
                    min: 3,
                    message: t('permissionManagement.form.permissionName.minLength'),
                },
                {
                    max: 255,
                    message: t('permissionManagement.form.permissionName.maxLength'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Subject
        {
            name: 'subject',
            label: t('permissionManagement.form.subject.label'),
            type: 'select',
            placeholder: t('permissionManagement.form.subject.placeholder'),
            required: true,
            options: subjects.map((s) => ({
                value: s,
                label: t(`permissionSubjects.${s}`, { defaultValue: s }),
            })),
            rules: [
                {
                    required: true,
                    message: t('permissionManagement.form.subject.required'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },

        // Action (dropdown)
        {
            name: 'action',
            label: t('permissionManagement.form.action.label'),
            type: 'select',
            placeholder: t('permissionManagement.form.action.placeholder'),
            required: false,
            mode: mode === 'create' ? 'multiple' : undefined,
            options: actions.map((a) => ({
                value: a,
                label: t(`common.${a}`),
            })),
            rules: [
                {
                    validator: (_: unknown, _value: string | string[], _callback: unknown) => {
                        // Will be validated together with customAction in form level
                        return Promise.resolve();
                    },
                },
            ],
            span: { xs: 24, sm: 12 },
            dependencies: ['customAction'],
            disabledWhen: (values: Record<string, unknown>) =>
                typeof values.customAction === 'string' && !!values.customAction.trim(),
        },

        // Custom Action (text input)
        {
            name: 'customAction',
            label: t('permissionManagement.form.customAction.label'),
            type: 'text',
            placeholder: t('permissionManagement.form.customAction.placeholder'),
            required: false,
            extra: t('permissionManagement.form.customAction.extra'),
            span: { xs: 24, sm: 12 },
            dependencies: ['action'],
            disabledWhen: (values: Record<string, unknown>) =>
                mode === 'create' && Array.isArray(values.action) && values.action.length > 0,
        },

        // Description
        {
            name: 'description',
            label: t('permissionManagement.form.description.label'),
            type: 'textarea',
            placeholder: t('permissionManagement.form.description.placeholder'),
            required: true,
            rules: [
                {
                    required: true,
                    message: t('permissionManagement.form.description.required'),
                },
            ],
            rows: 3,
            span: { xs: 24 },
        },
    ];
};
