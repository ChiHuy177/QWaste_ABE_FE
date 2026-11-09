'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    Alert,
    Button,
    Card,
    Flex,
    Grid,
    Modal,
    Table,
    Tag,
    Typography,
    Upload,
    theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RcFile } from 'antd/es/upload/interface';
import {
    CloseCircleOutlined,
    DownloadOutlined,
    FileExcelOutlined,
    InboxOutlined,
    InfoCircleOutlined,
    ReloadOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import { MoldService } from '@/services/MoldService';
import { MoldImportRowError } from '@/types/Mold';
import { getApiErrorMessage } from '@/utils/apiError';

const { Dragger } = Upload;
const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface MoldImportModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

export const MoldImportModal = ({ open, onCancel, onSuccess }: MoldImportModalProps) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [rowErrors, setRowErrors] = useState<MoldImportRowError[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleReset = () => {
        setFile(null);
        setRowErrors([]);
        setErrorMessage(null);
    };

    const handleModalClose = () => {
        if (uploading) return;
        handleReset();
        onCancel();
    };

    const beforeUpload = (selectedFile: RcFile): boolean => {
        setRowErrors([]);
        setErrorMessage(null);

        if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
            toast.error(t('moldManagement.import.fileInvalidType'));
            return false;
        }

        if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
            toast.error(t('moldManagement.import.fileTooLarge'));
            return false;
        }

        setFile(selectedFile);
        return false;
    };

    const handleUpload = async () => {
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.xlsx')) {
            toast.error(t('moldManagement.import.fileInvalidType'));
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            toast.error(t('moldManagement.import.fileTooLarge'));
            return;
        }

        setUploading(true);
        setRowErrors([]);
        setErrorMessage(null);

        try {
            const response = await MoldService.importMolds(file);
            const result = response.result;

            if (result?.errors && result.errors.length > 0) {
                setRowErrors(result.errors);
                const msg = response.message || t('moldManagement.import.errorsTitle');
                setErrorMessage(msg);
                toast.error(msg);
                return;
            }

            if (!result || result.totalInserted === 0) {
                toast.warning(t('moldManagement.import.emptyDataWarning'));
                return;
            }

            const successMsg = response.message
                ? `${response.message} (${result.totalInserted} ${t('moldManagement.import.moldsCountUnit')})`
                : t('moldManagement.import.success', { count: result.totalInserted });

            toast.success(successMsg);
            handleReset();
            onSuccess();
        } catch (error: unknown) {
            const errorMsg = getApiErrorMessage(error, t('moldManagement.import.failed'));
            toast.error(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    const errorColumns: ColumnsType<MoldImportRowError> = [
        {
            title: t('moldManagement.import.errorTable.rowIndex'),
            dataIndex: 'rowIndex',
            key: 'rowIndex',
            width: 80,
            align: 'center',
            render: (value: number) => (
                <Tag color="volcano" style={{ margin: 0, fontWeight: 600 }}>
                    #{value}
                </Tag>
            ),
        },
        {
            title: t('moldManagement.import.errorTable.column'),
            dataIndex: 'column',
            key: 'column',
            width: 140,
            render: (value: string) => <Tag style={{ margin: 0 }}>{value}</Tag>,
        },
        {
            title: t('moldManagement.import.errorTable.message'),
            dataIndex: 'message',
            key: 'message',
            render: (value: string) => (
                <Text type="danger" style={{ fontSize: 13 }}>
                    {value}
                </Text>
            ),
        },
    ];

    const hasErrors = rowErrors.length > 0;

    return (
        <Modal
            title={
                <Flex align="center" gap={8}>
                    <FileExcelOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />
                    <Title level={5} style={{ margin: 0 }}>
                        {t('moldManagement.import.modalTitle')}
                    </Title>
                </Flex>
            }
            open={open}
            onCancel={handleModalClose}
            width={isMobile ? '95%' : 720}
            destroyOnHidden
            footer={
                hasErrors ? (
                    <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                            disabled={uploading}
                        >
                            {t('moldManagement.import.selectOtherFile')}
                        </Button>
                        <Button onClick={handleModalClose} disabled={uploading}>
                            {t('common.close')}
                        </Button>
                    </Flex>
                ) : (
                    <Flex justify="flex-end" align="center" gap={8}>
                        <Button onClick={handleModalClose} disabled={uploading}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            loading={uploading}
                            disabled={!file}
                            onClick={handleUpload}
                        >
                            {t('moldManagement.import.submitButton')}
                        </Button>
                    </Flex>
                )
            }
        >
            <Flex vertical gap={16} style={{ marginTop: 12 }}>
                {/* Guidelines and Sample Template Download */}
                <Card
                    size="small"
                    style={{
                        background: token.colorFillAlter,
                        borderColor: token.colorBorderSecondary,
                    }}
                >
                    <Flex vertical gap={8}>
                        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                            <Flex align="center" gap={6}>
                                <InfoCircleOutlined style={{ color: token.colorPrimary }} />
                                <Text strong style={{ fontSize: 13 }}>
                                    {t('moldManagement.import.templateGuide')}
                                </Text>
                            </Flex>
                            <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                href="/templates/mold_import_template.xlsx"
                                download="mold_import_template.xlsx"
                            >
                                {t('moldManagement.import.downloadTemplate')}
                            </Button>
                        </Flex>
                        <ul
                            style={{
                                margin: 0,
                                paddingLeft: 18,
                                color: token.colorTextSecondary,
                                fontSize: 12,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                            }}
                        >
                            <li>{t('moldManagement.import.guideRow13')}</li>
                            <li>
                                <strong>{t('moldManagement.import.guideRow4')}</strong>
                            </li>
                            <li>{t('moldManagement.import.guideMoldTypeNote')}</li>
                            <li>{t('moldManagement.import.guideRow5')}</li>
                            <li>{t('moldManagement.import.guideAllOrNothing')}</li>
                        </ul>
                    </Flex>
                </Card>

                {/* File Upload / Selected File Area */}
                {!hasErrors ? (
                    file ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 16px',
                                border: `1px solid ${token.colorSuccessBorder}`,
                                borderRadius: token.borderRadiusLG,
                                background: token.colorSuccessBg,
                            }}
                        >
                            <FileExcelOutlined
                                style={{ fontSize: 24, color: token.colorSuccess, flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Text strong ellipsis style={{ display: 'block', fontSize: 14 }}>
                                    {file.name}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </Text>
                            </div>
                            {!uploading && (
                                <Button
                                    type="text"
                                    shape="circle"
                                    icon={<CloseCircleOutlined />}
                                    onClick={handleReset}
                                    style={{ color: token.colorTextTertiary }}
                                />
                            )}
                        </div>
                    ) : (
                        <Dragger
                            accept=".xlsx"
                            maxCount={1}
                            showUploadList={false}
                            beforeUpload={beforeUpload}
                            disabled={uploading}
                            style={{
                                background: token.colorBgContainer,
                                borderRadius: token.borderRadiusLG,
                                borderColor: token.colorBorderSecondary,
                                padding: '24px 16px',
                            }}
                        >
                            <p className="ant-upload-drag-icon" style={{ marginBottom: 12 }}>
                                <InboxOutlined
                                    style={{ color: token.colorPrimary, fontSize: 42 }}
                                />
                            </p>
                            <p
                                className="ant-upload-text"
                                style={{
                                    fontSize: 15,
                                    fontWeight: 500,
                                    color: token.colorText,
                                    marginBottom: 6,
                                }}
                            >
                                {t('moldManagement.import.dragText')}
                            </p>
                            <p
                                className="ant-upload-hint"
                                style={{
                                    fontSize: 12,
                                    color: token.colorTextSecondary,
                                    margin: 0,
                                }}
                            >
                                {t('moldManagement.import.hint')}
                            </p>
                        </Dragger>
                    )
                ) : null}

                {/* Validation Errors View */}
                {hasErrors && (
                    <Flex vertical gap={12}>
                        <Alert
                            type="error"
                            showIcon
                            message={errorMessage || t('moldManagement.import.errorsTitle')}
                            description={t('moldManagement.import.errorsDescription', {
                                count: rowErrors.length,
                            })}
                        />
                        <Table<MoldImportRowError>
                            size="small"
                            dataSource={rowErrors}
                            rowKey={(record) => `${record.rowIndex}-${record.column}`}
                            columns={errorColumns}
                            pagination={{
                                pageSize: 5,
                                size: 'small',
                                showTotal: (total) =>
                                    `${total} ${t('moldManagement.import.errorTable.errorCountUnit', 'lỗi')}`,
                            }}
                            scroll={{ y: 260 }}
                        />
                    </Flex>
                )}
            </Flex>
        </Modal>
    );
};
