'use client';

import { useState } from 'react';
import { Upload, Typography, theme } from 'antd';
import { InboxOutlined, FileExcelOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';

const { Dragger } = Upload;
const { Text } = Typography;

const EXCEL_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
];
const MAX_FILE_SIZE_MB = 10;

interface ExcelUploadProps {
    onFileSelect: (file: File | null) => void;
    disabled?: boolean;
    maxSizeMb?: number;
    hint?: string;
}

export const ExcelUpload = ({
    onFileSelect,
    disabled = false,
    maxSizeMb = MAX_FILE_SIZE_MB,
    hint,
}: ExcelUploadProps) => {
    const { token } = theme.useToken();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const beforeUpload = (file: RcFile): boolean => {
        setError(null);

        const isExcel = EXCEL_MIME_TYPES.includes(file.type) || file.name.match(/\.(xlsx|xls)$/i);
        if (!isExcel) {
            setError('Chỉ chấp nhận file Excel (.xlsx, .xls)');
            return false;
        }

        const isUnderLimit = file.size / 1024 / 1024 < maxSizeMb;
        if (!isUnderLimit) {
            setError(`File phải nhỏ hơn ${maxSizeMb}MB`);
            return false;
        }

        setSelectedFile(file);
        onFileSelect(file);
        return false; // ngăn auto-upload
    };

    const handleRemove = () => {
        setSelectedFile(null);
        setError(null);
        onFileSelect(null);
    };

    if (selectedFile) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    border: `1px solid ${token.colorSuccessBorder}`,
                    borderRadius: token.borderRadius,
                    background: token.colorSuccessBg,
                }}
            >
                <FileExcelOutlined
                    style={{ fontSize: 20, color: token.colorSuccess, flexShrink: 0 }}
                />
                <Text
                    style={{ flex: 1, color: token.colorText }}
                    ellipsis={{ tooltip: selectedFile.name }}
                >
                    {selectedFile.name}
                </Text>
                <Text type="secondary" style={{ flexShrink: 0, fontSize: 12 }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Text>
                {!disabled && (
                    <CloseCircleOutlined
                        onClick={handleRemove}
                        style={{
                            color: token.colorTextTertiary,
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div>
            <Dragger
                disabled={disabled}
                beforeUpload={beforeUpload}
                accept=".xlsx,.xls"
                maxCount={1}
                showUploadList={false}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click hoặc kéo file vào đây để tải lên</p>
                <p className="ant-upload-hint">
                    {hint ?? `Hỗ trợ .xlsx, .xls — tối đa ${maxSizeMb}MB`}
                </p>
            </Dragger>
            {error && (
                <Text type="danger" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                    {error}
                </Text>
            )}
        </div>
    );
};
