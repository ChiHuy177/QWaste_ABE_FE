import { FormFieldConfig } from '@/components/shared/FormModal/types';
import { SelectOption } from '@/types/Common';
import { SpaceWithChildrenResponse } from '@/types/Space';
import { TFunction } from 'i18next';

export const flattenSpacesToOptions = (
    spaces: SpaceWithChildrenResponse[],
    parentPath: string = ''
): SelectOption[] => {
    let options: SelectOption[] = [];
    for (const space of spaces) {
        const spaceName = space.spaceName || space.spaceCode || '';
        const currentPath = parentPath ? `${parentPath} / ${spaceName}` : spaceName;
        const label =
            space.spaceName && space.spaceCode && space.spaceName !== space.spaceCode
                ? `${currentPath} (${space.spaceCode})`
                : currentPath;

        options.push({
            value: space.spaceId,
            label,
        });

        if (space.children && space.children.length > 0) {
            options = options.concat(flattenSpacesToOptions(space.children, currentPath));
        }
    }
    return options;
};

interface StaffFormFieldsOptions {
    spaceOptions?: SelectOption[];
    spaceLoading?: boolean;
}
const VALIDATION_CONFIG = Object.freeze({
    FULL_NAME_LENGHT: { min: 6, max: 255, required: true },
    EMAIL: { max: 255, required: true },
    USERNAME: { min: 3, max: 100, required: true },
    PASSWORD: { min: 6, max: 255, required: true },
    USER_CODE: { pattern: /^[0-9a-zA-Z]{7}$/, max: 7, required: true },
    ADDRESS: { min: 5, max: 500, required: true },
    PHONE_NUMBER: { pattern: /^[0-9]{10}$/, max: 10, required: true },
    ROLE: { required: true },
    GENDER: { required: true },
    ACCESSIBLE_SPACES: { required: false },
});

export const getStaffFormFields = (
    t: TFunction,
    mode: 'create' | 'edit',
    options?: StaffFormFieldsOptions
): FormFieldConfig[] => {
    const spaceOptions = options?.spaceOptions ?? [];
    const spaceLoading = options?.spaceLoading ?? false;
    const roleOptions = [
        { value: 1, label: t('staffManagement.form.fields.role.admin') },
        { value: 2, label: t('staffManagement.form.fields.role.director') },
        { value: 3, label: t('staffManagement.form.fields.role.manager') },
        { value: 4, label: t('staffManagement.form.fields.role.qc') },
        { value: 5, label: t('staffManagement.form.fields.role.operator') },
        { value: 6, label: t('staffManagement.form.fields.role.maintenance') },
    ];

    return [
        // Full Name
        {
            name: 'fullname',
            label: t('staffManagement.form.fields.fullName'),
            type: 'text',
            placeholder: t('staffManagement.form.placeholders.fullName'),
            required: VALIDATION_CONFIG.FULL_NAME_LENGHT.required,
            maxLength: VALIDATION_CONFIG.FULL_NAME_LENGHT.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.FULL_NAME_LENGHT.required,
                    message: t('staffManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.FULL_NAME_LENGHT.min,
                    message: t('staffManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.FULL_NAME_LENGHT.min,
                    }),
                },
                {
                    max: VALIDATION_CONFIG.FULL_NAME_LENGHT.max,
                    message: t('staffManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.FULL_NAME_LENGHT.max,
                    }),
                },
            ],
            span: { xs: 24 },
        },

        // Email
        {
            name: 'email',
            label: t('staffManagement.form.fields.email'),
            type: 'email',
            placeholder: t('staffManagement.form.placeholders.email'),
            required: VALIDATION_CONFIG.EMAIL.required,
            maxLength: VALIDATION_CONFIG.EMAIL.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.EMAIL.required,
                    message: t('staffManagement.form.validation.required'),
                },
                {
                    type: 'email',
                    message: t('staffManagement.form.validation.invalidEmail'),
                },
                {
                    max: VALIDATION_CONFIG.EMAIL.max,
                    message: t('staffManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.EMAIL.max,
                    }),
                },
            ],
            span: { xs: 24 },
        },

        // Username
        {
            name: 'username',
            label: t('staffManagement.form.fields.username'),
            type: 'text',
            placeholder: t('staffManagement.form.placeholders.username'),
            required: VALIDATION_CONFIG.USERNAME.required,
            disabled: (mode) => mode === 'edit',
            maxLength: VALIDATION_CONFIG.USERNAME.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.USERNAME.required,
                    message: t('staffManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.USERNAME.min,
                    message: t('staffManagement.form.validation.usernameMin', {
                        min: VALIDATION_CONFIG.USERNAME.min,
                    }),
                },
                {
                    max: VALIDATION_CONFIG.USERNAME.max,
                    message: t('staffManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.USERNAME.max,
                    }),
                },
            ],
            span: { xs: 24, md: 12 },
        },

        // Password - Only show in CREATE mode
        {
            name: 'password',
            label: t('staffManagement.form.fields.password'),
            type: 'password',
            placeholder: t('staffManagement.form.placeholders.password'),
            required: VALIDATION_CONFIG.PASSWORD.required,
            hidden: (mode) => mode === 'edit',
            maxLength: VALIDATION_CONFIG.PASSWORD.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.PASSWORD.required,
                    message: t('staffManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.PASSWORD.min,
                    message: t('staffManagement.form.validation.passwordMin', {
                        min: VALIDATION_CONFIG.PASSWORD.min,
                    }),
                },
                {
                    max: VALIDATION_CONFIG.PASSWORD.max,
                    message: t('staffManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.PASSWORD.max,
                    }),
                },
            ],
            span: { xs: 24, md: 12 },
        },

        // User Code
        {
            name: 'userCode',
            label: t('staffManagement.form.fields.userCode'),
            type: 'text',
            placeholder: t('staffManagement.form.placeholders.userCode'),
            required: VALIDATION_CONFIG.USER_CODE.required,
            disabled: (mode) => mode === 'edit',
            maxLength: 7,
            rules: [
                {
                    required: VALIDATION_CONFIG.USER_CODE.required,
                    message: t('staffManagement.form.validation.required'),
                },
                {
                    pattern: VALIDATION_CONFIG.USER_CODE.pattern,
                    message: t('staffManagement.form.validation.userCodeFormat'),
                },
            ],
            span: { xs: 24, md: 12 },
        },

        // Address
        {
            name: 'address',
            label: t('staffManagement.form.fields.address'),
            type: 'address-autocomplete',
            placeholder: t('staffManagement.form.placeholders.address'),
            required: VALIDATION_CONFIG.ADDRESS.required,
            maxLength: VALIDATION_CONFIG.ADDRESS.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.ADDRESS.required,
                    message: t('staffManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.ADDRESS.min,
                    message: t('staffManagement.form.validation.addressMin'),
                },
                {
                    max: VALIDATION_CONFIG.ADDRESS.max,
                    message: t('staffManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.ADDRESS.max,
                    }),
                },
            ],
            span: { xs: 24, md: 12 },
        },

        // Phone Number
        {
            name: 'phoneNumber',
            label: t('staffManagement.form.fields.phoneNumber'),
            type: 'text',
            placeholder: t('staffManagement.form.placeholders.phoneNumber'),
            required: VALIDATION_CONFIG.PHONE_NUMBER.required,
            maxLength: VALIDATION_CONFIG.PHONE_NUMBER.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.PHONE_NUMBER.required,
                    message: t('staffManagement.form.validation.required'),
                },
                {
                    pattern: VALIDATION_CONFIG.PHONE_NUMBER.pattern,
                    message: t('staffManagement.form.validation.invalidPhone'),
                },
            ],
            span: { xs: 24, md: 12 },
        },

        // Role - only visible in create mode
        {
            name: 'roles',
            label: t('staffManagement.form.fields.role.title'),
            type: 'select',
            mode: 'multiple',
            placeholder: t('staffManagement.form.placeholders.role'),
            required: VALIDATION_CONFIG.ROLE.required,
            hidden: (mode) => mode === 'edit' || mode === 'create',
            options: roleOptions,
            rules: [
                {
                    required: VALIDATION_CONFIG.ROLE.required,
                    message: t('staffManagement.form.validation.required'),
                },
            ],
            span: { xs: 24, md: 12 },
        },

        // Gender
        {
            name: 'gender',
            label: t('staffManagement.form.fields.gender.title'),
            type: 'select',
            placeholder: t('staffManagement.form.placeholders.gender'),
            required: VALIDATION_CONFIG.GENDER.required,
            options: [
                { value: 'MALE', label: t('staffManagement.form.fields.gender.male') },
                { value: 'FEMALE', label: t('staffManagement.form.fields.gender.female') },
            ],
            rules: [
                {
                    required: VALIDATION_CONFIG.GENDER.required,
                    message: t('staffManagement.form.validation.required'),
                },
            ],
            span: { xs: 24, md: 12 },
        },

        // Accessible Spaces
        {
            name: 'accessibleSpaceIds',
            label: t('staffManagement.form.fields.accessibleSpaces'),
            type: 'select',
            mode: 'multiple',
            maxTagCount: 'responsive',
            placeholder: t('staffManagement.form.placeholders.accessibleSpaces'),
            required: VALIDATION_CONFIG.ACCESSIBLE_SPACES.required,
            options: spaceOptions,
            loading: spaceLoading,
            allowClear: true,
            span: { xs: 24, md: 12 },
        },
    ];
};
