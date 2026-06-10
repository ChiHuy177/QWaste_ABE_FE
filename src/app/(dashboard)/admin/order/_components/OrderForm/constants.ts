import { FileTextOutlined, NodeIndexOutlined, CheckCircleOutlined } from '@ant-design/icons';

export const WIZARD_STEPS = [
    { titleKey: 'orderManagement.form.steps.info', icon: FileTextOutlined },
    { titleKey: 'orderManagement.form.steps.drawing', icon: NodeIndexOutlined },
    { titleKey: 'orderManagement.form.steps.confirm', icon: CheckCircleOutlined },
];

export const PDF_ICON_SVG =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48' fill='none'><rect width='24' height='24' rx='4' fill='%23FFF1F0'/><path d='M6 19V5a2 2 0 0 1 2-2h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z' fill='%23FFF1F0' stroke='%23FF4D4F' stroke-width='1.5'/><path d='M14 3v4a1 1 0 0 0 1 1h4' stroke='%23FF4D4F' stroke-width='1.5'/><text x='11' y='16' fill='%23FF4D4F' font-family='sans-serif' font-size='5.5' font-weight='bold' text-anchor='middle'>PDF</text></svg>";

export const DEFAULT_FORM_VALUES = {
    orderPriority: 'MEDIUM',
    orderDrawings: [],
    attachments: [],
};

export const PRODUCTION_TYPE_OPTIONS = [
    { value: 'BATCH', labelKey: 'orderManagement.form.productionTypes.batch' },
    { value: 'SINGLE_PIECE', labelKey: 'orderManagement.form.productionTypes.single' },
];

export const PRIORITY_OPTIONS = [
    { value: 'LOW', labelKey: 'orderManagement.form.priorities.low' },
    { value: 'MEDIUM', labelKey: 'orderManagement.form.priorities.medium' },
    { value: 'HIGH', labelKey: 'orderManagement.form.priorities.high' },
    { value: 'URGENT', labelKey: 'orderManagement.form.priorities.urgent' },
];

export const PRIORITY_TAG_COLORS: Record<string, string> = {
    LOW: 'default',
    MEDIUM: 'blue',
    HIGH: 'orange',
    URGENT: 'red',
};

export const ORDER_STATUS_TAG_COLORS: Record<string, string> = {
    COMPLETED: 'success',
    IN_PROGRESS: 'processing',
    CANCELLED: 'error',
    REVIEWING: 'default',
};
