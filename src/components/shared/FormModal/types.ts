import { Rule } from 'antd/es/form';
import { AuditMetaData } from '@/types/Metadata';

export type FieldType =
    | 'text'
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
    disabledWhen?: (values: Record<string, any>) => boolean;
    dependencies?: string[];
    rules?: Rule[];
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
    render?: (props: any) => React.ReactNode;
    renderCustom?: (fieldKey: string) => React.ReactNode;
    onChange?: (value: any, form?: any) => void;
    value?: any;
    normalize?: (value: any) => any;
    textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
}

export interface EntityFormModalProps<TFormData extends Record<string, any>> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: TFormData, mode: 'create' | 'edit') => Promise<void>;
    mode: 'create' | 'edit';
    initialData?: TFormData | null;
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
