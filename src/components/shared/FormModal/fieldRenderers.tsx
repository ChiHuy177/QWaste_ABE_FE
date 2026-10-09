import React, { useEffect } from 'react';
import {
    Input,
    Select,
    InputNumber,
    DatePicker,
    Upload,
    UploadProps,
    message,
    Image,
    Switch,
    Tooltip,
} from 'antd';
import {
    EyeInvisibleOutlined,
    EyeOutlined,
    CameraOutlined,
    DeleteOutlined,
    FilePdfOutlined,
} from '@ant-design/icons';
import { FormFieldConfig } from './types';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import { toast } from 'sonner';
import { AddressAutocomplete } from './AddressAutocomplete';
import { DurationPicker } from '../DurationPicker';
import { TimePicker } from 'antd';

export const compressImage = (file: File, quality = 0.7, maxWidth = 1920): Promise<File> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file);
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        (compressedFile as File & { uid?: string }).uid = (
                            file as File & { uid?: string }
                        ).uid;
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};
import { SpaceTreeSelect } from '../filters/SpaceTreeSelect';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

export const renderTextField = (field: FormFieldConfig) => {
    return (
        <Input
            placeholder={field.placeholder}
            size="middle"
            maxLength={field.maxLength}
            showCount={field.showCount}
            allowClear={field.allowClear}
            disabled={field.disabled as boolean}
            style={field.textTransform ? { textTransform: field.textTransform } : undefined}
        />
    );
};

export const renderEmailField = (field: FormFieldConfig) => {
    return (
        <Input
            type="email"
            placeholder={field.placeholder}
            size="middle"
            maxLength={field.maxLength}
            showCount={field.showCount}
            allowClear={field.allowClear}
            disabled={field.disabled as boolean}
        />
    );
};

export const renderPasswordField = (field: FormFieldConfig) => {
    return (
        <Input.Password
            placeholder={field.placeholder}
            size="middle"
            maxLength={field.maxLength}
            disabled={field.disabled as boolean}
            iconRender={(visible: boolean) =>
                visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
            }
        />
    );
};

export const renderNumberField = (field: FormFieldConfig) => {
    const allowDecimal = field.allowDecimal ?? false;
    const precision = allowDecimal ? (field.decimalPlaces ?? 2) : 0;

    const handleKeyPressInteger = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const key = e.key;
        const allowedKeys = [
            '0',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            'Backspace',
            'Delete',
            'Tab',
            'Enter',
            'ArrowLeft',
            'ArrowRight',
        ];

        if (!allowedKeys.includes(key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            return;
        }

        const input = e.currentTarget as HTMLInputElement;
        const currentValue = input.value || '';

        if (field.maxLength && /^[0-9]$/.test(key)) {
            if (
                currentValue.length >= field.maxLength &&
                input.selectionStart === input.selectionEnd
            ) {
                e.preventDefault();
                return;
            }
        }

        if (key === '0' && (currentValue === '' || currentValue === '0')) {
            e.preventDefault();
        }
    };

    const handleKeyPressDecimal = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const key = e.key;
        const allowedKeys = [
            '0',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '.',
            'Backspace',
            'Delete',
            'Tab',
            'Enter',
            'ArrowLeft',
            'ArrowRight',
        ];

        if (!allowedKeys.includes(key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            return;
        }

        const input = e.currentTarget as HTMLInputElement;
        const currentValue = input.value || '';

        if (field.maxLength && /^[0-9.]$/.test(key)) {
            if (
                currentValue.length >= field.maxLength &&
                input.selectionStart === input.selectionEnd
            ) {
                e.preventDefault();
                return;
            }
        }

        // Chỉ cho phép một dấu chấm
        if (key === '.') {
            if (currentValue.includes('.')) {
                e.preventDefault();
            }
        }
    };

    return (
        <InputNumber
            placeholder={field.placeholder}
            size="middle"
            style={{ width: '100%' }}
            disabled={field.disabled as boolean}
            onKeyPress={allowDecimal ? handleKeyPressDecimal : handleKeyPressInteger}
            controls={true}
            min={field.min}
            max={field.max}
            maxLength={field.maxLength}
            precision={precision}
            step={allowDecimal ? 0.1 : 1}
        />
    );
};

export const renderSelectField = (field: FormFieldConfig) => {
    const showTooltipOnOverflow = field.maxTagCount !== undefined && field.mode === 'multiple';

    return (
        <Select
            placeholder={field.placeholder}
            size="middle"
            options={field.options}
            loading={field.loading}
            disabled={(field.loading || field.disabled) as boolean}
            allowClear={field.allowClear}
            onChange={field.onChange}
            mode={field.mode}
            maxTagCount={field.maxTagCount}
            maxTagPlaceholder={
                showTooltipOnOverflow
                    ? (omittedValues) => {
                          const titles = omittedValues.map((v) => v.label).join(', ');
                          return (
                              <Tooltip title={titles} overlayStyle={{ maxWidth: 400 }}>
                                  <span>+{omittedValues.length} ...</span>
                              </Tooltip>
                          );
                      }
                    : undefined
            }
        />
    );
};

export const renderTextAreaField = (field: FormFieldConfig) => {
    return (
        <Input.TextArea
            placeholder={field.placeholder}
            size="middle"
            rows={field.rows || 3}
            showCount={field.showCount}
            maxLength={field.maxLength}
            allowClear={field.allowClear}
            disabled={field.disabled as boolean}
        />
    );
};

export const renderDateField = (field: FormFieldConfig) => {
    return (
        <DatePicker
            placeholder={field.placeholder}
            size="middle"
            style={{ width: '100%' }}
            disabled={field.disabled as boolean}
        />
    );
};

export const renderAddressAutocompleteField = (field: FormFieldConfig) => {
    return (
        <AddressAutocomplete placeholder={field.placeholder} disabled={field.disabled as boolean} />
    );
};

export const renderDurationField = (field: FormFieldConfig) => {
    return (
        <DurationPicker
            value={field.value}
            onChange={field.onChange}
            disabled={field.disabled as boolean}
        />
    );
};

export const renderSpaceTreeSelectField = (field: FormFieldConfig) => {
    return (
        <SpaceTreeSelect
            placeholder={field.placeholder}
            disabled={field.disabled as boolean}
            allowClear={field.allowClear !== false}
            onChange={field.onChange}
            treeData={field.treeData}
        />
    );
};

const ImageUploader = ({
    value,
    onChange,
    disabled,
    accept = 'image/*',
    maxFileSizeMB = 5,
    svgMaxFileSizeMB,
    previewAlt,
    supportText,
}: {
    value?: string | File | null;
    onChange?: (value: string | File) => void;
    disabled?: boolean;
    preserveOriginal?: boolean;
    accept?: string;
    maxFileSizeMB?: number;
    svgMaxFileSizeMB?: number;
    previewAlt?: string;
    supportText?: string;
}) => {
    const { t } = useTranslation();
    const [fileList, setFileList] = React.useState<UploadFile[]>([]);
    const [previewVisible, setPreviewVisible] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    useEffect(() => {
        if (value instanceof File) {
            const url = URL.createObjectURL(value);
            setPreviewUrl(url);
            setFileList([
                {
                    uid: (value as File & { uid?: string }).uid || '-1',
                    name: value.name,
                    status: 'done',
                    url,
                    originFileObj: value as unknown as RcFile,
                },
            ]);
        } else if (typeof value === 'string' && value) {
            setPreviewUrl(value);
            setFileList([
                {
                    uid: '-1',
                    name: value.split('/').pop() || 'image.jpg',
                    status: 'done',
                    url: value,
                },
            ]);
        } else {
            setPreviewUrl(null);
            setFileList([]);
        }
    }, [value]);

    const uploadProps: UploadProps = {
        beforeUpload: (file) => {
            const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
            const isImage = file.type.startsWith('image/') || isSvg;
            if (!isImage) {
                toast.error('You can only upload image files!');
                return Upload.LIST_IGNORE;
            }
            const fileMaxSizeMB = isSvg ? (svgMaxFileSizeMB ?? maxFileSizeMB) : maxFileSizeMB;
            const isLtMaxSize = file.size / 1024 / 1024 < fileMaxSizeMB;
            if (!isLtMaxSize) {
                toast.error(`${isSvg ? 'SVG' : 'Image'} must be smaller than ${fileMaxSizeMB}MB!`);
                return Upload.LIST_IGNORE;
            }
            onChange?.(file);
            return false;
        },
        maxCount: 1,
        accept,
        fileList,
        onRemove: () => {
            setFileList([]);
            setPreviewUrl(null);
            onChange?.('');
            return true;
        },
        showUploadList: false, // Hide the default file list
    };

    return (
        <>
            <Upload.Dragger {...uploadProps} disabled={disabled}>
                {fileList.length > 0 && fileList[0].url ? (
                    <div
                        style={{
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            position: 'relative',
                        }}
                    >
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: 300,
                            }}
                            className="machine-image-preview-container"
                        >
                            <img
                                src={fileList[0].url}
                                alt={previewAlt || t('common.upload.preview')}
                                style={{
                                    width: '100%',
                                    maxHeight: 200,
                                    objectFit: 'contain',
                                    borderRadius: 4,
                                }}
                            />

                            {/* Hover Overlay */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    borderRadius: 4,
                                    background: 'rgba(0, 0, 0, 0.6)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    opacity: 0,
                                    transition: 'opacity 0.3s',
                                    pointerEvents: 'none',
                                }}
                                className="image-upload-overlay"
                            >
                                <CameraOutlined style={{ fontSize: 32, color: '#fff' }} />
                                <div
                                    style={{
                                        width: 50,
                                        height: 1,
                                        background: 'rgba(255,255,255,0.3)',
                                    }}
                                />
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewVisible(true);
                                        }}
                                        style={{
                                            pointerEvents: 'auto',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '6px 10px',
                                            borderRadius: 4,
                                            background: 'rgba(255,255,255,0.2)',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background =
                                                'rgba(255,255,255,0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background =
                                                'rgba(255,255,255,0.2)';
                                        }}
                                    >
                                        <EyeOutlined style={{ fontSize: 24, color: '#fff' }} />
                                        <span
                                            style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}
                                        >
                                            {t('common.upload.preview')}
                                        </span>
                                    </div>
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFileList([]);
                                            setPreviewUrl(null);
                                            onChange?.('');
                                        }}
                                        style={{
                                            pointerEvents: 'auto',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '6px 10px',
                                            borderRadius: 4,
                                            background: 'rgba(255,59,48,0.8)',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,59,48,1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background =
                                                'rgba(255,59,48,0.8)';
                                        }}
                                    >
                                        <DeleteOutlined style={{ fontSize: 24, color: '#fff' }} />
                                        <span
                                            style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}
                                        >
                                            {t('common.upload.delete')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="ant-upload-drag-icon">
                            <CameraOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                        </p>
                        <p className="ant-upload-text">{t('common.upload.image.dragAndDrop')}</p>
                        <p className="ant-upload-hint">
                            {supportText || t('common.upload.image.supportText')}
                        </p>
                    </>
                )}
            </Upload.Dragger>

            {/* Manual Preview Modal */}
            <div style={{ display: 'none' }}>
                <Image.PreviewGroup
                    preview={{
                        open: previewVisible,
                        onOpenChange: (visible) => setPreviewVisible(visible),
                    }}
                >
                    <Image src={previewUrl || fileList[0]?.url || ''} alt="Image preview" />
                </Image.PreviewGroup>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    .machine-image-preview-container:hover .image-upload-overlay {
                        opacity: 1 !important;
                    }
                `,
                }}
            />
        </>
    );
};

export const renderImageField = (field: FormFieldConfig) => {
    return (
        <ImageUploader
            value={field.value}
            disabled={field.disabled as boolean}
            preserveOriginal={field.imageUpload?.preserveOriginal}
            accept={field.imageUpload?.accept}
            maxFileSizeMB={field.imageUpload?.maxFileSizeMB}
            svgMaxFileSizeMB={field.imageUpload?.svgMaxFileSizeMB}
            previewAlt={field.imageUpload?.previewAlt}
            supportText={field.imageUpload?.supportText}
        />
    );
};

const PdfUploader = ({
    value,
    onChange,
    disabled,
}: {
    value?: string | File;
    onChange?: (value: string | File) => void;
    disabled?: boolean;
}) => {
    const { t } = useTranslation();
    const [fileList, setFileList] = React.useState<UploadFile[]>([]);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

    useEffect(() => {
        // Cleanup old object URL
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    useEffect(() => {
        if (value) {
            if (value instanceof File) {
                // New file selected - create preview URL
                const url = URL.createObjectURL(value);
                setPreviewUrl(url);
                setFileList([
                    {
                        uid: '-1',
                        name: value.name,
                        status: 'done',
                    },
                ]);
            } else if (typeof value === 'string') {
                // Existing URL from server
                setPreviewUrl(value);
                const filename = value.split('/').pop() || 'document.pdf';
                setFileList([
                    {
                        uid: '-1',
                        name: filename,
                        status: 'done',
                        url: value,
                    },
                ]);
            }
        } else {
            setFileList([]);
            setPreviewUrl(null);
        }
    }, [value]);

    const customRequest = (options: Parameters<NonNullable<UploadProps['customRequest']>>[0]) => {
        const { file, onSuccess } = options;
        // Store File object instead of uploading
        onChange?.(file as File);
        onSuccess?.({ url: '' });
    };

    const uploadProps: UploadProps = {
        beforeUpload: (file) => {
            const isPdf = file.type === 'application/pdf';
            if (!isPdf) {
                toast.error(
                    t('common.upload.pdf.pdfOnly', { defaultValue: 'Only PDF files are allowed' })
                );
                return Upload.LIST_IGNORE;
            }
            const isLt16M = file.size / 1024 / 1024 < 16;
            if (!isLt16M) {
                message.error(
                    t('common.upload.pdf.fileSizeLimit', {
                        defaultValue: 'PDF must be smaller than 16MB',
                    })
                );
                return Upload.LIST_IGNORE;
            }
            return true;
        },
        customRequest,
        maxCount: 1,
        accept: '.pdf,application/pdf',
        fileList,
        onRemove: () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
            setFileList([]);
            setPreviewUrl(null);
            onChange?.('');
            return true;
        },
        showUploadList: false,
    };

    const currentFile = fileList[0];

    return (
        <Upload.Dragger {...uploadProps} disabled={disabled}>
            {currentFile ? (
                <div
                    style={{
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <span style={{ fontSize: 40 }}>
                        <FilePdfOutlined />
                    </span>
                    <p
                        style={{
                            margin: 0,
                            fontWeight: 600,
                            color: '#1890ff',
                            fontSize: 13,
                            maxWidth: 240,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {currentFile.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
                        {t('common.upload.pdf.clickToReplace', {
                            defaultValue: 'Click to replace',
                        })}
                    </p>
                </div>
            ) : (
                <>
                    <p className="ant-upload-drag-icon">
                        <span style={{ fontSize: 48 }}>
                            <FilePdfOutlined />
                        </span>
                    </p>
                    <p className="ant-upload-text">{t('common.upload.pdf.dragAndDrop')}</p>
                    <p className="ant-upload-hint">{t('common.upload.pdf.supportText')}</p>
                </>
            )}
        </Upload.Dragger>
    );
};

export const renderPdfField = (field: FormFieldConfig) => {
    return <PdfUploader value={field.value} disabled={field.disabled as boolean} />;
};

export const renderSwitchField = (field: FormFieldConfig) => {
    return <Switch disabled={field.disabled as boolean} />;
};

const TimePickerWrapper = ({
    value,
    onChange,
    placeholder,
    disabled,
}: {
    value?: string;
    onChange?: (value: string | null) => void;
    placeholder?: string;
    disabled?: boolean;
}) => (
    <TimePicker
        format="HH:mm A"
        style={{ width: '100%' }}
        placeholder={placeholder}
        disabled={disabled}
        value={value ? dayjs(value, 'HH:mm') : null}
        onChange={(time) => onChange?.(time ? time.format('HH:mm') : null)}
    />
);

/**
 * Main field renderer - routes to specific renderer based on field type
 */
export const renderField = (field: FormFieldConfig): React.ReactNode => {
    // If custom render function is provided, use it
    if (field.render) {
        return field.render(field);
    }

    // Otherwise, use default renderers based on type
    switch (field.type) {
        case 'text':
            return renderTextField(field);
        case 'time':
            return (
                <TimePickerWrapper
                    placeholder={field.placeholder}
                    disabled={field.disabled as boolean}
                />
            );
        case 'email':
            return renderEmailField(field);
        case 'password':
            return renderPasswordField(field);
        case 'number':
            return renderNumberField(field);
        case 'select':
            return renderSelectField(field);
        case 'textarea':
            return renderTextAreaField(field);
        case 'date':
            return renderDateField(field);
        case 'image':
            return renderImageField(field);
        case 'duration':
            return renderDurationField(field);
        case 'pdf-upload':
            return renderPdfField(field);
        case 'address-autocomplete':
            return renderAddressAutocompleteField(field);
        case 'space-tree-select':
            return renderSpaceTreeSelectField(field);
        case 'switch':
            return renderSwitchField(field);
        case 'custom':
            return field.renderCustom ? field.renderCustom(field.name) : null;
        default:
            return renderTextField(field);
    }
};
