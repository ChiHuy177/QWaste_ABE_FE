'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Button, Image } from 'antd';
import { UploadOutlined, FilePdfOutlined, FileImageOutlined } from '@ant-design/icons';
import { getBase64 } from '../utils/formatters';
import { PDF_ICON_SVG } from '../constants';

interface OrderAttachmentsUploaderProps {
    value?: any[];
    onChange?: (value: any[]) => void;
}

export const OrderAttachmentsUploader: React.FC<OrderAttachmentsUploaderProps> = ({
    value = [],
    onChange,
}) => {
    const { t } = useTranslation();
    const [fileList, setFileList] = useState<any[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    useEffect(() => {
        if (value) {
            const mappedList = value.map((item: any, idx: number) => {
                if (item.uid && item.name) {
                    return item;
                }
                const isPdf =
                    item.attachmentName?.toLowerCase().endsWith('.pdf') ||
                    item.attachmentUrl?.toLowerCase().split('?')[0].endsWith('.pdf') ||
                    item.attachmentUrl?.toLowerCase().includes('.pdf');
                return {
                    uid: item.attachmentUrl || String(idx),
                    name: item.attachmentName,
                    status: 'done',
                    url: item.attachmentUrl,
                    thumbUrl: isPdf ? PDF_ICON_SVG : item.attachmentUrl,
                };
            });

            const valueUids = mappedList.map((f: any) => f.uid || f.url || f.name).join(',');
            const currentUids = fileList.map((f: any) => f.uid || f.url || f.name).join(',');

            if (valueUids !== currentUids) {
                setFileList(mappedList);
            }
        } else {
            setFileList([]);
        }
    }, [value]);

    const beforeUpload = (file: File) => {
        return false;
    };

    const handleUploadChange = ({ fileList: newFileList }: any) => {
        const processedList = newFileList.map((file: any) => {
            if (file.originFileObj && !file.thumbUrl && !file.url) {
                const isPdf =
                    file.type === 'application/pdf' ||
                    file.type?.toLowerCase().includes('pdf') ||
                    file.name?.toLowerCase().endsWith('.pdf');
                if (isPdf) {
                    file.thumbUrl = PDF_ICON_SVG;
                } else {
                    const isImage =
                        file.type?.startsWith('image/') ||
                        file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    if (isImage) {
                        file.thumbUrl = URL.createObjectURL(file.originFileObj);
                    }
                }
            }
            return file;
        });
        setFileList(processedList);
        onChange?.(processedList);
    };

    const handlePreview = async (file: any) => {
        let url = file.url || file.response?.url;
        const name = file.name || '';
        const isPdf =
            file.type === 'application/pdf' ||
            file.type?.toLowerCase().includes('pdf') ||
            name.toLowerCase().endsWith('.pdf') ||
            url?.toLowerCase().split('?')[0].endsWith('.pdf') ||
            url?.toLowerCase().includes('.pdf');

        if (isPdf) {
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            } else if (file.originFileObj) {
                const localUrl = URL.createObjectURL(file.originFileObj);
                window.open(localUrl, '_blank', 'noopener,noreferrer');
            }
            return;
        }

        if (!url && file.originFileObj) {
            file.preview = await getBase64(file.originFileObj as File);
            url = file.preview;
        }

        setPreviewImage(url || '');
        setPreviewOpen(true);
        setPreviewTitle(
            file.name || url?.substring(url.lastIndexOf('/') + 1) || t('common.upload.preview')
        );
    };

    const handleIconRender = (file: any) => {
        const name = file.name || '';
        const isPdf =
            file.type === 'application/pdf' ||
            file.type?.toLowerCase().includes('pdf') ||
            name.toLowerCase().endsWith('.pdf') ||
            file.url?.toLowerCase().includes('.pdf');
        if (isPdf) {
            return <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
        }
        return <FileImageOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
    };

    return (
        <>
            <Upload
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleUploadChange}
                onPreview={handlePreview}
                iconRender={handleIconRender}
                showUploadList={{
                    showRemoveIcon: true,
                    showPreviewIcon: true,
                }}
                listType="picture"
                multiple={true}
            >
                <Button icon={<UploadOutlined />}>
                    {t('orderManagement.form.attachments.uploadButton')}
                </Button>
            </Upload>
            <div style={{ display: 'none' }}>
                <Image
                    src={previewImage}
                    alt="Order attachment preview"
                    preview={{
                        open: previewOpen,
                        onOpenChange: (visible) => setPreviewOpen(visible),
                        src: previewImage,
                    }}
                />
            </div>
        </>
    );
};
