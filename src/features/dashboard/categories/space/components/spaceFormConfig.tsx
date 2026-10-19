import { TFunction } from 'i18next';
import { FormFieldConfig } from '@/components/shared/FormModal';
import type { SpaceTreeSelectOption } from '@/components/shared/filters/SpaceTreeSelect';

const VALIDATION_CONFIG = Object.freeze({
    SPACE_CODE: { min: 2, max: 10, pattern: '^[a-zA-Z0-9_-]+$', required: true },
    SPACE_NAME: { min: 5, max: 50, required: true },
    DISPLAY_ORDER: { min: 1, required: true, maxLength: 9 },
    FLOOR_PLAN_IMAGE_URL: { required: false },
    DESCRIPTION: { max: 2000, required: false },
});

export interface SpaceFormFieldOptions {
    spaceTreeData?: SpaceTreeSelectOption[];
    spaceLevelOptions?: { value: number; label: string }[];
    isLevelDisabled?: boolean;
    levelExtra?: string;
    onLevelChange?: (spaceLevelId: number) => void;

    isParentDisabled?: boolean;
    parentPlaceholder?: string;
    parentExtra?: string;
    onParentChange?: (parentSpaceId: number | null) => void;
    validateParentSpace?: (parentSpaceId: number | null) => string | null;
}

export const getSpaceFormFields = (
    t: TFunction,
    mode: 'create' | 'edit',
    options?: SpaceFormFieldOptions
): FormFieldConfig[] => {
    return [
        {
            name: 'spaceLevelId',
            label: t('spaceManagement.form.fields.level', { defaultValue: 'Cấp khu vực' }),
            type: 'select',
            placeholder: t('spaceManagement.form.placeholders.level', {
                defaultValue: 'Chọn cấp khu vực...',
            }),
            required: true,
            span: { xs: 24, sm: 10 },
            options: options?.spaceLevelOptions || [],
            disabled: mode === 'edit' ? true : options?.isLevelDisabled,
            extra:
                options?.levelExtra ||
                (mode === 'edit'
                    ? t('spaceManagement.form.help.levelEditDisabled', {
                          defaultValue: 'Không thể thay đổi cấp khu vực khi cập nhật.',
                      })
                    : undefined),
            onChange: options?.onLevelChange,
            rules: [
                {
                    required: true,
                    message: t('spaceManagement.form.validation.required', {
                        defaultValue: 'This field is required',
                    }),
                },
            ],
        },
        {
            name: 'parentSpaceId',
            label: t('spaceManagement.form.fields.parentSpace'),
            type: 'space-tree-select',
            placeholder:
                options?.parentPlaceholder ||
                t('spaceManagement.form.placeholders.selectParentSpace', {
                    defaultValue: 'Chọn khu vực cha...',
                }),
            required: false,
            allowClear: true,
            span: { xs: 24, sm: 14 },
            treeData: options?.spaceTreeData,
            treeDefaultExpandAll: true,
            disabled: options?.isParentDisabled,
            extra: options?.parentExtra,
            onChange: options?.onParentChange,
            rules: [
                {
                    validator: async (_, value) => {
                        if (options?.validateParentSpace) {
                            const errorMsg = options.validateParentSpace(value ?? null);
                            if (errorMsg) {
                                return Promise.reject(new Error(errorMsg));
                            }
                        }
                        return Promise.resolve();
                    },
                },
            ],
        },

        {
            name: 'spaceCode',
            label: t('spaceManagement.form.fields.code'),
            type: 'text',
            textTransform: 'uppercase',
            placeholder: t('spaceManagement.form.placeholders.code'),
            required: VALIDATION_CONFIG.SPACE_CODE.required,
            maxLength: VALIDATION_CONFIG.SPACE_CODE.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.SPACE_CODE.required,
                    message: t('spaceManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.SPACE_CODE.min,
                    message: t('spaceManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.SPACE_CODE.min,
                    }),
                },
                {
                    pattern: new RegExp(VALIDATION_CONFIG.SPACE_CODE.pattern),
                    message: t('spaceManagement.form.validation.codePattern'),
                },
            ],
            span: { xs: 24, sm: 9 },
        },
        {
            name: 'spaceName',
            label: t('spaceManagement.form.fields.name'),
            type: 'text',
            placeholder: t('spaceManagement.form.placeholders.name', {
                defaultValue: 'Enter name...',
            }),
            required: VALIDATION_CONFIG.SPACE_NAME.required,
            maxLength: VALIDATION_CONFIG.SPACE_NAME.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.SPACE_NAME.required,
                    message: t('spaceManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.SPACE_NAME.min,
                    message: t('spaceManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.SPACE_NAME.min,
                    }),
                },
            ],
            span: { xs: 24, sm: 9 },
        },
        {
            name: 'displayOrder',
            label: t('spaceManagement.form.fields.order'),
            type: 'number',
            placeholder: '0',
            maxLength: VALIDATION_CONFIG.DISPLAY_ORDER.maxLength,
            required: VALIDATION_CONFIG.DISPLAY_ORDER.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.DISPLAY_ORDER.required,
                    message: t('spaceManagement.form.validation.required', {
                        defaultValue: 'This field is required',
                    }),
                },
                {
                    type: 'number',
                    min: VALIDATION_CONFIG.DISPLAY_ORDER.min,
                    message: t('spaceManagement.form.validation.minValue', {
                        min: VALIDATION_CONFIG.DISPLAY_ORDER.min,
                    }),
                },
            ],
            span: { xs: 24, sm: 6 },
        },
        {
            name: 'floorPlanImageUrl',
            label: t('spaceManagement.form.fields.floorPlanImageUrl'),
            type: 'image',
            placeholder: t('spaceManagement.form.placeholders.floorPlanImageUrl'),
            required: VALIDATION_CONFIG.FLOOR_PLAN_IMAGE_URL.required,
            extra: t('spaceManagement.form.help.floorPlanImageUrl'),
            imageUpload: {
                preserveOriginal: true,
                accept: 'image/*,.svg',
                maxFileSizeMB: 4,
                svgMaxFileSizeMB: 10,
                previewAlt: t('spaceManagement.form.fields.floorPlanImageUrl'),
                supportText: t('spaceManagement.form.upload.floorPlanImageUrlSupportText'),
            },
            span: { xs: 24 },
        },
        {
            name: 'description',
            label: t('spaceManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('spaceManagement.form.placeholders.description', {
                defaultValue: 'Optional description...',
            }),
            required: VALIDATION_CONFIG.DESCRIPTION.required,
            maxLength: VALIDATION_CONFIG.DESCRIPTION.max,
            span: { xs: 24 },
        },
    ];
};
