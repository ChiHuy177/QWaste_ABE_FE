'use client';
import { useEffect, useState } from 'react';
import { Button, Upload, theme } from 'antd';
import { CameraOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface ImageUploadFieldProps {
    value?: string[];
    onChange?: (value: string[]) => void;
    disabled?: boolean;
}

export function ImageUploadField({ value, onChange, disabled }: ImageUploadFieldProps) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const [previews, setPreviews] = useState<string[]>(value ?? []);

    useEffect(() => {
        setPreviews(value ?? []);
    }, [value]);

    const handleRemove = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();

        const newImages = previews.filter((_, i) => i !== index);

        setPreviews(newImages);
        onChange?.(newImages);
    };

    return (
        <Upload.Dragger
            accept="image/*"
            multiple
            maxCount={10}
            showUploadList={false}
            disabled={disabled}
            beforeUpload={(file) => {
                const reader = new FileReader();

                reader.onload = (ev) => {
                    const dataUrl = ev.target?.result as string;

                    const newImages = [...previews, dataUrl];

                    setPreviews(newImages);
                    onChange?.(newImages);
                };

                reader.readAsDataURL(file);

                return false;
            }}
            style={{ borderRadius: 8 }}
        >
            {previews.length > 0 ? (
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 12,
                        padding: 12,
                    }}
                >
                    {previews.map((image, index) => (
                        <div
                            key={index}
                            style={{
                                position: 'relative',
                                width: 120,
                            }}
                        >
                            <img
                                src={image}
                                alt={`preview-${index}`}
                                style={{
                                    width: '100%',
                                    height: 120,
                                    objectFit: 'cover',
                                    borderRadius: 6,
                                }}
                            />

                            <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={(e) => handleRemove(index, e)}
                                style={{
                                    marginTop: 6,
                                    width: '100%',
                                }}
                            >
                                {t('maintenance.form.upload.remove')}
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ padding: '20px 0' }}>
                    <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
                        <CameraOutlined
                            style={{
                                fontSize: 36,
                                color: token.colorPrimary,
                            }}
                        />
                    </p>

                    <p
                        style={{
                            fontSize: 14,
                            color: token.colorText,
                            margin: '0 0 4px',
                        }}
                    >
                        {t('maintenance.form.upload.dragOrClick')}
                    </p>

                    <p
                        style={{
                            fontSize: 12,
                            color: token.colorTextSecondary,
                            margin: 0,
                        }}
                    >
                        {t('maintenance.form.upload.supported')}
                    </p>
                </div>
            )}
        </Upload.Dragger>
    );
}
