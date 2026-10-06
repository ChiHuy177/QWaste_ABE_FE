import { Rule } from 'antd/es/form';
import { AuditMetaData } from '@/types/Metadata';

export type FieldType =
    | 'text'
    | 'time'
    | 'email'
    | 'password'
    | 'number'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'textarea'
    | 'date'
    | 'image'
    | 'duration'
    | 'pdf-upload'
    | 'address-autocomplete'
    | 'space-tree-select'
    | 'switch'
    | 'custom';

export interface FormFieldConfig {
    name: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean | ((mode: 'create' | 'edit') => boolean);
    disabledWhen?: (values: Record<string, unknown>) => boolean;
    dependencies?: string[];
    rules?: Rule[];
    // `value`/`defaultValue`/`onChange`/`normalize`/`render` below are deliberately `any`:
    // this config drives ~10 FieldType variants (text/number/date/image/switch/...) each with
    // a different value shape (string/number/Dayjs/File/boolean/...). Tightening to `unknown`
    // would require narrowing at every one of those call sites for no real safety gain, since
    // the actual type is already determined by `type` at each usage site.
    options?: { value: any; label: string }[];
    loading?: boolean;
    span?: {
        xs?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    extra?: string;
    defaultValue?: any;
    hidden?: boolean | ((mode: 'create' | 'edit') => boolean);
    maxLength?: number;
    showCount?: boolean;
    allowClear?: boolean;
    rows?: number;
    min?: number;
    max?: number;
    allowDecimal?: boolean;
    decimalPlaces?: number;
    mode?: 'multiple' | 'tags';
    maxTagCount?: number | 'responsive';
    render?: (props: any) => React.ReactNode;
    renderCustom?: (fieldKey: string) => React.ReactNode;
    onChange?: (value: any, form?: any) => void;
    value?: any;
    normalize?: (value: any) => any;
    textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    imageUpload?: {
        preserveOriginal?: boolean;
        accept?: string;
        maxFileSizeMB?: number;
        svgMaxFileSizeMB?: number;
        previewAlt?: string;
        supportText?: string;
    };
}

export interface EntityFormModalProps<TFormData extends Record<string, unknown>> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: TFormData, mode: 'create' | 'edit') => Promise<void>;
    mode: 'create' | 'edit';
    initialData?: Partial<TFormData> | null;
    fields: FormFieldConfig[];
    title?: {
        create: string;
        edit: string;
    };
    description?: {
        create?: string;
        edit?: string;
    };
    width?:
    | number
    | { xs?: string | string; sm?: number | string; md?: number | string; lg?: string };
    buttonLabels?: {
        cancel: string;
        create: string;
        edit: string;
        saving: string;
    };
    auditMetaData?: AuditMetaData | null;
    t?: (key: string) => string;
    loading?: boolean;
    /** Extra content rendered inside the form, below the generated fields */
    children?: React.ReactNode;
    layout?: 'default' | 'tabs';
}
